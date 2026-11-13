import { StatusIngresso } from '@prisma/client';
import { conflito, naoEncontrado, regraNegocio } from '../lib/errors';
import { dinheiro } from '../lib/numero';
import { ingressoRepository } from '../repositories/ingresso.repository';
import type { UsuarioAutenticado } from '../types';

/** Portaria abre 2h antes da sessão e aceita entrada até o fim dela. */
const ABERTURA_ANTECEDENCIA_MIN = 120;

type IngressoDetalhe = NonNullable<Awaited<ReturnType<typeof ingressoRepository.buscarPorCodigo>>>;

const paraDTO = (i: IngressoDetalhe) => ({
  codigo: i.codigo,
  status: i.status,
  valor: dinheiro(i.valor),
  emitidoEm: i.emitidoEm,
  utilizadoEm: i.utilizadoEm,
  assento: `${i.assento.fila}${i.assento.numero}`,
  fila: i.assento.fila,
  numero: i.assento.numero,
  sessao: {
    id: i.sessao.id,
    inicio: i.sessao.inicio,
    fim: i.sessao.fim,
    filme: i.sessao.filme.titulo,
    classificacao: i.sessao.filme.classificacao,
    sala: i.sessao.sala.nome,
  },
});

export const ingressoService = {
  async meus(usuario: UsuarioAutenticado) {
    const lista = await ingressoRepository.listarDoUsuario(usuario.id);
    return lista.map(paraDTO);
  },

  async consultar(codigo: string) {
    const ingresso = await ingressoRepository.buscarPorCodigo(codigo.trim().toUpperCase());
    if (!ingresso) throw naoEncontrado('Ingresso');
    return paraDTO(ingresso);
  },

  /** Validação na entrada: marca como UTILIZADO de forma atômica (não aceita uso duplo). */
  async validar(operador: UsuarioAutenticado, codigo: string) {
    const ingresso = await ingressoRepository.buscarPorCodigo(codigo.trim().toUpperCase());
    if (!ingresso) throw naoEncontrado('Ingresso');

    if (ingresso.status === StatusIngresso.UTILIZADO) {
      throw conflito('Ingresso já utilizado', { utilizadoEm: ingresso.utilizadoEm });
    }

    const agora = Date.now();
    const abertura = ingresso.sessao.inicio.getTime() - ABERTURA_ANTECEDENCIA_MIN * 60_000;
    if (agora < abertura) throw regraNegocio('A entrada para esta sessão ainda não foi liberada');
    if (agora > ingresso.sessao.fim.getTime()) throw regraNegocio('Esta sessão já foi encerrada');

    const r = await ingressoRepository.marcarUtilizado(ingresso.id, operador.id);
    if (r.count === 0) throw conflito('Ingresso já utilizado');

    return paraDTO((await ingressoRepository.buscarPorCodigo(ingresso.codigo))!);
  },
};
