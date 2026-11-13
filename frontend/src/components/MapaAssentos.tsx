import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Mapa, StatusAssento } from '@/lib/types';
import { cores, espaco } from '@/lib/theme';

const COR: Record<StatusAssento | 'SELECIONADO', string> = {
  LIVRE: cores.veludo,
  SELECIONADO: cores.latao,
  RESERVADO: cores.reservado,
  VENDIDO: cores.vendido,
};

/** Poltrona desenhada: encosto arredondado + assento. */
const Poltrona = memo(function Poltrona({ cor, tamanho }: { cor: string; tamanho: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M5 4.5C5 3.1 6.1 2 7.5 2h9C17.9 2 19 3.1 19 4.5V13H5V4.5Z" fill={cor} />
      <Path d="M2.5 11.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V14h13v-2.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V19c0 .6-.4 1-1 1H3.5c-.6 0-1-.4-1-1v-7.5Z" fill={cor} />
      <Path d="M5.5 20v2M18.5 20v2" stroke={cor} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
});

export function MapaAssentos({
  mapa,
  selecionados,
  onAlternar,
}: {
  mapa: Mapa;
  selecionados: number[];
  onAlternar: (assentoId: number) => void;
}) {
  const maiorFila = Math.max(...mapa.filas.map((f) => f.assentos.length), 1);
  const tamanho = Math.max(22, Math.min(34, Math.floor(560 / maiorFila) - 6));

  return (
    <View style={s.container}>
      {/* Tela de projeção */}
      <View style={s.telaWrap} accessibilityLabel="Tela de projeção">
        <Svg width="100%" height={34} viewBox="0 0 300 34" preserveAspectRatio="none">
          <Path d="M10 30 Q150 0 290 30" stroke={cores.tela} strokeWidth={3} fill="none" strokeLinecap="round" />
        </Svg>
        <Text style={s.telaTexto}>tela</Text>
      </View>

      <View style={s.filas}>
        {mapa.filas.map((f) => (
          <View key={f.fila} style={s.fila}>
            <Text style={s.letra}>{f.fila}</Text>
            <View style={s.assentos}>
              {f.assentos.map((a) => {
                const sel = selecionados.includes(a.assentoId);
                const status = sel ? 'SELECIONADO' : a.status;
                const livre = a.status === 'LIVRE';
                const rotulo = `${f.fila}${a.numero}, ${sel ? 'selecionado' : a.status.toLowerCase()}`;
                return (
                  <Pressable
                    key={a.assentoId}
                    disabled={!livre && !sel}
                    onPress={() => onAlternar(a.assentoId)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={rotulo}
                    accessibilityState={{ checked: sel, disabled: !livre && !sel }}
                    hitSlop={2}
                    style={({ pressed }) => [s.assento, pressed && { transform: [{ scale: 0.9 }] }]}
                  >
                    <Poltrona cor={COR[status]} tamanho={tamanho} />
                    {sel || livre ? (
                      <Text style={[s.numero, { width: tamanho }, sel && { color: cores.latao }]}>{a.numero}</Text>
                    ) : (
                      <Text style={[s.numero, { width: tamanho, color: cores.borda }]}>{a.status === 'VENDIDO' ? '×' : '·'}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.letra}>{f.fila}</Text>
          </View>
        ))}
      </View>

      <View style={s.legenda}>
        {(['LIVRE', 'SELECIONADO', 'RESERVADO', 'VENDIDO'] as const).map((k) => (
          <View key={k} style={s.itemLegenda}>
            <Poltrona cor={COR[k]} tamanho={16} />
            <Text style={s.legendaTexto}>
              {{ LIVRE: 'Livre', SELECIONADO: 'Sua escolha', RESERVADO: 'Reservado', VENDIDO: 'Vendido' }[k]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: espaco.l, paddingVertical: espaco.s },
  telaWrap: { alignItems: 'center', paddingHorizontal: espaco.xl },
  telaTexto: { color: cores.textoSuave, fontSize: 12, letterSpacing: 2, marginTop: -4 },
  filas: { gap: 6, alignItems: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  letra: { width: 16, textAlign: 'center', color: cores.textoSuave, fontWeight: '700', fontSize: 13 },
  assentos: { flexDirection: 'row', gap: 4 },
  assento: { alignItems: 'center' },
  numero: { textAlign: 'center', color: cores.textoSuave, fontSize: 9, marginTop: 1 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espaco.l },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaTexto: { color: cores.textoSuave, fontSize: 13 },
});
