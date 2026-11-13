# 🎬 Cinema Monox

Aplicativo de bilheteria com marcação de assentos — Trabalho Final de **Programação II + Banco de Dados II** (UNOESC Chapecó, 2026/2).

| Pasta | Conteúdo |
|---|---|
| [`backend/`](backend) | API REST: TypeScript, Node.js, Express, Prisma (ORM), PostgreSQL (AWS RDS) |
| [`frontend/`](frontend) | App Expo / React Native com TypeScript (Web, Android e iOS) |

**Produção:** EC2 (Ubuntu 24.04, Nginx + PM2) + RDS PostgreSQL gerenciado.

## Requisitos do enunciado × implementação

| Requisito | Onde está |
|---|---|
| Cadastro de filmes/eventos (com cartaz e sinopse), salas, assentos e sessões | `services/filme`, `sala`, `sessao` · tela **Cadastros** |
| Mapa de assentos por sessão (livre, reservado, vendido) | `GET /sessoes/:id/mapa` · componente `MapaAssentos` (atualiza a cada 5s) |
| Reserva temporária com expiração | `reserva.service` (prazo configurável) + procedure `sp_expirar_reservas` |
| Pagamento (simulado) e ingresso com código único | `POST /reservas/:id/pagamento` · `UNIQUE(codigo)` · QR code no app |
| Validação na entrada (marcar como utilizado) | `POST /bilheteria/validar` (atômico) + trigger que impede reverter |
| Cadastro de usuários e acesso autenticado | JWT + bcrypt · papéis CLIENTE / OPERADOR |
| Relatório de vendas e ocupação por sessão | `fn_relatorio_ocupacao` + `GET /relatorios/*` · tela **Relatórios** |
| Assento nunca vendido duas vezes | transação + `SELECT … FOR UPDATE` + `UNIQUE(sessao_id, assento_id)` · `npm run test:concorrencia` |
| Camadas controller / service / repository | `backend/src/` |
| Trigger e stored procedure | migração `20261113120100_triggers_procedures` |
| Migrações | Prisma Migrate (`backend/prisma/migrations`) |
| Relatório juntando 3+ tabelas | ocupação: sessao + filme + sala + sessao_assento + ingresso |
| DER, casos de uso, definição da API | `backend/docs/` |
