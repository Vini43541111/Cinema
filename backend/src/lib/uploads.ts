import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';

export const PASTA_UPLOADS = path.resolve(env.UPLOAD_DIR);
export const PREFIXO_PUBLICO = '/api/uploads/';

/** Grava a imagem com nome aleatório (nunca usa o nome enviado pelo usuário). */
export async function salvarArquivo(conteudo: Buffer, extensao: string): Promise<string> {
  await fs.mkdir(PASTA_UPLOADS, { recursive: true });
  const nome = `capa-${randomUUID()}.${extensao}`;
  await fs.writeFile(path.join(PASTA_UPLOADS, nome), conteudo);
  return `${PREFIXO_PUBLICO}${nome}`;
}

export async function removerArquivo(urlPublica: string | null | undefined) {
  if (!urlPublica?.startsWith(PREFIXO_PUBLICO)) return;
  const nome = path.basename(urlPublica);
  await fs.rm(path.join(PASTA_UPLOADS, nome), { force: true });
}
