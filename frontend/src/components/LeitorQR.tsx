// Versão mobile (Android/iOS): usa a câmera nativa do expo-camera.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '@/lib/theme';
import { Botao } from './ui';
import type { LeitorQRProps } from './LeitorQR.types';

export function LeitorQR({ onLer, pausado }: LeitorQRProps) {
  const [permissao, pedir] = useCameraPermissions();

  if (!permissao) return null;
  if (!permissao.granted) {
    return (
      <View style={s.aviso}>
        <Text style={s.avisoTexto}>Precisamos da câmera para ler o QR code dos ingressos.</Text>
        <Botao titulo="Permitir câmera" onPress={pedir} />
      </View>
    );
  }

  return (
    <View style={s.moldura}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={pausado ? undefined : ({ data }) => onLer(data)}
      />
      <View style={s.mira} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  moldura: { width: '100%', aspectRatio: 1, maxHeight: 420, borderRadius: raio.l, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  mira: { width: '62%', aspectRatio: 1, borderWidth: 3, borderColor: cores.latao, borderRadius: raio.l },
  aviso: { backgroundColor: cores.superficie, borderRadius: raio.l, padding: espaco.l, gap: espaco.m },
  avisoTexto: { color: cores.texto, fontSize: 15 },
});
