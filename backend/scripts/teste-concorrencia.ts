/**
 * Teste de concorrência: N clientes tentam reservar o MESMO assento no mesmo instante.
 * Resultado esperado: exatamente 1 sucesso (201) e N-1 conflitos (409).
 *
 * Uso: API_URL=https://seu-dominio/api npx tsx scripts/teste-concorrencia.ts [N]
 */
const API = process.env.API_URL ?? 'http://localhost:3333/api';
const N = Number(process.argv[2] ?? 30);

async function req(path: string, init: RequestInit & { token?: string } = {}) {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
    },
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function main() {
  const sufixo = Date.now();
  console.log(`Criando ${N} clientes de teste...`);
  const tokens = await Promise.all(
    Array.from({ length: N }, async (_, i) => {
      const r = await req('/auth/registrar', {
        method: 'POST',
        body: JSON.stringify({ nome: `Teste Concorrencia ${i}`, email: `conc${sufixo}_${i}@teste.com`, senha: 'teste123' }),
      });
      if (r.status !== 201) throw new Error(`Falha ao registrar: ${JSON.stringify(r.body)}`);
      return r.body.token as string;
    }),
  );

  const sessoes = (await req('/sessoes')).body as { id: number }[];
  let alvo: { sessaoId: number; assentoId: number; nome: string } | null = null;
  for (const s of sessoes) {
    const mapa = (await req(`/sessoes/${s.id}/mapa`)).body;
    for (const f of mapa.filas) {
      const livre = f.assentos.find((a: { status: string }) => a.status === 'LIVRE');
      if (livre) {
        alvo = { sessaoId: s.id, assentoId: livre.assentoId, nome: `${f.fila}${livre.numero}` };
        break;
      }
    }
    if (alvo) break;
  }
  if (!alvo) throw new Error('Nenhum assento livre encontrado');

  console.log(`Disparando ${N} reservas simultâneas do assento ${alvo.nome} (sessão ${alvo.sessaoId})...`);
  const inicio = Date.now();
  const resultados = await Promise.all(
    tokens.map((token) =>
      req('/reservas', {
        method: 'POST',
        token,
        body: JSON.stringify({ sessaoId: alvo!.sessaoId, assentoIds: [alvo!.assentoId] }),
      }),
    ),
  );

  const porStatus = resultados.reduce<Record<number, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Concluído em ${Date.now() - inicio} ms. Respostas por status HTTP:`, porStatus);

  const ok = porStatus[201] === 1 && (porStatus[409] ?? 0) === N - 1;
  console.log(ok ? '✅ OK: o assento foi reservado para apenas UM cliente.' : '❌ FALHA: resultado inesperado!');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
