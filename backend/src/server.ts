import { app } from './app';
import { env } from './config/env';
import { iniciarJobExpiracao } from './jobs/expiracao.job';
import { prisma } from './lib/prisma';

const servidor = app.listen(env.PORT, () => {
  console.log(`API da bilheteria ouvindo na porta ${env.PORT} (${env.NODE_ENV})`);
});

const job = iniciarJobExpiracao();

async function encerrar(sinal: string) {
  console.log(`${sinal} recebido, encerrando...`);
  clearInterval(job);
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void encerrar('SIGINT'));
process.on('SIGTERM', () => void encerrar('SIGTERM'));
