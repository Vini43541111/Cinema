-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('CLIENTE', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusAssento" AS ENUM ('LIVRE', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'PAGA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CanalVenda" AS ENUM ('ONLINE', 'BALCAO');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CARTAO', 'DINHEIRO');

-- CreateEnum
CREATE TYPE "StatusIngresso" AS ENUM ('VALIDO', 'UTILIZADO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "senha_hash" VARCHAR(100) NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'CLIENTE',
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filme" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "descricao" TEXT,
    "duracao_minutos" INTEGER NOT NULL,
    "classificacao" VARCHAR(10) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sala" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assento" (
    "id" SERIAL NOT NULL,
    "sala_id" INTEGER NOT NULL,
    "fila" VARCHAR(3) NOT NULL,
    "numero" INTEGER NOT NULL,

    CONSTRAINT "assento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao" (
    "id" SERIAL NOT NULL,
    "filme_id" INTEGER NOT NULL,
    "sala_id" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao_assento" (
    "id" SERIAL NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "assento_id" INTEGER NOT NULL,
    "status" "StatusAssento" NOT NULL DEFAULT 'LIVRE',
    "reserva_id" INTEGER,
    "expira_em" TIMESTAMPTZ(3),

    CONSTRAINT "sessao_assento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',
    "canal" "CanalVenda" NOT NULL DEFAULT 'ONLINE',
    "total" DECIMAL(10,2) NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "pago_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresso" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "assento_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusIngresso" NOT NULL DEFAULT 'VALIDO',
    "emitido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilizado_em" TIMESTAMPTZ(3),
    "validado_por_id" INTEGER,

    CONSTRAINT "ingresso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "filme_ativo_idx" ON "filme"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "sala_nome_key" ON "sala"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "assento_sala_id_fila_numero_key" ON "assento"("sala_id", "fila", "numero");

-- CreateIndex
CREATE INDEX "sessao_filme_id_idx" ON "sessao"("filme_id");

-- CreateIndex
CREATE INDEX "sessao_sala_id_inicio_idx" ON "sessao"("sala_id", "inicio");

-- CreateIndex
CREATE INDEX "sessao_inicio_idx" ON "sessao"("inicio");

-- CreateIndex
CREATE INDEX "sessao_assento_sessao_id_status_idx" ON "sessao_assento"("sessao_id", "status");

-- CreateIndex
CREATE INDEX "sessao_assento_reserva_id_idx" ON "sessao_assento"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessao_assento_sessao_id_assento_id_key" ON "sessao_assento"("sessao_id", "assento_id");

-- CreateIndex
CREATE INDEX "reserva_usuario_id_idx" ON "reserva"("usuario_id");

-- CreateIndex
CREATE INDEX "reserva_status_expira_em_idx" ON "reserva"("status", "expira_em");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_reserva_id_key" ON "pagamento"("reserva_id");

-- CreateIndex
CREATE INDEX "pagamento_pago_em_idx" ON "pagamento"("pago_em");

-- CreateIndex
CREATE UNIQUE INDEX "ingresso_codigo_key" ON "ingresso"("codigo");

-- CreateIndex
CREATE INDEX "ingresso_reserva_id_idx" ON "ingresso"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingresso_sessao_id_assento_id_key" ON "ingresso"("sessao_id", "assento_id");

-- AddForeignKey
ALTER TABLE "assento" ADD CONSTRAINT "assento_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_filme_id_fkey" FOREIGN KEY ("filme_id") REFERENCES "filme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_assento" ADD CONSTRAINT "sessao_assento_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_assento" ADD CONSTRAINT "sessao_assento_assento_id_fkey" FOREIGN KEY ("assento_id") REFERENCES "assento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_assento" ADD CONSTRAINT "sessao_assento_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresso" ADD CONSTRAINT "ingresso_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresso" ADD CONSTRAINT "ingresso_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresso" ADD CONSTRAINT "ingresso_assento_id_fkey" FOREIGN KEY ("assento_id") REFERENCES "assento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresso" ADD CONSTRAINT "ingresso_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
