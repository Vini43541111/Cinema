import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { AppError } from '../lib/errors';

export function rotaNaoEncontrada(req: Request, res: Response) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.path} não encontrada` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tratarErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }
  if (err instanceof MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'A imagem deve ter no máximo 3 MB' : 'Upload inválido';
    return res.status(400).json({ erro: msg });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ erro: 'JSON inválido' });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ erro: 'Registro duplicado' });
    if (err.code === 'P2003') return res.status(409).json({ erro: 'Registro vinculado a outros dados' });
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Registro não encontrado' });
  }
  // Erros inesperados: loga no servidor e não expõe detalhes internos ao cliente
  console.error('[erro]', err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}
