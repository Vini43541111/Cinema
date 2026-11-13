import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Papel, Usuario } from '@prisma/client';
import { env } from '../config/env';
import { AppError, conflito } from '../lib/errors';
import { usuarioRepository } from '../repositories/usuario.repository';
import type { UsuarioAutenticado } from '../types';

export interface UsuarioDTO {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
}

/** Nunca expõe o hash da senha para fora da camada de serviço. */
const paraDTO = (u: Usuario): UsuarioDTO => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel });

function gerarToken(u: Usuario): string {
  const payload: UsuarioAutenticado = { id: u.id, papel: u.papel };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
}

async function criarUsuario(nome: string, email: string, senha: string, papel: Papel) {
  const emailNormalizado = email.trim().toLowerCase();
  if (await usuarioRepository.buscarPorEmail(emailNormalizado)) {
    throw conflito('E-mail já cadastrado');
  }
  const senhaHash = await bcrypt.hash(senha, 10);
  return usuarioRepository.criar({ nome: nome.trim(), email: emailNormalizado, senhaHash, papel });
}

export const authService = {
  /** Cadastro público: sempre cria CLIENTE (o papel nunca vem do front). */
  async registrar(dados: { nome: string; email: string; senha: string }) {
    const usuario = await criarUsuario(dados.nome, dados.email, dados.senha, Papel.CLIENTE);
    return { token: gerarToken(usuario), usuario: paraDTO(usuario) };
  },

  /** Somente um operador autenticado pode cadastrar outro operador. */
  async criarOperador(dados: { nome: string; email: string; senha: string }) {
    const usuario = await criarUsuario(dados.nome, dados.email, dados.senha, Papel.OPERADOR);
    return paraDTO(usuario);
  },

  async login(email: string, senha: string) {
    const usuario = await usuarioRepository.buscarPorEmail(email.trim().toLowerCase());
    // Mensagem genérica: não revela se o e-mail existe
    const ok = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false;
    if (!usuario || !ok) throw new AppError(401, 'E-mail ou senha inválidos');
    return { token: gerarToken(usuario), usuario: paraDTO(usuario) };
  },

  async perfil(id: number) {
    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) throw new AppError(401, 'Sessão inválida');
    return paraDTO(usuario);
  },

  verificarToken(token: string): UsuarioAutenticado {
    try {
      const p = jwt.verify(token, env.JWT_SECRET) as UsuarioAutenticado;
      return { id: p.id, papel: p.papel };
    } catch {
      throw new AppError(401, 'Token inválido ou expirado');
    }
  },
};
