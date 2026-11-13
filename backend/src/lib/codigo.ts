import { randomInt } from 'node:crypto';

// Sem caracteres ambíguos (0/O, 1/I/L) para facilitar a digitação no balcão
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Gera um código de ingresso no formato XXXX-XXXX-XXXX (criptograficamente aleatório). */
export function gerarCodigoIngresso(): string {
  const bloco = () => Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
  return `${bloco()}-${bloco()}-${bloco()}`;
}
