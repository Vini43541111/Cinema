import { prisma } from '../lib/prisma';
import type { Db } from './db';

export const salaRepository = {
  listar(db: Db = prisma) {
    return db.sala.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { assentos: true } } },
    });
  },

  buscarPorId(id: number, db: Db = prisma) {
    return db.sala.findUnique({
      where: { id },
      include: { assentos: { orderBy: [{ fila: 'asc' }, { numero: 'asc' }] } },
    });
  },

  buscarPorNome(nome: string, db: Db = prisma) {
    return db.sala.findUnique({ where: { nome } });
  },

  criarComAssentos(nome: string, assentos: { fila: string; numero: number }[], db: Db = prisma) {
    return db.sala.create({
      data: { nome, assentos: { createMany: { data: assentos } } },
      include: { _count: { select: { assentos: true } } },
    });
  },

  renomear(id: number, nome: string, db: Db = prisma) {
    return db.sala.update({ where: { id }, data: { nome } });
  },

  excluir(id: number, db: Db = prisma) {
    return db.sala.delete({ where: { id } });
  },

  contarSessoes(id: number, db: Db = prisma) {
    return db.sessao.count({ where: { salaId: id } });
  },
};
