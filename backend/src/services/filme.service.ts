import { AppError, conflito, naoEncontrado, regraNegocio } from '../lib/errors';
import { removerArquivo, salvarArquivo } from '../lib/uploads';
import { filmeRepository } from '../repositories/filme.repository';

export interface FilmeEntrada {
  titulo: string;
  descricao?: string | null;
  duracaoMinutos: number;
  classificacao: string;
}

export const TAMANHO_MAX_IMAGEM = 3 * 1024 * 1024;

/** Identifica o formato pelos primeiros bytes (não confia na extensão nem no mimetype enviados). */
function detectarFormato(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
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

  /** Define a capa do filme: valida formato real e tamanho, grava e remove a capa anterior. */
  async definirImagem(id: number, arquivo: { buffer: Buffer; size: number } | undefined) {
    const filme = await this.buscar(id);
    if (!arquivo) throw new AppError(400, 'Envie a imagem no campo "imagem"');
    if (arquivo.size > TAMANHO_MAX_IMAGEM) throw regraNegocio('A imagem deve ter no máximo 3 MB');
    const formato = detectarFormato(arquivo.buffer);
    if (!formato) throw regraNegocio('Formato inválido: use JPG, PNG ou WEBP');

    const url = await salvarArquivo(arquivo.buffer, formato);
    const atualizado = await filmeRepository.atualizar(id, { imagemUrl: url });
    await removerArquivo(filme.imagemUrl);
    return atualizado;
  },

  async removerImagem(id: number) {
    const filme = await this.buscar(id);
    const atualizado = await filmeRepository.atualizar(id, { imagemUrl: null });
    await removerArquivo(filme.imagemUrl);
    return atualizado;
  },

  /** Filme com sessões não é excluído: é desativado (preserva o histórico de vendas). */
  async excluir(id: number) {
    const filme = await this.buscar(id);
    if ((await filmeRepository.contarSessoes(id)) > 0) {
      throw conflito('Filme possui sessões cadastradas. Retire-o de cartaz em vez de excluir.');
    }
    await filmeRepository.excluir(id);
    await removerArquivo(filme.imagemUrl);
  },
};
