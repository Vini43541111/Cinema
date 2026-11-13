# 🎬 Cinema — App (Expo / React Native + TypeScript)

Front-end do Trabalho Final de Programação II + Banco de Dados II (UNOESC). Roda na **Web**, Android e iOS com o mesmo código (Expo SDK 54 + Expo Router).

## Telas por papel

| Papel | Telas |
|---|---|
| **Cliente** | Login/cadastro · Em cartaz (sessões por dia) · Mapa de assentos · Pagamento com contagem regressiva da reserva · Meus ingressos (QR code) |
| **Operador – Bilheteria** | Venda no balcão (mapa + forma de pagamento) · Validação de ingresso na entrada |
| **Operador – Gerência** | Cadastro de filmes/eventos, salas (filas × assentos) e sessões · Relatórios de vendas e ocupação |

Formulários pedem só o necessário: filme e sala são escolhidos pelo nome (nunca por ID), total e término da sessão são calculados pela API, e o papel do usuário nunca é enviado pelo app.

O mapa de assentos é atualizado a cada 5s, então assentos ocupados por outras pessoas aparecem em tempo real; se alguém garantir o lugar primeiro, a API responde 409 e o app avisa e atualiza o mapa.

## Rodando

```bash
npm install
npm run web                     # http://localhost:8081
# API em outro endereço (ex.: celular na mesma rede):
EXPO_PUBLIC_API_URL=http://SEU_IP:3333/api npm start
```

Na web em produção o app chama `/api` no mesmo domínio (Nginx faz o proxy para a API).

## Deploy (EC2)

```bash
./deploy-web.sh      # expo export --platform web → /var/www/cinema
```
