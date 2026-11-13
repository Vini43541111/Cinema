import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aviso, Bloco, Carregando, Linha, Opcoes, Subtitulo, Tela, Texto, Titulo, Vazio } from '@/components/ui';
import { api } from '@/lib/api';
import { dataHora, isoDia, metodoRotulo, moeda } from '@/lib/format';
import { useCarregar } from '@/lib/hooks';
import type { RelatorioOcupacao, RelatorioVendas } from '@/lib/types';
import { cores, espaco, fonte } from '@/lib/theme';

const DIA = 86_400_000;
type Periodo = 'hoje' | '7' | '30' | 'proximos';

function intervalo(p: Periodo) {
  const hoje = Date.now();
  if (p === 'hoje') return { de: isoDia(new Date(hoje)), ate: isoDia(new Date(hoje)) };
  if (p === 'proximos') return { de: isoDia(new Date(hoje)), ate: isoDia(new Date(hoje + 7 * DIA)) };
  return { de: isoDia(new Date(hoje - Number(p) * DIA)), ate: isoDia(new Date(hoje)) };
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('proximos');
  const { de, ate } = intervalo(periodo);
  const ocupacao = useCarregar(() => api.get<RelatorioOcupacao>(`/relatorios/ocupacao?de=${de}&ate=${ate}`), [de, ate]);
  const vendas = useCarregar(() => api.get<RelatorioVendas>(`/relatorios/vendas?de=${de}&ate=${ate}`), [de, ate]);

  return (
    <Tela>
      <Titulo>Relatórios</Titulo>
      <Opcoes
        valor={periodo}
        onChange={setPeriodo}
        opcoes={[
          { valor: 'hoje', rotulo: 'Hoje' },
          { valor: 'proximos', rotulo: 'Próximos 7 dias' },
          { valor: '7', rotulo: 'Últimos 7 dias' },
          { valor: '30', rotulo: 'Últimos 30 dias' },
        ]}
      />
      {ocupacao.erro ? <Aviso>{ocupacao.erro}</Aviso> : null}

      {vendas.dados ? (
        <View style={s.numeros}>
          <Numero rotulo="Receita" valor={moeda(vendas.dados.totais.receita)} />
          <Numero rotulo="Ingressos vendidos" valor={String(vendas.dados.totais.ingressos)} />
          <Numero rotulo="Ocupação média" valor={`${ocupacao.dados?.totais.taxaOcupacaoMedia ?? 0}%`} />
        </View>
      ) : (
        <Carregando />
      )}

      <Subtitulo>Vendas por filme</Subtitulo>
      {vendas.dados?.porFilme.length === 0 ? <Vazio>Nenhuma venda no período.</Vazio> : null}
      {vendas.dados?.porFilme.map((f) => (
        <Bloco key={f.filmeId}>
          <Linha>
            <Texto estilo={{ flex: 1, fontWeight: '700' }}>{f.filme}</Texto>
            <Texto estilo={{ color: cores.latao, fontWeight: '700' }}>{moeda(f.receita)}</Texto>
          </Linha>
          <Texto suave>
            {f.ingressos} ingressos em {f.sessoes} {f.sessoes === 1 ? 'sessão' : 'sessões'}, ticket médio {moeda(f.ticketMedio)}
          </Texto>
        </Bloco>
      ))}

      {vendas.dados && vendas.dados.porMetodo.length > 0 ? (
        <>
          <Subtitulo>Por forma de pagamento</Subtitulo>
          <Bloco>
            {vendas.dados.porMetodo.map((m) => (
              <Linha key={`${m.metodo}-${m.canal}`}>
                <Texto estilo={{ flex: 1 }}>
                  {metodoRotulo[m.metodo]} ({m.canal === 'BALCAO' ? 'balcão' : 'app'})
                </Texto>
                <Texto suave>{m.pagamentos}x</Texto>
                <Texto estilo={{ fontWeight: '700', minWidth: 96, textAlign: 'right' }}>{moeda(m.receita)}</Texto>
              </Linha>
            ))}
          </Bloco>
        </>
      ) : null}

      <Subtitulo>Ocupação por sessão</Subtitulo>
      {ocupacao.dados?.sessoes.length === 0 ? <Vazio>Nenhuma sessão no período.</Vazio> : null}
      {ocupacao.dados?.sessoes.map((se) => (
        <Bloco key={se.sessaoId}>
          <Linha>
            <Texto estilo={{ flex: 1, fontWeight: '700' }}>{se.filme}</Texto>
            <Text style={s.taxa}>{se.taxaOcupacao}%</Text>
          </Linha>
          <Texto suave>{se.sala}, {dataHora(se.inicio)}</Texto>
          <View style={s.barra} accessibilityLabel={`${se.vendidos} vendidos e ${se.reservados} reservados de ${se.capacidade}`}>
            <View style={{ flex: se.vendidos, backgroundColor: cores.veludo }} />
            <View style={{ flex: se.reservados, backgroundColor: cores.reservado }} />
            <View style={{ flex: Math.max(se.capacidade - se.vendidos - se.reservados, 0), backgroundColor: cores.superficieAlta }} />
          </View>
          <Texto suave estilo={{ fontSize: 13 }}>
            {se.vendidos} vendidos, {se.reservados} reservados, {se.utilizados} entraram, de {se.capacidade} lugares. Receita {moeda(se.receita)}
          </Texto>
        </Bloco>
      ))}
    </Tela>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={s.numero}>
      <Text style={s.numeroValor}>{valor}</Text>
      <Text style={s.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  numeros: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  numero: { flexGrow: 1, flexBasis: 150, backgroundColor: cores.superficie, borderRadius: 16, padding: espaco.l },
  numeroValor: { fontFamily: fonte.tituloForte, fontSize: 30, color: cores.texto },
  numeroRotulo: { color: cores.textoSuave, fontSize: 13 },
  taxa: { fontFamily: fonte.tituloForte, fontSize: 24, color: cores.latao },
  barra: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: cores.superficieAlta },
});
