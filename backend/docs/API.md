# API — Cinema Monox

Base: `https://SEU_DOMINIO/api` · JSON · Autenticação: `Authorization: Bearer <token>`

Papéis: **CLIENTE** (cadastro público) e **OPERADOR** (bilheteria + gerência).

Erros: `{ "erro": "mensagem", "detalhes": ... }` — 400 dados inválidos · 401 não autenticado · 403 sem permissão · 404 não encontrado · 409 conflito (assento indisponível, duplicidade) · 410 reserva expirada · 422 regra de negócio.

## Autenticação
| Método | Rota | Acesso | Corpo |
|---|---|---|---|
| POST | `/auth/registrar` | público | `{ nome, email, senha }` → `{ token, usuario }` |
| POST | `/auth/login` | público | `{ email, senha }` → `{ token, usuario }` |
| GET | `/auth/me` | autenticado | — |
| POST | `/auth/operadores` | operador | `{ nome, email, senha }` |

## Filmes / eventos
| Método | Rota | Acesso | Corpo |
|---|---|---|---|
| GET | `/filmes?todos=true` | público (`todos` só p/ operador) | — |
| GET | `/filmes/:id` | público | — |
| POST | `/filmes` | operador | `{ titulo, descricao?, duracaoMinutos, classificacao: L\|10\|12\|14\|16\|18 }` |
| PUT | `/filmes/:id` | operador | campos parciais + `ativo?` |
| DELETE | `/filmes/:id` | operador | (só se não houver sessões) |
| POST | `/filmes/:id/imagem` | operador | `multipart/form-data`, campo `imagem` (JPG/PNG/WEBP, até 3 MB; formato validado pelo conteúdo) |
| DELETE | `/filmes/:id/imagem` | operador | remove o cartaz |

As capas ficam em `/api/uploads/<nome-aleatório>` e o campo `imagemUrl` do filme aponta para elas.

## Salas
| Método | Rota | Acesso | Corpo |
|---|---|---|---|
| GET | `/salas` | operador | — |
| GET | `/salas/:id` | operador | — (com assentos) |
| POST | `/salas` | operador | `{ nome, filas, assentosPorFila }` (gera os assentos A1..) |
| PATCH | `/salas/:id` | operador | `{ nome }` |
| DELETE | `/salas/:id` | operador | (só sem sessões) |

## Sessões e mapa
| Método | Rota | Acesso | Observação |
|---|---|---|---|
| GET | `/sessoes?filmeId=&data=AAAA-MM-DD` | público | futuras por padrão |
| GET | `/sessoes/:id` | público | |
| GET | `/sessoes/:id/mapa` | público | `{ sessao, resumo, filas: [{ fila, assentos: [{ assentoId, numero, status }] }] }` |
| POST | `/sessoes` | operador | `{ filmeId, salaId, inicio (ISO), preco }` — fim calculado pela duração; bloqueia conflito de horário na sala |
| DELETE | `/sessoes/:id` | operador | só sem reservas |

## Reservas e pagamento (cliente)
| Método | Rota | Corpo | Observação |
|---|---|---|---|
| POST | `/reservas` | `{ sessaoId, assentoIds: number[] }` | reserva temporária (expira em `RESERVA_MINUTOS`); total calculado no servidor |
| GET | `/reservas` | — | minhas reservas |
| GET | `/reservas/:id` | — | |
| POST | `/reservas/:id/pagamento` | `{ metodo: PIX\|CARTAO\|DINHEIRO }` | pagamento simulado; emite ingressos com código único |
| POST | `/reservas/:id/cancelar` | — | libera os assentos |
| GET | `/ingressos` | — | meus ingressos |

## Bilheteria (operador)
| Método | Rota | Corpo |
|---|---|---|
| POST | `/bilheteria/vendas` | `{ sessaoId, assentoIds, metodo }` — reserva + pagamento em uma transação |
| GET | `/bilheteria/ingressos/:codigo` | consulta |
| POST | `/bilheteria/validar` | `{ codigo }` — marca como UTILIZADO (portaria abre 2h antes até o fim da sessão) |

## Relatórios (gerência)
| Método | Rota | Retorno |
|---|---|---|
| GET | `/relatorios/ocupacao?de=AAAA-MM-DD&ate=AAAA-MM-DD` | por sessão: capacidade, vendidos, reservados, utilizados, taxa de ocupação, receita |
| GET | `/relatorios/vendas?de=&ate=` | por filme e por método/canal de pagamento |

## Outros
`GET /health` → status da API e do banco.
