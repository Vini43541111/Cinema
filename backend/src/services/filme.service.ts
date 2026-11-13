import { conflito, naoEncontrado } from '../lib/errors';
import { filmeRepository } from '../repositories/filme.repository';

export interface FilmeEntrada {
  titulo: string;
  descricao?: string | null;
  duracaoMinutos: number;
  classificacao: string;
}

export const filmeService = {
  listar(incluirInativos: boolean) {
    return filmeRepository.listar(!incluirInativos);
  },

  async buscar(id: number) {
    const filme = await filmeRepository.buscarPorId(id);
    if (!filme) throw naoEncontrado('Filme');
    return filme;
  },

  criar(dados: FilmeEntrada) {
    return filmeRepository.criar({ ...dados, titulo: dados.titulo.trim() });
  },

  async atualizar(id: number, dados: Partial<FilmeEntrada> & { ativo?: boolean }) {
    await this.buscar(id);
    return filmeRepository.atualizar(id, dados);
  },

  /** Filme com sessões não é excluído: é desativado (preserva o histórico de vendas). */
  async excluir(id: number) {
    await this.buscar(id);
    if ((await filmeRepository.contarSessoes(id)) > 0) {
      throw conflito('Filme possui sessões cadastradas. Desative-o em vez de excluir.');
    }
    await filmeRepository.excluir(id);
  },
};
