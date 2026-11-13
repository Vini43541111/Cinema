import type { Request, Response } from 'express';
import { validar } from '../lib/validacao';
import { idParam, salaRenomearSchema, salaSchema } from '../schemas';
import { salaService } from '../services/sala.service';

export const salaController = {
  async listar(_req: Request, res: Response) {
    res.json(await salaService.listar());
  },

  async buscar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await salaService.buscar(id));
  },

  async criar(req: Request, res: Response) {
    res.status(201).json(await salaService.criar(validar(salaSchema, req.body)));
  },

  async renomear(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    const { nome } = validar(salaRenomearSchema, req.body);
    res.json(await salaService.renomear(id, nome));
  },

  async excluir(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    await salaService.excluir(id);
    res.status(204).end();
  },
};
