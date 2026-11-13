import { Prisma, StatusIngresso } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

const incluirDetalhe = {
  assento: { select: { fila: true, numero: true } },
  sessao: {
    select: {
      id: true,
      inicio: true,
      fim: true,
      filme: { select: { titulo: true, classificacao: true } },
      sala: { select: { nome: true } },
    },
  },
} satisfies Prisma.IngressoInclude;

export const ingressoRepository = {
  criarVarios(
    ingressos: { codigo: string; reservaId: number; sessaoId: number; assentoId: number; valor: number }[],
    db: Db,
  ) {
    return db.ingresso.createMany({ data: ingressos });
  },

  listarDaReserva(reservaId: number, db: Db = prisma) {
    return db.ingresso.findMany({ where: { reservaId }, include: incluirDetalhe, orderBy: { id: 'asc' } });
  },

  listarDoUsuario(usuarioId: number, db: Db = prisma) {
    return db.ingresso.findMany({
      where: { reserva: { usuarioId } },
      include: incluirDetalhe,
      orderBy: { sessao: { inicio: 'desc' } },
    });
  },

  buscarPorCodigo(codigo: string, db: Db = prisma) {
    return db.ingresso.findUnique({ where: { codigo }, include: incluirDetalhe });
  },

  /** Marca como utilizado apenas se ainda estiver VALIDO (atômico: evita validação dupla). */
  marcarUtilizado(id: number, operadorId: number, db: Db = prisma) {
    return db.ingresso.updateMany({
      where: { id, status: StatusIngresso.VALIDO },
      data: { status: StatusIngresso.UTILIZADO, utilizadoEm: new Date(), validadoPorId: operadorId },
    });
  },
};
