import type { NextFunction, Request, Response } from 'express';
import { Papel } from '@prisma/client';
import { AppError, proibido } from '../lib/errors';
import { authService } from '../services/auth.service';

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Autenticação necessária');
  req.usuario = authService.verificarToken(header.slice(7));
  next();
}

export function exigirPapel(...papeis: Papel[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario || !papeis.includes(req.usuario.papel)) throw proibido();
    next();
  };
}

export const somenteOperador = [autenticar, exigirPapel(Papel.OPERADOR)];

/** Identifica o usuário se houver token válido, sem exigir login. */
export function autenticacaoOpcional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.usuario = authService.verificarToken(header.slice(7));
    } catch {
      /* token inválido em rota pública: segue como anônimo */
    }
  }
  next();
}
