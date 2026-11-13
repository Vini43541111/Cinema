import type { Request, Response } from 'express';
import { validar } from '../lib/validacao';
import { idParam, sessaoListaQuery, sessaoSchema } from '../schemas';
import { sessaoService } from '../services/sessao.service';

export const sessaoController = {
  async listar(req: Request, res: Response) {
    const q = validar(sessaoListaQuery, req.query);
    res.json(await sessaoService.listar({ ...q, incluirPassadas: q.incluirPassadas === 'true' }));
  },

  async buscar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await sessaoService.buscar(id));
  },

  async mapa(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await sessaoService.mapa(id));
  },

  async criar(req: Request, res: Response) {
    res.status(201).json(await sessaoService.criar(validar(sessaoSchema, req.body)));
  },

  async excluir(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    await sessaoService.excluir(id);
    res.status(204).end();
  },
};
