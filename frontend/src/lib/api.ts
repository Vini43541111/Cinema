import { Platform } from 'react-native';

/**
 * Endereço da API:
 *  - EXPO_PUBLIC_API_URL, se definido (ex.: rodando no celular via Expo);
 *  - na web em produção, "/api" no mesmo domínio onde o app é servido (Nginx).
 */
const BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ??
  (Platform.OS === 'web' ? '/api' : 'http://localhost:3333/api');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detalhes?: unknown,
  ) {
    super(message);
  }
}

let token: string | null = null;
let aoExpirar: (() => void) | null = null;

export const definirToken = (t: string | null) => {
  token = t;
};
export const aoSessaoExpirar = (fn: () => void) => {
  aoExpirar = fn;
};

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.');
  }

  if (resp.status === 204) return undefined as T;
  const dados = await resp.json().catch(() => null);

  if (!resp.ok) {
    if (resp.status === 401 && token) aoExpirar?.();
    throw new ApiError(resp.status, dados?.erro ?? `Erro ${resp.status}`, dados?.detalhes);
  }
  return dados as T;
}

export const api = {
  get: <T>(c: string) => requisicao<T>('GET', c),
  post: <T>(c: string, corpo?: unknown) => requisicao<T>('POST', c, corpo ?? {}),
  put: <T>(c: string, corpo: unknown) => requisicao<T>('PUT', c, corpo),
  patch: <T>(c: string, corpo: unknown) => requisicao<T>('PATCH', c, corpo),
  del: <T = void>(c: string) => requisicao<T>('DELETE', c),
};

export const mensagemErro = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.');
