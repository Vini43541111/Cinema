import { Image, StyleSheet, Text, View } from 'react-native';
import { urlImagem } from '@/lib/api';
import { cores, fonte, raio } from '@/lib/theme';

/** Capa do filme (proporção de cartaz 2:3). Sem imagem, mostra o título sobre o veludo. */
export function Capa({ url, titulo, largura }: { url: string | null; titulo: string; largura: number }) {
  const altura = Math.round(largura * 1.5);
  const fonteUrl = urlImagem(url);
  if (fonteUrl) {
    return (
      <Image
        source={{ uri: fonteUrl }}
        style={[s.capa, { width: largura, height: altura }]}
        resizeMode="cover"
        accessibilityLabel={`Cartaz de ${titulo}`}
      />
    );
  }
  return (
    <View style={[s.capa, s.semCapa, { width: largura, height: altura }]} accessibilityLabel={`Sem cartaz: ${titulo}`}>
      <Text style={[s.titulo, { fontSize: Math.max(14, largura / 6) }]} numberOfLines={4}>
        {titulo}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  capa: { borderRadius: raio.m, backgroundColor: cores.superficieAlta },
  semCapa: { backgroundColor: cores.veludoEscuro, padding: 8, justifyContent: 'flex-end' },
  titulo: { fontFamily: fonte.tituloForte, color: cores.texto, lineHeight: undefined },
});
