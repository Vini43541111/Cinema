import type { Request, Response } from 'express';
import { validar } from '../lib/validacao';
import { loginSchema, registroSchema } from '../schemas';
import { authService } from '../services/auth.service';

export const authController = {
  async registrar(req: Request, res: Response) {
    const dados = validar(registroSchema, req.body);
    res.status(201).json(await authService.registrar(dados));
  },

  async login(req: Request, res: Response) {
    const { email, senha } = validar(loginSchema, req.body);
    res.json(await authService.login(email, senha));
  },

  async perfil(req: Request, res: Response) {
    res.json(await authService.perfil(req.usuario!.id));
  },

  async criarOperador(req: Request, res: Response) {
    const dados = validar(registroSchema, req.body);
    res.status(201).json(await authService.criarOperador(dados));
  },
};
