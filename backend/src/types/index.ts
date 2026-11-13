import type { Papel } from '@prisma/client';

export interface UsuarioAutenticado {
  id: number;
  papel: Papel;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}
