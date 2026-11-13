import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { dataHora } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';

/** Ingresso em formato de "canhoto": dados à esquerda, QR com o código à direita. */
export function IngressoCartao({
  codigo,
  filme,
  sala,
  inicio,
  assento,
  utilizado,
}: {
  codigo: string;
  filme: string;
  sala: string;
  inicio: string;
  assento: string;
  utilizado?: boolean;
}) {
  return (
    <View style={[s.ingresso, utilizado && { opacity: 0.55 }]} accessibilityLabel={`Ingresso ${codigo}, ${filme}, assento ${assento}`}>
      <View style={s.dados}>
        <Text style={s.filme} numberOfLines={2}>{filme}</Text>
        <Text style={s.meta}>{dataHora(inicio)}</Text>
        <Text style={s.meta}>{sala}</Text>
        <View style={s.assentoBox}>
          <Text style={s.assentoRotulo}>Assento</Text>
          <Text style={s.assento}>{assento}</Text>
        </View>
        {utilizado ? <Text style={s.usado}>Utilizado</Text> : null}
      </View>
      <View style={s.picote} />
      <View style={s.qr}>
        <View style={s.qrFundo}>
          <QRCode value={codigo} size={96} backgroundColor="#FFFFFF" color="#16141F" />
        </View>
        <Text style={s.codigo} selectable>{codigo}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ingresso: { flexDirection: 'row', backgroundColor: cores.superficie, borderRadius: raio.l, overflow: 'hidden' },
  dados: { flex: 1, padding: espaco.l, gap: 2, borderLeftWidth: 4, borderLeftColor: cores.veludo },
  filme: { fontFamily: fonte.titulo, fontSize: 22, lineHeight: 25, color: cores.texto, marginBottom: 4 },
  meta: { color: cores.textoSuave, fontSize: 14 },
  assentoBox: { marginTop: espaco.s },
  assentoRotulo: { color: cores.textoSuave, fontSize: 12 },
  assento: { fontFamily: fonte.tituloForte, fontSize: 32, lineHeight: 34, color: cores.latao },
  usado: { color: cores.erro, fontWeight: '700', marginTop: 4 },
  picote: { width: 0, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: cores.borda, marginVertical: espaco.m },
  qr: { padding: espaco.m, alignItems: 'center', justifyContent: 'center', gap: 6 },
  qrFundo: { backgroundColor: '#fff', padding: 6, borderRadius: 6 },
  codigo: { color: cores.texto, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
