# Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    USUARIO ||--o{ RESERVA : faz
    USUARIO ||--o{ INGRESSO : "valida (operador)"
    FILME ||--o{ SESSAO : possui
    SALA ||--|{ ASSENTO : contem
    SALA ||--o{ SESSAO : recebe
    SESSAO ||--|{ SESSAO_ASSENTO : "mapa de assentos"
    ASSENTO ||--o{ SESSAO_ASSENTO : "estado por sessão"
    RESERVA |o--o{ SESSAO_ASSENTO : segura
    SESSAO ||--o{ RESERVA : tem
    RESERVA ||--o| PAGAMENTO : "é paga por"
    RESERVA ||--o{ INGRESSO : emite
    SESSAO ||--o{ INGRESSO : para
    ASSENTO ||--o{ INGRESSO : ocupa

    USUARIO {
        int id PK
        varchar nome
        varchar email UK
        varchar senha_hash
        enum papel "CLIENTE | OPERADOR"
        timestamptz criado_em
    }
    FILME {
        int id PK
        varchar titulo
        text descricao
        int duracao_minutos "CHECK > 0"
        varchar classificacao
        boolean ativo
    }
    SALA {
        int id PK
        varchar nome UK
    }
    ASSENTO {
        int id PK
        int sala_id FK
        varchar fila
        int numero "UK(sala_id, fila, numero)"
    }
    SESSAO {
        int id PK
        int filme_id FK
        int sala_id FK
        timestamptz inicio
        timestamptz fim "CHECK fim > inicio"
        decimal preco "CHECK >= 0"
    }
    SESSAO_ASSENTO {
        int id PK
        int sessao_id FK
        int assento_id FK "UK(sessao_id, assento_id)"
        enum status "LIVRE | RESERVADO | VENDIDO"
        int reserva_id FK
        timestamptz expira_em
    }
    RESERVA {
        int id PK
        int usuario_id FK
        int sessao_id FK
        enum status "PENDENTE | PAGA | EXPIRADA | CANCELADA"
        enum canal "ONLINE | BALCAO"
        decimal total
        timestamptz expira_em
    }
    PAGAMENTO {
        int id PK
        int reserva_id FK "UK"
        enum metodo "PIX | CARTAO | DINHEIRO"
        decimal valor
        timestamptz pago_em
    }
    INGRESSO {
        int id PK
        varchar codigo UK
        int reserva_id FK
        int sessao_id FK
        int assento_id FK "UK(sessao_id, assento_id)"
        decimal valor
        enum status "VALIDO | UTILIZADO"
        timestamptz utilizado_em
        int validado_por_id FK
    }
```

## Índices
`sessao(filme_id)`, `sessao(sala_id, inicio)`, `sessao(inicio)`, `sessao_assento(sessao_id, status)`, `sessao_assento(reserva_id)`, `reserva(usuario_id)`, `reserva(status, expira_em)` (usado pela procedure de expiração), `pagamento(pago_em)` (relatório de vendas), `ingresso(reserva_id)`, `filme(ativo)`.
