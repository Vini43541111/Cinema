-- =====================================================================
-- Migração 2: constraints de domínio, triggers, stored procedure e
-- função de relatório (SQL que o Prisma Schema não expressa sozinho).
-- =====================================================================

-- ---------------------------------------------------------------------
-- CHECK constraints (regras de integridade no nível do banco)
-- ---------------------------------------------------------------------
ALTER TABLE "filme"   ADD CONSTRAINT "filme_duracao_chk"   CHECK ("duracao_minutos" > 0);
ALTER TABLE "assento" ADD CONSTRAINT "assento_numero_chk"  CHECK ("numero" > 0);
ALTER TABLE "sessao"  ADD CONSTRAINT "sessao_preco_chk"    CHECK ("preco" >= 0);
ALTER TABLE "sessao"  ADD CONSTRAINT "sessao_periodo_chk"  CHECK ("fim" > "inicio");
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_total_chk"   CHECK ("total" >= 0);
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_valor_chk" CHECK ("valor" >= 0);
ALTER TABLE "ingresso"  ADD CONSTRAINT "ingresso_valor_chk"  CHECK ("valor" >= 0);

-- Coerência do estado do assento na sessão:
--   LIVRE     => sem reserva e sem expiração
--   RESERVADO => com reserva e com expiração
--   VENDIDO   => com reserva e sem expiração
ALTER TABLE "sessao_assento" ADD CONSTRAINT "sessao_assento_estado_chk" CHECK (
  ("status" = 'LIVRE'     AND "reserva_id" IS NULL     AND "expira_em" IS NULL) OR
  ("status" = 'RESERVADO' AND "reserva_id" IS NOT NULL AND "expira_em" IS NOT NULL) OR
  ("status" = 'VENDIDO'   AND "reserva_id" IS NOT NULL AND "expira_em" IS NULL)
);

-- Ingresso utilizado precisa ter data de utilização
ALTER TABLE "ingresso" ADD CONSTRAINT "ingresso_utilizacao_chk" CHECK (
  ("status" = 'VALIDO' AND "utilizado_em" IS NULL) OR
  ("status" = 'UTILIZADO' AND "utilizado_em" IS NOT NULL)
);

-- ---------------------------------------------------------------------
-- TRIGGER 1: ao criar uma sessão, gera o mapa de assentos (todos LIVRE)
-- a partir dos assentos fixos da sala.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_gerar_mapa_assentos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "sessao_assento" ("sessao_id", "assento_id", "status")
  SELECT NEW."id", a."id", 'LIVRE'
    FROM "assento" a
   WHERE a."sala_id" = NEW."sala_id";
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sessao_gerar_mapa
AFTER INSERT ON "sessao"
FOR EACH ROW
EXECUTE FUNCTION fn_gerar_mapa_assentos();

-- ---------------------------------------------------------------------
-- TRIGGER 2: ingresso já utilizado é imutável (não volta a ser válido,
-- não pode ser excluído) — proteção contra fraude na entrada.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_ingresso_protege_utilizado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."status" = 'UTILIZADO' THEN
    RAISE EXCEPTION 'Ingresso % já foi utilizado e não pode ser alterado', OLD."codigo"
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ingresso_protege_utilizado
BEFORE UPDATE OR DELETE ON "ingresso"
FOR EACH ROW
EXECUTE FUNCTION fn_ingresso_protege_utilizado();

-- ---------------------------------------------------------------------
-- STORED PROCEDURE: expira reservas pendentes vencidas e libera os
-- assentos. Executada periodicamente pelo job do back-end.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_expirar_reservas(OUT p_qtd_reservas INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  WITH vencidas AS (
    UPDATE "reserva"
       SET "status" = 'EXPIRADA'
     WHERE "status" = 'PENDENTE'
       AND "expira_em" < now()
    RETURNING "id"
  ), liberados AS (
    UPDATE "sessao_assento" sa
       SET "status" = 'LIVRE', "reserva_id" = NULL, "expira_em" = NULL
      FROM vencidas v
     WHERE sa."reserva_id" = v."id"
       AND sa."status" = 'RESERVADO'
    RETURNING sa."id"
  )
  SELECT count(*) INTO p_qtd_reservas FROM vencidas;
END;
$$;

-- ---------------------------------------------------------------------
-- FUNÇÃO DE RELATÓRIO: ocupação e receita por sessão
-- (junta sessao, filme, sala, sessao_assento e ingresso)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_relatorio_ocupacao(p_inicio TIMESTAMPTZ, p_fim TIMESTAMPTZ)
RETURNS TABLE (
  sessao_id      INTEGER,
  filme          VARCHAR,
  sala           VARCHAR,
  inicio         TIMESTAMPTZ,
  preco          NUMERIC,
  capacidade     BIGINT,
  vendidos       BIGINT,
  reservados     BIGINT,
  utilizados     BIGINT,
  taxa_ocupacao  NUMERIC,
  receita        NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT s."id",
         f."titulo",
         sl."nome",
         s."inicio",
         s."preco",
         count(sa."id")                                            AS capacidade,
         count(sa."id") FILTER (WHERE sa."status" = 'VENDIDO')     AS vendidos,
         count(sa."id") FILTER (WHERE sa."status" = 'RESERVADO'
                                  AND sa."expira_em" >= now())      AS reservados,
         (SELECT count(*) FROM "ingresso" i
           WHERE i."sessao_id" = s."id" AND i."status" = 'UTILIZADO') AS utilizados,
         round(100.0 * count(sa."id") FILTER (WHERE sa."status" = 'VENDIDO')
               / NULLIF(count(sa."id"), 0), 2)                     AS taxa_ocupacao,
         COALESCE((SELECT sum(i."valor") FROM "ingresso" i
                    WHERE i."sessao_id" = s."id"), 0)              AS receita
    FROM "sessao" s
    JOIN "filme" f  ON f."id"  = s."filme_id"
    JOIN "sala"  sl ON sl."id" = s."sala_id"
    LEFT JOIN "sessao_assento" sa ON sa."sessao_id" = s."id"
   WHERE s."inicio" >= p_inicio
     AND s."inicio" <  p_fim
   GROUP BY s."id", f."titulo", sl."nome", s."inicio", s."preco"
   ORDER BY s."inicio";
$$;
