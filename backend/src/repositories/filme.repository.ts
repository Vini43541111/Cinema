import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

export const filmeRepository = {
  listar(apenasAtivos: boolean, db: Db = prisma) {
    return db.filme.findMany({
      where: apenasAtivos ? { ativo: true } : undefined,
      orderBy: { titulo: 'asc' },
    });
  },

  buscarPorId(id: number, db: Db = prisma) {
    return db.filme.findUnique({ where: { id } });
  },

  criar(dados: Prisma.FilmeCreateInput, db: Db = prisma) {
    return db.filme.create({ data: dados });
  },

  atualizar(id: number, dados: Prisma.FilmeUpdateInput, db: Db = prisma) {
    return db.filme.update({ where: { id }, data: dados });
  },

  excluir(id: number, db: Db = prisma) {
    return db.filme.delete({ where: { id } });
  },

  contarSessoes(id: number, db: Db = prisma) {
    return db.sessao.count({ where: { filmeId: id } });
  },
};
