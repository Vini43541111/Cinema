import { Prisma } from '@prisma/client';

export const dinheiro = (v: Prisma.Decimal | number | string | null | undefined): number =>
  v === null || v === undefined ? 0 : Number(v);
