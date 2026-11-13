import type { Request, Response } from 'express';
import { validar } from '../lib/validacao';
import { idParam, pagamentoSchema, reservaSchema, vendaBalcaoSchema } from '../schemas';
import { reservaService } from '../services/reserva.service';

export const reservaController = {
  async reservar(req: Request, res: Response) {
    const { sessaoId, assentoIds } = validar(reservaSchema, req.body);
    res.status(201).json(await reservaService.reservar(req.usuario!, sessaoId, assentoIds));
  },

  async pagar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    const { metodo } = validar(pagamentoSchema, req.body);
    res.json(await reservaService.pagar(req.usuario!, id, metodo));
  },

  async cancelar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await reservaService.cancelar(req.usuario!, id));
  },

  async buscar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await reservaService.buscar(req.usuario!, id));
  },

  async minhas(req: Request, res: Response) {
    res.json(await reservaService.minhas(req.usuario!));
  },

  async vendaBalcao(req: Request, res: Response) {
    const { sessaoId, assentoIds, metodo } = validar(vendaBalcaoSchema, req.body);
    res.status(201).json(await reservaService.vendaBalcao(req.usuario!, sessaoId, assentoIds, metodo));
  },
};
