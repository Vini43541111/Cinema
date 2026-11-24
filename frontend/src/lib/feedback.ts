import { Platform, Vibration } from 'react-native';

let audio: AudioContext | null = null;

function bip(frequencias: number[], duracao = 0.12) {
  if (Platform.OS !== 'web') return;
  try {
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!AC) return;
    audio ??= new AC();
    let t = audio.currentTime;
    for (const f of frequencias) {
      const osc = audio.createOscillator();
      const ganho = audio.createGain();
      osc.frequency.value = f;
      osc.type = 'sine';
      ganho.gain.setValueAtTime(0.18, t);
      ganho.gain.exponentialRampToValueAtTime(0.001, t + duracao);
      osc.connect(ganho).connect(audio.destination);
      osc.start(t);
      osc.stop(t + duracao);
      t += duracao + 0.04;
    }
  } catch {
    /* sem áudio: ignora */
  }
}

function vibrar(padrao: number | number[]) {
  try {
    if (Platform.OS === 'web') (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(padrao);
    else Vibration.vibrate(padrao);
  } catch {
    /* ignora */
  }
}

/** Retorno sonoro/tátil da validação na portaria. */
export const feedback = {
  /** Navegadores só liberam áudio após um toque do usuário: chamar no botão que abre a câmera. */
  preparar() {
    if (Platform.OS !== 'web') return;
    try {
      const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
      if (AC) {
        audio ??= new AC();
        void audio.resume();
      }
    } catch {
      /* ignora */
    }
  },
  sucesso() {
    bip([880, 1320]);
    vibrar(120);
  },
  falha() {
    bip([300, 220], 0.18);
    vibrar([80, 60, 80, 60, 200]);
  },
};
