import { MetodoPagamento } from '@prisma/client';
import type { Db } from './db';

export const pagamentoRepository = {
  criar(dados: { reservaId: number; metodo: MetodoPagamento; valor: number }, db: Db) {
    return db.pagamento.create({ data: dados });
  },
};
