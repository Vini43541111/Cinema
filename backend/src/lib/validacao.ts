import { ZodSchema } from 'zod';
import { AppError } from './errors';

/** Valida a entrada HTTP (formato). Regras de negócio ficam na camada service. */
export function validar<T>(schema: ZodSchema<T>, dados: unknown): T {
  const r = schema.safeParse(dados);
  if (!r.success) {
    throw new AppError(400, 'Dados inválidos', r.error.flatten().fieldErrors);
  }
  return r.data;
}
