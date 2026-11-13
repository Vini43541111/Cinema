import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PoolConfig } from 'pg';
import { env } from '../config/env';

/**
 * Monta a configuração do pool do node-postgres.
 * O parâmetro sslmode da URL é tratado aqui para funcionar com o RDS:
 *  - com DB_SSL_CA: valida o certificado com o bundle de CA da AWS;
 *  - sem DB_SSL_CA: conexão criptografada sem validar a CA.
 */
function poolConfig(): PoolConfig {
  const url = new URL(env.DATABASE_URL);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');

  const config: PoolConfig = { connectionString: url.toString(), max: 10 };
  if (sslmode && sslmode !== 'disable') {
    config.ssl =
      env.DB_SSL_CA && fs.existsSync(env.DB_SSL_CA)
        ? { ca: fs.readFileSync(env.DB_SSL_CA, 'utf8'), rejectUnauthorized: true }
        : { rejectUnauthorized: false };
  }
  return config;
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg(poolConfig()),
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
