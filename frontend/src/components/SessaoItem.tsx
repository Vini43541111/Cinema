import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Sessao } from '@/lib/types';
import { hora, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import { Capa } from './Capa';
import { Bloco } from './ui';

export function Classificacao({ valor }: { valor: string }) {
  const cor = { L: '#2E9E5B', '10': '#2B7FD6', '12': '#E0B42C', '14': '#E07B24', '16': '#D33A2C', '18': '#1B1B1B' }[valor] ?? cores.borda;
  return (
    <View style={[s.classif, { backgroundColor: cor }]} accessibilityLabel={`Classificação ${valor === 'L' ? 'livre' : valor + ' anos'}`}>
      <Text style={s.classifTexto}>{valor}</Text>
    </View>
  );
}

export const duracaoTexto = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;

/** Filme do catálogo: capa, sinopse e os horários do dia como "ingressos" clicáveis. */
export function FilmeComHorarios({ filme, sessoes, onEscolher }: { filme: Sessao['filme']; sessoes: Sessao[]; onEscolher: (s: Sessao) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Bloco>
      <View style={s.topo}>
        <Capa url={filme.imagemUrl} titulo={filme.titulo} largura={104} />
        <View style={s.info}>
          <Text style={s.titulo} numberOfLines={2}>{filme.titulo}</Text>
          <View style={s.metaLinha}>
            <Classificacao valor={filme.classificacao} />
            <Text style={s.meta}>{duracaoTexto(filme.duracaoMinutos)}</Text>
          </View>
          {filme.descricao ? (
            <Pressable onPress={() => setAberto((a) => !a)} accessibilityRole="button" accessibilityLabel={aberto ? 'Recolher sinopse' : 'Ler sinopse completa'}>
              <Text style={s.sinopse} numberOfLines={aberto ? undefined : 4}>{filme.descricao}</Text>
              <Text style={s.mais}>{aberto ? 'Ler menos' : 'Ler mais'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
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
  topo: { flexDirection: 'row', gap: espaco.l },
  info: { flex: 1, gap: 6 },
  titulo: { fontFamily: fonte.titulo, fontSize: 26, lineHeight: 29, color: cores.texto },
  metaLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  meta: { color: cores.textoSuave, fontSize: 14 },
  sinopse: { color: cores.textoSuave, fontSize: 14, lineHeight: 20 },
  mais: { color: cores.latao, fontSize: 13, marginTop: 2, fontWeight: '600' },
  classif: { minWidth: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  classifTexto: { color: '#fff', fontWeight: '800', fontSize: 13 },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s, marginTop: espaco.s },
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
