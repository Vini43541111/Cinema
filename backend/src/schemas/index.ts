import { MetodoPagamento } from '@prisma/client';
import { z } from 'zod';

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const registroSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  senha: z.string().min(1),
});

export const filmeSchema = z.object({
  titulo: z.string().trim().min(1).max(160),
  descricao: z.string().trim().max(2000).nullish(),
  duracaoMinutos: z.coerce.number().int().min(1).max(600),
  classificacao: z.enum(['L', '10', '12', '14', '16', '18']),
});

export const filmeAtualizacaoSchema = filmeSchema.partial().extend({ ativo: z.boolean().optional() });

export const filmeListaQuery = z.object({ todos: z.enum(['true', 'false']).optional() });

export const salaSchema = z.object({
  nome: z.string().trim().min(1).max(60),
  filas: z.coerce.number().int(),
  assentosPorFila: z.coerce.number().int(),
});

export const salaRenomearSchema = z.object({ nome: z.string().trim().min(1).max(60) });

export const sessaoSchema = z.object({
  filmeId: z.coerce.number().int().positive(),
  salaId: z.coerce.number().int().positive(),
  /** Data/hora ISO 8601 (ex.: 2026-11-24T19:30:00-03:00) */
  inicio: z.coerce.date(),
  preco: z.coerce.number().positive().max(10000),
});

export const sessaoListaQuery = z.object({
  filmeId: z.coerce.number().int().positive().optional(),
  data: dataISO.optional(),
  incluirPassadas: z.enum(['true', 'false']).optional(),
});

export const reservaSchema = z.object({
  sessaoId: z.coerce.number().int().positive(),
  assentoIds: z.array(z.coerce.number().int().positive()).min(1).max(10),
});

export const pagamentoSchema = z.object({
  metodo: z.nativeEnum(MetodoPagamento),
});

export const vendaBalcaoSchema = reservaSchema.extend({
  metodo: z.nativeEnum(MetodoPagamento),
});

export const validarIngressoSchema = z.object({
  codigo: z.string().trim().min(4).max(20),
});

export const periodoQuery = z.object({
  de: dataISO.optional(),
  ate: dataISO.optional(),
});
