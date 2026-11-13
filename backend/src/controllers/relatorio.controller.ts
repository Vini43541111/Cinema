import type { Request, Response } from 'express';
import { validar } from '../lib/validacao';
import { periodoQuery } from '../schemas';
import { relatorioService } from '../services/relatorio.service';

export const relatorioController = {
  async ocupacao(req: Request, res: Response) {
    const { de, ate } = validar(periodoQuery, req.query);
    res.json(await relatorioService.ocupacao(de, ate));
  },

  async vendas(req: Request, res: Response) {
    const { de, ate } = validar(periodoQuery, req.query);
    res.json(await relatorioService.vendas(de, ate));
  },
};
