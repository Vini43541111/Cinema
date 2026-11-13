import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { filmeController } from '../controllers/filme.controller';
import { ingressoController } from '../controllers/ingresso.controller';
import { relatorioController } from '../controllers/relatorio.controller';
import { reservaController } from '../controllers/reserva.controller';
import { salaController } from '../controllers/sala.controller';
import { sessaoController } from '../controllers/sessao.controller';
import { prisma } from '../lib/prisma';
import { autenticacaoOpcional, autenticar, somenteOperador } from '../middlewares/auth';

export const rotas = Router();

// Proteção contra força bruta: só tentativas de login que FALHAM contam
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});
const limiteCadastro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitos cadastros a partir deste endereço. Tente mais tarde.' },
});

rotas.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', horario: new Date().toISOString() });
});

// ---------- Autenticação ----------
rotas.post('/auth/registrar', limiteCadastro, authController.registrar);
rotas.post('/auth/login', limiteLogin, authController.login);
rotas.get('/auth/me', autenticar, authController.perfil);
rotas.post('/auth/operadores', ...somenteOperador, authController.criarOperador);

// ---------- Filmes/Eventos ----------
rotas.get('/filmes', autenticacaoOpcional, filmeController.listar);
rotas.get('/filmes/:id', filmeController.buscar);
rotas.post('/filmes', ...somenteOperador, filmeController.criar);
rotas.put('/filmes/:id', ...somenteOperador, filmeController.atualizar);
rotas.delete('/filmes/:id', ...somenteOperador, filmeController.excluir);

// ---------- Salas e assentos ----------
rotas.get('/salas', ...somenteOperador, salaController.listar);
rotas.get('/salas/:id', ...somenteOperador, salaController.buscar);
rotas.post('/salas', ...somenteOperador, salaController.criar);
rotas.patch('/salas/:id', ...somenteOperador, salaController.renomear);
rotas.delete('/salas/:id', ...somenteOperador, salaController.excluir);

// ---------- Sessões e mapa de assentos ----------
rotas.get('/sessoes', sessaoController.listar);
rotas.get('/sessoes/:id', sessaoController.buscar);
rotas.get('/sessoes/:id/mapa', sessaoController.mapa);
rotas.post('/sessoes', ...somenteOperador, sessaoController.criar);
rotas.delete('/sessoes/:id', ...somenteOperador, sessaoController.excluir);

// ---------- Reservas e pagamento (cliente) ----------
rotas.post('/reservas', autenticar, reservaController.reservar);
rotas.get('/reservas', autenticar, reservaController.minhas);
rotas.get('/reservas/:id', autenticar, reservaController.buscar);
rotas.post('/reservas/:id/pagamento', autenticar, reservaController.pagar);
rotas.post('/reservas/:id/cancelar', autenticar, reservaController.cancelar);

// ---------- Ingressos ----------
rotas.get('/ingressos', autenticar, ingressoController.meus);

// ---------- Bilheteria (operador) ----------
rotas.post('/bilheteria/vendas', ...somenteOperador, reservaController.vendaBalcao);
rotas.get('/bilheteria/ingressos/:codigo', ...somenteOperador, ingressoController.consultar);
rotas.post('/bilheteria/validar', ...somenteOperador, ingressoController.validar);

// ---------- Relatórios (gerência) ----------
rotas.get('/relatorios/ocupacao', ...somenteOperador, relatorioController.ocupacao);
rotas.get('/relatorios/vendas', ...somenteOperador, relatorioController.vendas);
