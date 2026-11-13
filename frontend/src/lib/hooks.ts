import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { mensagemErro } from './api';

/** Carrega dados ao focar a tela; expõe recarregar() e polling opcional. */
export function useCarregar<T>(fn: () => Promise<T>, deps: unknown[] = [], pollingMs?: number) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const recarregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      setDados(await fnRef.current());
      setErro(null);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      void recarregar();
      if (!pollingMs) return;
      const t = setInterval(() => void recarregar(true), pollingMs);
      return () => clearInterval(t);
    }, [recarregar, pollingMs]),
  );

  return { dados, erro, carregando, recarregar, setDados };
}

/** Segundos restantes até uma data (atualiza a cada segundo). */
export function useContagem(ate: string | null) {
  const calc = () => (ate ? Math.max(0, Math.floor((new Date(ate).getTime() - Date.now()) / 1000)) : 0);
  const [restante, setRestante] = useState(calc);
  useEffect(() => {
    setRestante(calc());
    if (!ate) return;
    const t = setInterval(() => setRestante(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ate]);
  return restante;
}
