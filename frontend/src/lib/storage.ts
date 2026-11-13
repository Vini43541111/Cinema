import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Token guardado no SecureStore (mobile) ou localStorage (web). */
export const armazenamento = {
  async ler(chave: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(chave) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(chave);
  },
  async gravar(chave: string, valor: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(chave, valor);
      } catch {
        /* ignora */
      }
      return;
    }
    await SecureStore.setItemAsync(chave, valor);
  },
  async remover(chave: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(chave);
      } catch {
        /* ignora */
      }
      return;
    }
    await SecureStore.deleteItemAsync(chave);
  },
};
