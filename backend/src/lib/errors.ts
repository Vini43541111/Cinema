export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detalhes?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const naoEncontrado = (recurso: string) => new AppError(404, `${recurso} não encontrado(a)`);
export const conflito = (msg: string, detalhes?: unknown) => new AppError(409, msg, detalhes);
export const regraNegocio = (msg: string, detalhes?: unknown) => new AppError(422, msg, detalhes);
export const proibido = (msg = 'Acesso negado') => new AppError(403, msg);
