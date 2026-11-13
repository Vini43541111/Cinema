import { regraNegocio } from '../lib/errors';
import { dinheiro } from '../lib/numero';
import { relatorioRepository } from '../repositories/relatorio.repository';

const DIA = 24 * 60 * 60 * 1000;

function periodo(de?: string, ate?: string) {
  const inicio = de ? new Date(`${de}T00:00:00-03:00`) : new Date(Date.now() - 30 * DIA);
  const fim = ate ? new Date(new Date(`${ate}T00:00:00-03:00`).getTime() + DIA) : new Date(Date.now() + 30 * DIA);
  if (fim <= inicio) throw regraNegocio('Período inválido: a data final deve ser após a inicial');
  if (fim.getTime() - inicio.getTime() > 366 * DIA) throw regraNegocio('Período máximo de 1 ano');
  return { inicio, fim };
}

export const relatorioService = {
  async ocupacao(de?: string, ate?: string) {
    const { inicio, fim } = periodo(de, ate);
    const linhas = await relatorioRepository.ocupacaoPorSessao(inicio, fim);
    const sessoes = linhas.map((l) => ({
      sessaoId: l.sessao_id,
      filme: l.filme,
      sala: l.sala,
      inicio: l.inicio,
      preco: dinheiro(l.preco),
      capacidade: Number(l.capacidade),
      vendidos: Number(l.vendidos),
      reservados: Number(l.reservados),
      utilizados: Number(l.utilizados),
      taxaOcupacao: dinheiro(l.taxa_ocupacao),
      receita: dinheiro(l.receita),
    }));
    const capacidade = sessoes.reduce((s, x) => s + x.capacidade, 0);
    const vendidos = sessoes.reduce((s, x) => s + x.vendidos, 0);
    return {
      periodo: { inicio, fim },
      totais: {
        sessoes: sessoes.length,
        capacidade,
        vendidos,
        receita: sessoes.reduce((s, x) => s + x.receita, 0),
        taxaOcupacaoMedia: capacidade ? Math.round((10000 * vendidos) / capacidade) / 100 : 0,
      },
      sessoes,
    };
  },

  async vendas(de?: string, ate?: string) {
    const { inicio, fim } = periodo(de, ate);
    const [porFilme, porMetodo] = await Promise.all([
      relatorioRepository.vendasPorFilme(inicio, fim),
      relatorioRepository.vendasPorMetodo(inicio, fim),
    ]);
    const filmes = porFilme.map((l) => ({
      filmeId: l.filme_id,
      filme: l.filme,
      sessoes: Number(l.sessoes),
      ingressos: Number(l.ingressos),
      receita: dinheiro(l.receita),
      ticketMedio: dinheiro(l.ticket_medio),
    }));
    return {
      periodo: { inicio, fim },
      totais: {
        ingressos: filmes.reduce((s, x) => s + x.ingressos, 0),
        receita: filmes.reduce((s, x) => s + x.receita, 0),
      },
      porFilme: filmes,
      porMetodo: porMetodo.map((l) => ({
        metodo: l.metodo,
        canal: l.canal,
        pagamentos: Number(l.pagamentos),
        receita: dinheiro(l.receita),
      })),
    };
  },
};
