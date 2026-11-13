import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { proximosDias } from '@/lib/format';
import { useCarregar } from '@/lib/hooks';
import type { Sessao } from '@/lib/types';
import { cores, espaco, fonte } from '@/lib/theme';
import { FilmeComHorarios } from './SessaoItem';
import { Aviso, Carregando, Vazio } from './ui';

/** Seletor de dia + filmes do dia com seus horários. Usado pelo cliente e pela bilheteria. */
export function ListaSessoes() {
  const dias = useMemo(() => proximosDias(7), []);
  const [dia, setDia] = useState(dias[0].iso);
  const { dados, erro, carregando } = useCarregar(() => api.get<Sessao[]>(`/sessoes?data=${dia}`), [dia]);

  const porFilme = useMemo(() => {
    const m = new Map<number, Sessao[]>();
    for (const se of dados ?? []) {
      if (new Date(se.inicio).getTime() <= Date.now()) continue;
      m.set(se.filme.id, [...(m.get(se.filme.id) ?? []), se]);
    }
    return [...m.values()];
  }, [dados]);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dias}>
        {dias.map((d) => {
          const ativo = d.iso === dia;
          return (
            <Pressable
              key={d.iso}
              onPress={() => setDia(d.iso)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              style={[s.dia, ativo && s.diaAtivo]}
            >
              <Text style={[s.diaRotulo, ativo && s.diaTextoAtivo]}>{d.rotulo}</Text>
              <Text style={[s.diaNum, ativo && s.diaTextoAtivo]}>{d.dia}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {erro ? <Aviso>{erro}</Aviso> : null}
      {carregando && !dados ? (
        <Carregando />
      ) : porFilme.length === 0 ? (
        <Vazio>Nenhuma sessão disponível neste dia. Experimente outra data.</Vazio>
      ) : (
        porFilme.map((sessoes) => (
          <FilmeComHorarios
            key={sessoes[0].filme.id}
            titulo={sessoes[0].filme.titulo}
            classificacao={sessoes[0].filme.classificacao}
            duracao={sessoes[0].filme.duracaoMinutos}
            sessoes={sessoes}
            onEscolher={(se) => router.push(`/sessao/${se.id}`)}
          />
        ))
      )}
    </>
  );
}

const s = StyleSheet.create({
  dias: { gap: espaco.s, paddingVertical: espaco.xs },
  dia: {
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.m,
    borderRadius: 12,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    minWidth: 64,
  },
  diaAtivo: { backgroundColor: cores.latao },
  diaRotulo: { color: cores.textoSuave, fontSize: 13, textTransform: 'capitalize' },
  diaNum: { color: cores.texto, fontFamily: fonte.tituloForte, fontSize: 20 },
  diaTextoAtivo: { color: cores.fundo },
});
