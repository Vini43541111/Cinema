import { Papel } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { Db } from './db';

export const usuarioRepository = {
  buscarPorEmail(email: string, db: Db = prisma) {
    return db.usuario.findUnique({ where: { email } });
  },

  buscarPorId(id: number, db: Db = prisma) {
    return db.usuario.findUnique({ where: { id } });
  },

  criar(dados: { nome: string; email: string; senhaHash: string; papel: Papel }, db: Db = prisma) {
    return db.usuario.create({ data: dados });
  },
};
