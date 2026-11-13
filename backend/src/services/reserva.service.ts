import { CanalVenda, MetodoPagamento, Papel, Prisma, StatusAssento, StatusReserva } from '@prisma/client';
import { env } from '../config/env';
import { gerarCodigoIngresso } from '../lib/codigo';
import { AppError, conflito, naoEncontrado, proibido, regraNegocio } from '../lib/errors';
import { dinheiro } from '../lib/numero';
import { prisma } from '../lib/prisma';
import type { Db } from '../repositories/db';
import { ingressoRepository } from '../repositories/ingresso.repository';
import { pagamentoRepository } from '../repositories/pagamento.repository';
import { reservaRepository } from '../repositories/reserva.repository';
import { sessaoRepository } from '../repositories/sessao.repository';
import { sessaoAssentoRepository } from '../repositories/sessao-assento.repository';
import type { UsuarioAutenticado } from '../types';
import { statusEfetivo } from './sessao.service';

export const MAX_ASSENTOS_POR_COMPRA = 10;

/** Opções das transações de compra: espera curta por lock e tempo máximo de execução. */
const OPCOES_TX = { maxWait: 5_000, timeout: 15_000 } as const;

type ReservaDetalhe = NonNullable<Awaited<ReturnType<typeof reservaRepository.buscarDetalhe>>>;

function paraDTO(r: ReservaDetalhe) {
  return {
    id: r.id,
    status: r.status,
    canal: r.canal,
    total: dinheiro(r.total),
    expiraEm: r.status === StatusReserva.PENDENTE ? r.expiraEm : null,
    criadoEm: r.criadoEm,
    sessao: {
      id: r.sessao.id,
      inicio: r.sessao.inicio,
      preco: dinheiro(r.sessao.preco),
      filme: r.sessao.filme.titulo,
      sala: r.sessao.sala.nome,
    },
    assentos:
      r.ingressos.length > 0
        ? r.ingressos.map((i) => ({ fila: i.assento.fila, numero: i.assento.numero }))
        : r.assentos.map((a) => ({ fila: a.assento.fila, numero: a.assento.numero })),
    pagamento: r.pagamento
      ? { metodo: r.pagamento.metodo, valor: dinheiro(r.pagamento.valor), pagoEm: r.pagamento.pagoEm }
      : null,
    ingressos: r.ingressos.map((i) => ({
      codigo: i.codigo,
      status: i.status,
      fila: i.assento.fila,
      numero: i.assento.numero,
    })),
  };
}

/** Converte erros de concorrência do PostgreSQL em 409 (deadlock, serialização, unicidade). */
function traduzirErroConcorrencia(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(e.code)) {
    throw conflito('Um ou mais assentos acabaram de ser vendidos para outro cliente. Escolha outros assentos.');
  }
  const msg = e instanceof Error ? e.message : '';
  if (/deadlock|could not serialize|40P01|40001/i.test(msg)) {
    throw conflito('Disputa pelo mesmo assento. Tente novamente.');
  }
  throw e;
}

/**
 * Regra central: reserva os assentos dentro de uma transação, com bloqueio
 * pessimista (SELECT ... FOR UPDATE) das linhas de sessao_assento.
 * Se dois clientes clicarem no mesmo assento no mesmo instante, o segundo
 * espera o primeiro terminar e, ao reler a linha, a encontra RESERVADA → 409.
 */
async function reservarNaTransacao(
  tx: Db,
  usuario: UsuarioAutenticado,
  sessaoId: number,
  assentoIds: number[],
  canal: CanalVenda,
) {
  const ids = [...new Set(assentoIds)];
  if (ids.length !== assentoIds.length) throw regraNegocio('Assentos repetidos na seleção');
  if (ids.length < 1 || ids.length > MAX_ASSENTOS_POR_COMPRA) {
    throw regraNegocio(`Selecione de 1 a ${MAX_ASSENTOS_POR_COMPRA} assentos`);
  }

  const sessao = await sessaoRepository.buscarPorId(sessaoId, tx);
  if (!sessao) throw naoEncontrado('Sessão');
  if (sessao.inicio.getTime() <= Date.now()) throw regraNegocio('A sessão já começou; vendas encerradas');

  const linhas = await sessaoAssentoRepository.bloquearParaAtualizacao(sessaoId, ids, tx);
  if (linhas.length !== ids.length) throw regraNegocio('Um ou mais assentos não pertencem à sala desta sessão');

  const agora = new Date();
  const indisponiveis = linhas.filter((l) => statusEfetivo(l.status, l.expiraEm, agora) !== StatusAssento.LIVRE);
  if (indisponiveis.length > 0) {
    throw conflito('Um ou mais assentos não estão mais disponíveis', {
      assentoIds: indisponiveis.map((l) => l.assentoId),
    });
  }

  // Reservas vencidas que ainda "seguravam" algum desses assentos passam a EXPIRADA
  const reservasVencidas = [...new Set(linhas.map((l) => l.reservaId).filter((id): id is number => id !== null))];
  for (const id of reservasVencidas) {
    await reservaRepository.atualizarStatus(id, StatusReserva.EXPIRADA, tx);
  }

  const expiraEm = new Date(agora.getTime() + env.RESERVA_MINUTOS * 60_000);
  const total = dinheiro(sessao.preco) * ids.length; // total calculado no servidor, nunca vem do front
  const reserva = await reservaRepository.criar({ usuarioId: usuario.id, sessaoId, total, expiraEm, canal }, tx);

  const atualizados = await sessaoAssentoRepository.marcarReservados(
    linhas.map((l) => l.id),
    reserva.id,
    expiraEm,
    tx,
  );
  if (atualizados.count !== ids.length) throw conflito('Falha ao reservar os assentos. Tente novamente.');

  return reserva.id;
}

/** Confirma o pagamento (simulado) e emite um ingresso com código único por assento. */
async function pagarNaTransacao(tx: Db, usuario: UsuarioAutenticado, reservaId: number, metodo: MetodoPagamento) {
  const reserva = await reservaRepository.bloquear(reservaId, tx);
  if (!reserva) throw naoEncontrado('Reserva');
  if (reserva.usuarioId !== usuario.id && usuario.papel !== Papel.OPERADOR) throw proibido();

  if (reserva.status === StatusReserva.PAGA) throw conflito('Esta reserva já foi paga');
  if (reserva.status !== StatusReserva.PENDENTE) throw regraNegocio(`Reserva ${reserva.status.toLowerCase()}`);

  const assentos = await sessaoAssentoRepository.bloquearDaReserva(reservaId, tx);
  const agora = new Date();
  const aindaReservados = assentos.filter((a) => a.status === StatusAssento.RESERVADO);

  if (reserva.expiraEm <= agora || aindaReservados.length === 0) {
    throw new AppError(410, 'O prazo da reserva expirou. Os assentos foram liberados; faça uma nova reserva.');
  }

  await sessaoAssentoRepository.marcarVendidos(reservaId, tx);
  const valorUnitario = dinheiro(reserva.total) / aindaReservados.length;
  await pagamentoRepository.criar({ reservaId, metodo, valor: dinheiro(reserva.total) }, tx);
  await ingressoRepository.criarVarios(
    aindaReservados.map((a) => ({
      codigo: gerarCodigoIngresso(),
      reservaId,
      sessaoId: reserva.sessaoId,
      assentoId: a.assentoId,
      valor: valorUnitario,
    })),
    tx,
  );
  await reservaRepository.atualizarStatus(reservaId, StatusReserva.PAGA, tx);
}

export const reservaService = {
  async reservar(usuario: UsuarioAutenticado, sessaoId: number, assentoIds: number[]) {
    try {
      const id = await prisma.$transaction(
        (tx) => reservarNaTransacao(tx, usuario, sessaoId, assentoIds, CanalVenda.ONLINE),
        OPCOES_TX,
      );
      return this.buscar(usuario, id);
    } catch (e) {
      traduzirErroConcorrencia(e);
    }
  },

  async pagar(usuario: UsuarioAutenticado, reservaId: number, metodo: MetodoPagamento) {
    try {
      await prisma.$transaction((tx) => pagarNaTransacao(tx, usuario, reservaId, metodo), OPCOES_TX);
    } catch (e) {
      if (e instanceof AppError && e.status === 410) {
        // Libera os assentos imediatamente (fora da transação que falhou)
        await prisma.$transaction(async (tx) => {
          await sessaoAssentoRepository.liberarDaReserva(reservaId, tx);
          await reservaRepository.atualizarStatus(reservaId, StatusReserva.EXPIRADA, tx);
        });
      }
      traduzirErroConcorrencia(e);
    }
    return this.buscar(usuario, reservaId);
  },

  /** Venda presencial no balcão: reserva + pagamento em UMA única transação. */
  async vendaBalcao(operador: UsuarioAutenticado, sessaoId: number, assentoIds: number[], metodo: MetodoPagamento) {
    try {
      const id = await prisma.$transaction(async (tx) => {
        const reservaId = await reservarNaTransacao(tx, operador, sessaoId, assentoIds, CanalVenda.BALCAO);
        await pagarNaTransacao(tx, operador, reservaId, metodo);
        return reservaId;
      }, OPCOES_TX);
      return this.buscar(operador, id);
    } catch (e) {
      traduzirErroConcorrencia(e);
    }
  },

  async cancelar(usuario: UsuarioAutenticado, reservaId: number) {
    await prisma.$transaction(async (tx) => {
      const reserva = await reservaRepository.bloquear(reservaId, tx);
      if (!reserva) throw naoEncontrado('Reserva');
      if (reserva.usuarioId !== usuario.id && usuario.papel !== Papel.OPERADOR) throw proibido();
      if (reserva.status !== StatusReserva.PENDENTE) {
        throw regraNegocio('Somente reservas pendentes podem ser canceladas');
      }
      await sessaoAssentoRepository.liberarDaReserva(reservaId, tx);
      await reservaRepository.atualizarStatus(reservaId, StatusReserva.CANCELADA, tx);
    });
    return this.buscar(usuario, reservaId);
  },

  async buscar(usuario: UsuarioAutenticado, reservaId: number) {
    const r = await reservaRepository.buscarDetalhe(reservaId);
    if (!r) throw naoEncontrado('Reserva');
    if (r.usuarioId !== usuario.id && usuario.papel !== Papel.OPERADOR) throw naoEncontrado('Reserva');
    return paraDTO(r);
  },

  async minhas(usuario: UsuarioAutenticado) {
    const lista = await reservaRepository.listarDoUsuario(usuario.id);
    return lista.map(paraDTO);
  },

  /** Chamado pelo job periódico (stored procedure sp_expirar_reservas). */
  expirarVencidas() {
    return reservaRepository.expirarVencidas();
  },
};
