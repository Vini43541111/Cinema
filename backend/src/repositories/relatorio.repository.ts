import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

export interface LinhaOcupacao {
  sessao_id: number;
  filme: string;
  sala: string;
  inicio: Date;
  preco: Prisma.Decimal;
  capacidade: bigint;
  vendidos: bigint;
  reservados: bigint;
  utilizados: bigint;
  taxa_ocupacao: Prisma.Decimal | null;
  receita: Prisma.Decimal;
}

export interface LinhaVendasFilme {
  filme_id: number;
  filme: string;
  sessoes: bigint;
  ingressos: bigint;
  receita: Prisma.Decimal;
  ticket_medio: Prisma.Decimal | null;
}

export interface LinhaVendasMetodo {
  metodo: string;
  canal: string;
  pagamentos: bigint;
  receita: Prisma.Decimal;
}

export const relatorioRepository = {
  /** Usa a função SQL fn_relatorio_ocupacao (sessao + filme + sala + sessao_assento + ingresso). */
  ocupacaoPorSessao(inicio: Date, fim: Date, db: Db = prisma) {
    return db.$queryRaw<LinhaOcupacao[]>`SELECT * FROM fn_relatorio_ocupacao(${inicio}, ${fim})`;
  },

  /** Vendas por filme: pagamento + reserva + sessao + filme + ingresso. */
  vendasPorFilme(inicio: Date, fim: Date, db: Db = prisma) {
    return db.$queryRaw<LinhaVendasFilme[]>`
      SELECT f.id                         AS filme_id,
             f.titulo                     AS filme,
             count(DISTINCT s.id)         AS sessoes,
             count(i.id)                  AS ingressos,
             COALESCE(sum(i.valor), 0)    AS receita,
             round(avg(i.valor), 2)       AS ticket_medio
        FROM pagamento p
        JOIN reserva  r ON r.id = p.reserva_id
        JOIN sessao   s ON s.id = r.sessao_id
        JOIN filme    f ON f.id = s.filme_id
        JOIN ingresso i ON i.reserva_id = r.id
       WHERE p.pago_em >= ${inicio} AND p.pago_em < ${fim}
       GROUP BY f.id, f.titulo
       ORDER BY receita DESC`;
  },

  /** Vendas por método de pagamento e canal (online x balcão). */
  vendasPorMetodo(inicio: Date, fim: Date, db: Db = prisma) {
    return db.$queryRaw<LinhaVendasMetodo[]>`
      SELECT p.metodo::text AS metodo,
             r.canal::text  AS canal,
             count(*)       AS pagamentos,
             sum(p.valor)   AS receita
        FROM pagamento p
        JOIN reserva r ON r.id = p.reserva_id
       WHERE p.pago_em >= ${inicio} AND p.pago_em < ${fim}
       GROUP BY p.metodo, r.canal
       ORDER BY receita DESC`;
  },
};
