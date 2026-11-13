/**
 * Seed: cria o operador (gerência/bilheteria), um cliente de teste,
 * filmes com sinopse e capa, salas com assentos e sessões nos próximos dias.
 * Idempotente: pode rodar mais de uma vez.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { Papel } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { salvarArquivo } from '../src/lib/uploads';

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Catálogo inicial com sinopse e capa original (prisma/seed-assets). */
const CATALOGO = [
  {
    titulo: 'O Último Horizonte',
    descricao:
      'Em 2089, a engenheira Lia Moreno é a última integrante acordada da primeira colônia em Marte. Com o oxigênio acabando e a comunicação com a Terra cortada, ela precisa decidir entre salvar a missão ou a própria tripulação.',
    duracaoMinutos: 128,
    classificacao: '12',
    imagem: 'horizonte.jpg',
    preco: 28,
  },
  {
    titulo: 'Risos de Domingo',
    descricao:
      'Três gerações da família Bertoldi se reúnem para o tradicional almoço de domingo no interior de Santa Catarina. Um segredo revelado entre a polenta e o churrasco transforma a tarde em uma sequência de confusões.',
    duracaoMinutos: 95,
    classificacao: 'L',
    imagem: 'risos.jpg',
    preco: 22,
  },
  {
    titulo: 'Sombras no Porto',
    descricao:
      'Numa noite de chuva, um contêiner aparece vazio no cais e o vigia que o abriu desaparece. A investigadora Helena Kraus descobre que o porto guarda segredos que muita gente poderosa quer manter no escuro.',
    duracaoMinutos: 112,
    classificacao: '16',
    imagem: 'sombras.jpg',
    preco: 30,
  },
  {
    titulo: 'Show: Banda Aurora',
    descricao:
      'A Banda Aurora apresenta ao vivo a turnê do disco "Céu de Inverno", com os sucessos da carreira, novos arranjos e um espetáculo de luzes. Evento especial com lugares marcados.',
    duracaoMinutos: 150,
    classificacao: 'L',
    imagem: 'aurora.jpg',
    preco: 80,
  },
];

async function capa(arquivo: string) {
  const conteudo = fs.readFileSync(path.join(__dirname, 'seed-assets', arquivo));
  return salvarArquivo(conteudo, 'jpg');
}

async function usuario(nome: string, email: string, senha: string, papel: Papel) {
  const senhaHash = await bcrypt.hash(senha, 10);
  return prisma.usuario.upsert({ where: { email }, update: {}, create: { nome, email, senhaHash, papel } });
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

  // Cria os filmes do catálogo; nos já existentes sem capa, aplica capa e sinopse
  for (const item of CATALOGO) {
    const existente = await prisma.filme.findFirst({ where: { titulo: item.titulo } });
    if (!existente) {
      await prisma.filme.create({
        data: {
          titulo: item.titulo,
          descricao: item.descricao,
          duracaoMinutos: item.duracaoMinutos,
          classificacao: item.classificacao,
          imagemUrl: await capa(item.imagem),
        },
      });
    } else if (!existente.imagemUrl) {
      await prisma.filme.update({
        where: { id: existente.id },
        data: { descricao: item.descricao, imagemUrl: await capa(item.imagem) },
      });
    }
  }

  if ((await prisma.sessao.count()) === 0) {
    const filmes = await prisma.filme.findMany({ orderBy: { id: 'asc' } });
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
          const preco = CATALOGO.find((c) => c.titulo === filme.titulo)?.preco ?? 25;
          // Cada INSERT dispara o trigger que gera o mapa de assentos
          await prisma.sessao.create({ data: { filmeId: filme.id, salaId: salas[s].id, inicio, fim, preco } });
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
