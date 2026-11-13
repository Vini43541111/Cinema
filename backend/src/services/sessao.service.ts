import { StatusAssento } from '@prisma/client';
import { conflito, naoEncontrado, regraNegocio } from '../lib/errors';
import { dinheiro } from '../lib/numero';
import { filmeRepository } from '../repositories/filme.repository';
import { salaRepository } from '../repositories/sala.repository';
import { sessaoRepository } from '../repositories/sessao.repository';
import { sessaoAssentoRepository } from '../repositories/sessao-assento.repository';

/** Intervalo de limpeza da sala entre sessões. */
const INTERVALO_LIMPEZA_MIN = 15;

type SessaoComResumo = NonNullable<Awaited<ReturnType<typeof sessaoRepository.buscarPorId>>>;

const paraDTO = (s: SessaoComResumo) => ({
  id: s.id,
  inicio: s.inicio,
  fim: s.fim,
  preco: dinheiro(s.preco),
  filme: s.filme,
  sala: s.sala,
});

/**
 * Estado efetivo do assento: uma reserva vencida (expira_em no passado) já é
 * considerada LIVRE, mesmo antes do job de expiração rodar.
 */
export function statusEfetivo(status: StatusAssento, expiraEm: Date | null, agora = new Date()): StatusAssento {
  if (status === StatusAssento.RESERVADO && expiraEm && expiraEm <= agora) return StatusAssento.LIVRE;
  return status;
}

export const sessaoService = {
  async listar(filtro: { filmeId?: number; data?: string; incluirPassadas?: boolean }) {
    let de: Date | undefined;
    let ate: Date | undefined;
    if (filtro.data) {
      de = new Date(`${filtro.data}T00:00:00-03:00`);
      ate = new Date(de.getTime() + 24 * 60 * 60 * 1000);
    } else if (!filtro.incluirPassadas) {
      de = new Date();
    }
    const sessoes = await sessaoRepository.listar({ filmeId: filtro.filmeId, de, ate });
    return sessoes.map(paraDTO);
  },

  async buscar(id: number) {
    const s = await sessaoRepository.buscarPorId(id);
    if (!s) throw naoEncontrado('Sessão');
    return paraDTO(s);
  },

  async criar(dados: { filmeId: number; salaId: number; inicio: Date; preco: number }) {
    const filme = await filmeRepository.buscarPorId(dados.filmeId);
    if (!filme) throw naoEncontrado('Filme');
    if (!filme.ativo) throw regraNegocio('Não é possível criar sessão para filme inativo');

    const sala = await salaRepository.buscarPorId(dados.salaId);
    if (!sala) throw naoEncontrado('Sala');
    if (sala.assentos.length === 0) throw regraNegocio('A sala não possui assentos');

    if (dados.inicio.getTime() <= Date.now()) throw regraNegocio('A sessão deve ser em uma data futura');
    if (dados.preco <= 0) throw regraNegocio('O preço deve ser maior que zero');

    const fim = new Date(dados.inicio.getTime() + filme.duracaoMinutos * 60_000);
    const fimComLimpeza = new Date(fim.getTime() + INTERVALO_LIMPEZA_MIN * 60_000);
    const inicioComLimpeza = new Date(dados.inicio.getTime() - INTERVALO_LIMPEZA_MIN * 60_000);

    const choque = await sessaoRepository.buscarConflito(dados.salaId, inicioComLimpeza, fimComLimpeza);
    if (choque) {
      throw conflito(`Conflito de horário com a sessão de "${choque.filme.titulo}" na ${choque.sala.nome}`, {
        sessaoId: choque.id,
        inicio: choque.inicio,
        fim: choque.fim,
      });
    }

    // O trigger trg_sessao_gerar_mapa gera o mapa de assentos (todos LIVRE)
    const sessao = await sessaoRepository.criar({ ...dados, fim });
    return paraDTO(sessao);
  },

  async excluir(id: number) {
    await this.buscar(id);
    if ((await sessaoRepository.contarReservas(id)) > 0) {
      throw conflito('Sessão já possui reservas ou vendas e não pode ser excluída');
    }
    await sessaoRepository.excluir(id);
  },

  /** Mapa de assentos agrupado por fila, com estado efetivo (livre, reservado, vendido). */
  async mapa(id: number) {
    const sessao = await this.buscar(id);
    const linhas = await sessaoAssentoRepository.mapa(id);
    const agora = new Date();

    const filas = new Map<string, { assentoId: number; numero: number; status: StatusAssento }[]>();
    const resumo = { LIVRE: 0, RESERVADO: 0, VENDIDO: 0 } as Record<StatusAssento, number>;

    for (const l of linhas) {
      const status = statusEfetivo(l.status, l.expiraEm, agora);
      resumo[status]++;
      if (!filas.has(l.assento.fila)) filas.set(l.assento.fila, []);
      filas.get(l.assento.fila)!.push({ assentoId: l.assentoId, numero: l.assento.numero, status });
    }

    return {
      sessao,
      resumo: { capacidade: linhas.length, livres: resumo.LIVRE, reservados: resumo.RESERVADO, vendidos: resumo.VENDIDO },
      filas: [...filas.entries()].map(([fila, assentos]) => ({ fila, assentos })),
    };
  },
};
