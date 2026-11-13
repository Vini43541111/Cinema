import { conflito, naoEncontrado, regraNegocio } from '../lib/errors';
import { salaRepository } from '../repositories/sala.repository';

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface SalaEntrada {
  nome: string;
  /** Quantidade de filas (A, B, C...) */
  filas: number;
  /** Assentos por fila (1..N) */
  assentosPorFila: number;
}

export const salaService = {
  async listar() {
    const salas = await salaRepository.listar();
    return salas.map((s) => ({ id: s.id, nome: s.nome, capacidade: s._count.assentos }));
  },

  async buscar(id: number) {
    const sala = await salaRepository.buscarPorId(id);
    if (!sala) throw naoEncontrado('Sala');
    return {
      id: sala.id,
      nome: sala.nome,
      capacidade: sala.assentos.length,
      assentos: sala.assentos.map((a) => ({ id: a.id, fila: a.fila, numero: a.numero })),
    };
  },

  /** Cria a sala e seu conjunto fixo de assentos (fila x número). */
  async criar(dados: SalaEntrada) {
    const nome = dados.nome.trim();
    if (dados.filas < 1 || dados.filas > LETRAS.length) {
      throw regraNegocio(`A sala deve ter entre 1 e ${LETRAS.length} filas`);
    }
    if (dados.assentosPorFila < 1 || dados.assentosPorFila > 40) {
      throw regraNegocio('Cada fila deve ter entre 1 e 40 assentos');
    }
    if (await salaRepository.buscarPorNome(nome)) throw conflito('Já existe uma sala com esse nome');

    const assentos: { fila: string; numero: number }[] = [];
    for (let f = 0; f < dados.filas; f++) {
      for (let n = 1; n <= dados.assentosPorFila; n++) assentos.push({ fila: LETRAS[f], numero: n });
    }
    const sala = await salaRepository.criarComAssentos(nome, assentos);
    return { id: sala.id, nome: sala.nome, capacidade: sala._count.assentos };
  },

  async renomear(id: number, nome: string) {
    await this.buscar(id);
    const existente = await salaRepository.buscarPorNome(nome.trim());
    if (existente && existente.id !== id) throw conflito('Já existe uma sala com esse nome');
    const s = await salaRepository.renomear(id, nome.trim());
    return { id: s.id, nome: s.nome };
  },

  async excluir(id: number) {
    await this.buscar(id);
    if ((await salaRepository.contarSessoes(id)) > 0) {
      throw conflito('Sala possui sessões cadastradas e não pode ser excluída');
    }
    await salaRepository.excluir(id);
  },
};
