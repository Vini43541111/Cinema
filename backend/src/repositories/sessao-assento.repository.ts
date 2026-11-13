import { Prisma, StatusAssento } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

export interface AssentoBloqueado {
  id: number;
  assentoId: number;
  status: StatusAssento;
  reservaId: number | null;
  expiraEm: Date | null;
}

export const sessaoAssentoRepository = {
  mapa(sessaoId: number, db: Db = prisma) {
    return db.sessaoAssento.findMany({
      where: { sessaoId },
      select: {
        assentoId: true,
        status: true,
        reservaId: true,
        expiraEm: true,
        assento: { select: { fila: true, numero: true } },
      },
      orderBy: [{ assento: { fila: 'asc' } }, { assento: { numero: 'asc' } }],
    });
  },

  /**
   * Bloqueia (SELECT ... FOR UPDATE) as linhas dos assentos na sessão.
   * A ordenação por id evita deadlock entre compras concorrentes.
   * Outras transações que tentarem os mesmos assentos esperam o COMMIT/ROLLBACK desta.
   */
  bloquearParaAtualizacao(sessaoId: number, assentoIds: number[], db: Db) {
    return db.$queryRaw<AssentoBloqueado[]>`
      SELECT id,
             assento_id  AS "assentoId",
             status::text AS "status",
             reserva_id  AS "reservaId",
             expira_em   AS "expiraEm"
        FROM sessao_assento
       WHERE sessao_id = ${sessaoId}
         AND assento_id IN (${Prisma.join(assentoIds)})
       ORDER BY id
         FOR UPDATE`;
  },

  bloquearDaReserva(reservaId: number, db: Db) {
    return db.$queryRaw<AssentoBloqueado[]>`
      SELECT id,
             assento_id  AS "assentoId",
             status::text AS "status",
             reserva_id  AS "reservaId",
             expira_em   AS "expiraEm"
        FROM sessao_assento
       WHERE reserva_id = ${reservaId}
       ORDER BY id
         FOR UPDATE`;
  },

  marcarReservados(ids: number[], reservaId: number, expiraEm: Date, db: Db) {
    return db.sessaoAssento.updateMany({
      where: { id: { in: ids } },
      data: { status: StatusAssento.RESERVADO, reservaId, expiraEm },
    });
  },

  marcarVendidos(reservaId: number, db: Db) {
    return db.sessaoAssento.updateMany({
      where: { reservaId, status: StatusAssento.RESERVADO },
      data: { status: StatusAssento.VENDIDO, expiraEm: null },
    });
  },

  liberarDaReserva(reservaId: number, db: Db) {
    return db.sessaoAssento.updateMany({
      where: { reservaId, status: StatusAssento.RESERVADO },
      data: { status: StatusAssento.LIVRE, reservaId: null, expiraEm: null },
    });
  },
};
