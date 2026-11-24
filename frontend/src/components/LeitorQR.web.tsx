// Versão web: câmera via getUserMedia + decodificação com jsQR (funciona em qualquer navegador moderno).
// Observação: navegadores só liberam a câmera em HTTPS (ou localhost).
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '@/lib/theme';
import type { LeitorQRProps } from './LeitorQR.types';

const INTERVALO_MS = 120;
const LARGURA_ANALISE = 480;

export function LeitorQR({ onLer, pausado }: LeitorQRProps) {
  const video = useRef<HTMLVideoElement | null>(null);
  const pausadoRef = useRef(pausado);
  const onLerRef = useRef(onLer);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  pausadoRef.current = pausado;
  onLerRef.current = onLer;

  useEffect(() => {
    let fluxo: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ativo = true;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    async function iniciar() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setErro('A câmera só funciona com o site em HTTPS. Use o campo de código abaixo.');
        return;
      }
      try {
        fluxo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!ativo || !video.current) return;
        video.current.srcObject = fluxo;
        await video.current.play();
        setPronto(true);
        analisar();
      } catch (e) {
        const nome = (e as DOMException)?.name;
        setErro(
          nome === 'NotAllowedError'
            ? 'Acesso à câmera negado. Libere a câmera nas permissões do navegador.'
            : nome === 'NotFoundError'
              ? 'Nenhuma câmera encontrada neste dispositivo.'
              : 'Não foi possível abrir a câmera.',
        );
      }
    }

    function analisar() {
      if (!ativo) return;
      const v = video.current;
      if (v && ctx && v.readyState >= 2 && !pausadoRef.current && v.videoWidth > 0) {
        const escala = LARGURA_ANALISE / v.videoWidth;
        canvas.width = LARGURA_ANALISE;
        canvas.height = Math.round(v.videoHeight * escala);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (qr?.data) onLerRef.current(qr.data.trim());
      }
      timer = setTimeout(analisar, INTERVALO_MS);
    }

    void iniciar();
    return () => {
      ativo = false;
      if (timer) clearTimeout(timer);
      fluxo?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (erro) {
    return (
      <View style={s.aviso} accessibilityRole="alert">
        <Text style={s.avisoTexto}>{erro}</Text>
      </View>
    );
  }

  return (
    <View style={s.moldura}>
      <video
        ref={video}
        muted
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <View style={[s.mira, pausado && { borderColor: cores.textoSuave }]} pointerEvents="none" />
      {!pronto ? <Text style={s.abrindo}>Abrindo a câmera…</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  moldura: { width: '100%', aspectRatio: 1, maxHeight: 420, borderRadius: raio.l, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  mira: { width: '62%', aspectRatio: 1, borderWidth: 3, borderColor: cores.latao, borderRadius: raio.l },
  abrindo: { position: 'absolute', bottom: espaco.l, color: cores.texto },
  aviso: { backgroundColor: cores.superficie, borderRadius: raio.l, padding: espaco.l, borderLeftWidth: 4, borderLeftColor: cores.latao },
  avisoTexto: { color: cores.texto, fontSize: 15, lineHeight: 21 },
});
