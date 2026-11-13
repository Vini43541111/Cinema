/**
 * Seed: cria o operador (gerência/bilheteria), um cliente de teste,
 * filmes, salas com assentos e sessões nos próximos dias.
 * Idempotente: pode rodar mais de uma vez.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Papel } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

async function usuario(nome: string, email: string, senha: string, papel: Papel) {
  const senhaHash = await bcrypt.hash(senha, 10);
  return prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { nome, email, senhaHash, papel },
  });
}

async function sala(nome: string, filas: number, porFila: number) {
  const existente = await prisma.sala.findUnique({ where: { nome } });
  if (existente) return existente;
  const assentos = [];
  for (let f = 0; f < filas; f++) for (let n = 1; n <= porFila; n++) assentos.push({ fila: LETRAS[f], numero: n });
  return prisma.sala.create({ data: { nome, assentos: { createMany: { data: assentos } } } });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cinema.com';
  const adminSenha = process.env.SEED_ADMIN_SENHA ?? 'Admin@123';
  await usuario('Gerência', adminEmail, adminSenha, Papel.OPERADOR);
  await usuario('Cliente Teste', 'cliente@cinema.com', 'Cliente@123', Papel.CLIENTE);

  const salas = [await sala('Sala 1', 8, 12), await sala('Sala 2', 6, 10), await sala('Sala VIP', 4, 8)];

  if ((await prisma.filme.count()) === 0) {
    await prisma.filme.createMany({
      data: [
        { titulo: 'O Último Horizonte', descricao: 'Ficção científica sobre a primeira colônia em Marte.', duracaoMinutos: 128, classificacao: '12' },
        { titulo: 'Risos de Domingo', descricao: 'Comédia familiar ambientada no oeste catarinense.', duracaoMinutos: 95, classificacao: 'L' },
        { titulo: 'Sombras no Porto', descricao: 'Suspense policial em uma cidade portuária.', duracaoMinutos: 112, classificacao: '16' },
        { titulo: 'Show: Banda Aurora', descricao: 'Apresentação ao vivo — evento especial.', duracaoMinutos: 150, classificacao: 'L' },
      ],
    });
  }

  if ((await prisma.sessao.count()) === 0) {
    const filmes = await prisma.filme.findMany({ orderBy: { id: 'asc' } });
    const precos = [28, 22, 30, 80];
    const horarios = ['14:00', '17:00', '20:30'];
    // Sessões para hoje + 6 dias (horário de Brasília)
    for (let d = 0; d < 7; d++) {
      const dia = new Date(Date.now() + d * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      for (let s = 0; s < salas.length; s++) {
        for (let h = 0; h < horarios.length; h++) {
          const filme = filmes[(s + h + d) % filmes.length];
          const inicio = new Date(`${dia}T${horarios[h]}:00-03:00`);
          if (inicio.getTime() <= Date.now()) continue;
          const fim = new Date(inicio.getTime() + filme.duracaoMinutos * 60_000);
          // Cada INSERT dispara o trigger que gera o mapa de assentos
          await prisma.sessao.create({
            data: { filmeId: filme.id, salaId: salas[s].id, inicio, fim, preco: precos[filmes.indexOf(filme)] },
          });
        }
      }
    }
  }

  const resumo = {
    usuarios: await prisma.usuario.count(),
    filmes: await prisma.filme.count(),
    salas: await prisma.sala.count(),
    sessoes: await prisma.sessao.count(),
    mapaAssentos: await prisma.sessaoAssento.count(),
  };
  console.log('Seed concluído:', resumo);
  console.log(`Operador: ${adminEmail} / ${adminSenha}`);
  console.log('Cliente:  cliente@cinema.com / Cliente@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
