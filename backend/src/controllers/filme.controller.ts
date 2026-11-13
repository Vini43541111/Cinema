import type { Request, Response } from 'express';
import { Papel } from '@prisma/client';
import { validar } from '../lib/validacao';
import { filmeAtualizacaoSchema, filmeListaQuery, filmeSchema, idParam } from '../schemas';
import { filmeService } from '../services/filme.service';

export const filmeController = {
  async listar(req: Request, res: Response) {
    const { todos } = validar(filmeListaQuery, req.query);
    // Inativos só aparecem para operador autenticado
    const incluirInativos = todos === 'true' && req.usuario?.papel === Papel.OPERADOR;
    res.json(await filmeService.listar(incluirInativos));
  },

  async buscar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await filmeService.buscar(id));
  },

  async criar(req: Request, res: Response) {
    res.status(201).json(await filmeService.criar(validar(filmeSchema, req.body)));
  },

  async atualizar(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    res.json(await filmeService.atualizar(id, validar(filmeAtualizacaoSchema, req.body)));
  },

  async excluir(req: Request, res: Response) {
    const { id } = validar(idParam, req.params);
    await filmeService.excluir(id);
    res.status(204).end();
  },
};
