import type { Request, Response } from 'express';
import { validar } from '../lib/validacao';
import { validarIngressoSchema } from '../schemas';
import { ingressoService } from '../services/ingresso.service';

export const ingressoController = {
  async meus(req: Request, res: Response) {
    res.json(await ingressoService.meus(req.usuario!));
  },

  async consultar(req: Request, res: Response) {
    const { codigo } = validar(validarIngressoSchema, req.params);
    res.json(await ingressoService.consultar(codigo));
  },

  async validar(req: Request, res: Response) {
    const { codigo } = validar(validarIngressoSchema, req.body);
    res.json(await ingressoService.validar(req.usuario!, codigo));
  },
};
