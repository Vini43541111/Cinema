import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  DB_SSL_CA: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter pelo menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RESERVA_MINUTOS: z.coerce.number().int().min(1).max(60).default(10),
  CORS_ORIGIN: z.string().default('*'),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
