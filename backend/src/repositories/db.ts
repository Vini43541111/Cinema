import type { Prisma } from '@prisma/client';

/** Cliente aceito pelos repositórios: o PrismaClient global ou o cliente de uma transação. */
export type Db = Prisma.TransactionClient;
