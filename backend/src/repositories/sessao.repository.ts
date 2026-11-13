import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

const incluirResumo = {
  filme: { select: { id: true, titulo: true, classificacao: true, duracaoMinutos: true } },
  sala: { select: { id: true, nome: true } },
} satisfies Prisma.SessaoInclude;

export const sessaoRepository = {
  listar(filtro: { filmeId?: number; de?: Date; ate?: Date }, db: Db = prisma) {
    return db.sessao.findMany({
      where: {
        filmeId: filtro.filmeId,
        inicio: { gte: filtro.de, lt: filtro.ate },
      },
      include: incluirResumo,
      orderBy: { inicio: 'asc' },
    });
  },

  buscarPorId(id: number, db: Db = prisma) {
    return db.sessao.findUnique({ where: { id }, include: incluirResumo });
  },

  /** Sessões da mesma sala com horário sobreposto ao intervalo [inicio, fim). */
  buscarConflito(salaId: number, inicio: Date, fim: Date, db: Db = prisma) {
    return db.sessao.findFirst({
      where: { salaId, inicio: { lt: fim }, fim: { gt: inicio } },
      include: incluirResumo,
    });
  },

  criar(dados: { filmeId: number; salaId: number; inicio: Date; fim: Date; preco: number }, db: Db = prisma) {
    return db.sessao.create({ data: dados, include: incluirResumo });
  },

  contarReservas(id: number, db: Db = prisma) {
    return db.reserva.count({ where: { sessaoId: id } });
  },

  excluir(id: number, db: Db = prisma) {
    return db.sessao.delete({ where: { id } });
  },
};
