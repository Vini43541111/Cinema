# 🎬 Cinema Monox — API da bilheteria com marcação de assentos

Back-end do Trabalho Final de **Programação II + Banco de Dados II** (UNOESC Chapecó).

**Stack:** TypeScript · Node.js · Express 5 · Prisma 6 (ORM) · PostgreSQL (AWS RDS)

## Arquitetura em camadas

```
src/
├── routes/          → mapeamento HTTP → controller (+ autenticação/papel)
├── controllers/     → recebe a requisição, valida o FORMATO (zod), chama o service
├── services/        → TODAS as regras de negócio (reserva, expiração, pagamento, validação)
├── repositories/    → acesso a dados exclusivamente via Prisma Client
├── schemas/         → schemas zod de entrada
├── middlewares/     → JWT, papéis, tratamento de erros
├── jobs/            → job que executa a procedure de expiração a cada 30s
└── lib/             → prisma client, erros, utilitários
prisma/
├── schema.prisma    → modelo de dados (relações, chaves, índices, unique)
├── migrations/      → Prisma Migrate (init + triggers/procedure/função/checks)
└── seed.ts          → dados iniciais
```

## Como o "assento nunca é vendido duas vezes" é garantido

1. **Bloqueio pessimista:** a reserva roda em `prisma.$transaction` e faz `SELECT ... FOR UPDATE` nas linhas de `sessao_assento` (ordenadas por id para evitar deadlock). Se dois clientes clicarem no mesmo assento ao mesmo tempo, o segundo espera o primeiro terminar, relê a linha já `RESERVADO` e recebe **409**.
2. **Constraints no banco (última barreira):**
   - `UNIQUE (sessao_id, assento_id)` em `sessao_assento` → um estado por assento/sessão;
   - `UNIQUE (sessao_id, assento_id)` em `ingresso` → no máximo **um ingresso** por assento/sessão;
   - `CHECK` de coerência de estado (`LIVRE`/`RESERVADO`/`VENDIDO` × `reserva_id`/`expira_em`).
3. **Expiração:** a reserva tem `expira_em` (padrão 10 min). O service trata reserva vencida como livre imediatamente; a procedure `sp_expirar_reservas()` limpa periodicamente.

Teste: `npm run test:concorrencia -- 50` → 50 clientes tentam o mesmo assento: **1×201 e 49×409**.

## Objetos SQL (migração `triggers_procedures`)

| Tipo | Nome | Função |
|---|---|---|
| Trigger | `trg_sessao_gerar_mapa` | Ao inserir sessão, gera o mapa de assentos (todos LIVRE) |
| Trigger | `trg_ingresso_protege_utilizado` | Impede alterar/excluir ingresso já utilizado |
| Procedure | `sp_expirar_reservas()` | Expira reservas vencidas e libera os assentos |
| Função | `fn_relatorio_ocupacao(inicio, fim)` | Relatório de ocupação/receita (sessao + filme + sala + sessao_assento + ingresso) |

## Rodando localmente

```bash
cp .env.example .env    # ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Usuários do seed: **admin@cinema.com / Admin@123** (operador) e **cliente@cinema.com / Cliente@123**.

## Deploy (EC2 + RDS)

Ver [`docs/DEPLOY.md`](docs/DEPLOY.md). Documentação da API em [`docs/API.md`](docs/API.md), DER em [`docs/DER.md`](docs/DER.md).
