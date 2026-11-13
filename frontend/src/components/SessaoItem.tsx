import { StyleSheet, Text, View } from 'react-native';
import type { Sessao } from '@/lib/types';
import { hora, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import { Bloco } from './ui';

export function Classificacao({ valor }: { valor: string }) {
  const cor = { L: '#2E9E5B', '10': '#2B7FD6', '12': '#E0B42C', '14': '#E07B24', '16': '#D33A2C', '18': '#1B1B1B' }[valor] ?? cores.borda;
  return (
    <View style={[s.classif, { backgroundColor: cor }]} accessibilityLabel={`Classificação ${valor === 'L' ? 'livre' : valor + ' anos'}`}>
      <Text style={s.classifTexto}>{valor}</Text>
    </View>
  );
}

/** Agrupa sessões por filme, mostrando os horários como "ingressos" clicáveis. */
export function FilmeComHorarios({
  titulo,
  classificacao,
  duracao,
  sessoes,
  onEscolher,
}: {
  titulo: string;
  classificacao: string;
  duracao: number;
  sessoes: Sessao[];
  onEscolher: (s: Sessao) => void;
}) {
  return (
    <Bloco>
      <View style={s.cabecalho}>
        <Classificacao valor={classificacao} />
        <Text style={s.titulo} numberOfLines={2}>{titulo}</Text>
      </View>
      <Text style={s.meta}>{Math.floor(duracao / 60)}h{String(duracao % 60).padStart(2, '0')}</Text>
      <View style={s.horarios}>
        {sessoes.map((se) => (
          <Bloco key={se.id} onPress={() => onEscolher(se)} estilo={s.horario}>
            <Text style={s.hora}>{hora(se.inicio)}</Text>
            <Text style={s.horarioMeta}>{se.sala.nome}</Text>
            <Text style={s.horarioMeta}>{moeda(se.preco)}</Text>
          </Bloco>
        ))}
      </View>
    </Bloco>
  );
}

const s = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  titulo: { flex: 1, fontFamily: fonte.titulo, fontSize: 24, lineHeight: 28, color: cores.texto },
  meta: { color: cores.textoSuave, fontSize: 13 },
  classif: { minWidth: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  classifTexto: { color: '#fff', fontWeight: '800', fontSize: 14 },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s, marginTop: espaco.xs },
  horario: {
    backgroundColor: cores.superficieAlta,
    borderRadius: raio.m,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.m,
    gap: 0,
    minWidth: 96,
    borderLeftWidth: 3,
    borderLeftColor: cores.veludo,
  },
  hora: { fontFamily: fonte.tituloForte, fontSize: 24, lineHeight: 26, color: cores.texto },
  horarioMeta: { color: cores.textoSuave, fontSize: 12 },
});
