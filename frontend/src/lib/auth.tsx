import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { aoSessaoExpirar, api, definirToken } from './api';
import { armazenamento } from './storage';
import type { Usuario } from './types';

const CHAVE = 'cinema.token';

interface AuthCtx {
  usuario: Usuario | null;
  carregando: boolean;
  entrar(email: string, senha: string): Promise<void>;
  registrar(nome: string, email: string, senha: string): Promise<void>;
  sair(): Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const sair = useCallback(async () => {
    definirToken(null);
    setUsuario(null);
    await armazenamento.remover(CHAVE);
  }, []);

  useEffect(() => {
    aoSessaoExpirar(() => void sair());
    (async () => {
      const salvo = await armazenamento.ler(CHAVE);
      if (salvo) {
        definirToken(salvo);
        try {
          setUsuario(await api.get<Usuario>('/auth/me'));
        } catch {
          await sair();
        }
      }
      setCarregando(false);
    })();
  }, [sair]);

  const aplicar = async (r: { token: string; usuario: Usuario }) => {
    definirToken(r.token);
    await armazenamento.gravar(CHAVE, r.token);
    setUsuario(r.usuario);
  };

  const valor = useMemo<AuthCtx>(
    () => ({
      usuario,
      carregando,
      sair,
      entrar: async (email, senha) => aplicar(await api.post('/auth/login', { email, senha })),
      registrar: async (nome, email, senha) => aplicar(await api.post('/auth/registrar', { nome, email, senha })),
    }),
    [usuario, carregando, sair],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
