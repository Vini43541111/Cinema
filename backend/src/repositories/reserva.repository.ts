import { CanalVenda, Prisma, StatusReserva } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

const incluirDetalhe = {
  sessao: {
    select: {
      id: true,
      inicio: true,
      preco: true,
      filme: { select: { titulo: true } },
      sala: { select: { nome: true } },
    },
  },
  assentos: { select: { assento: { select: { id: true, fila: true, numero: true } } } },
  ingressos: { include: { assento: { select: { fila: true, numero: true } } } },
  pagamento: true,
} satisfies Prisma.ReservaInclude;

export const reservaRepository = {
  criar(
    dados: { usuarioId: number; sessaoId: number; total: number; expiraEm: Date; canal: CanalVenda },
    db: Db,
  ) {
    return db.reserva.create({ data: dados });
  },

  buscarDetalhe(id: number, db: Db = prisma) {
    return db.reserva.findUnique({ where: { id }, include: incluirDetalhe });
  },

  listarDoUsuario(usuarioId: number, db: Db = prisma) {
    return db.reserva.findMany({
      where: { usuarioId },
      include: incluirDetalhe,
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  },

  /** Bloqueia a reserva (FOR UPDATE) para evitar pagamento duplo concorrente. */
  async bloquear(id: number, db: Db) {
    const linhas = await db.$queryRaw<
      { id: number; usuarioId: number; sessaoId: number; status: StatusReserva; total: Prisma.Decimal; expiraEm: Date }[]
    >`
      SELECT id,
             usuario_id AS "usuarioId",
             sessao_id  AS "sessaoId",
             status::text AS "status",
             total,
             expira_em  AS "expiraEm"
        FROM reserva
       WHERE id = ${id}
         FOR UPDATE`;
    return linhas[0] ?? null;
  },

  atualizarStatus(id: number, status: StatusReserva, db: Db) {
    return db.reserva.update({ where: { id }, data: { status } });
  },

  /** Executa a stored procedure que expira reservas vencidas e libera assentos. */
  async expirarVencidas(db: Db = prisma): Promise<number> {
    const r = await db.$queryRaw<{ p_qtd_reservas: number }[]>`CALL sp_expirar_reservas(NULL)`;
    return Number(r[0]?.p_qtd_reservas ?? 0);
  },
};
