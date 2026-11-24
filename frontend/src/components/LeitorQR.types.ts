export interface LeitorQRProps {
  /** Chamado a cada QR detectado (o texto lido). */
  onLer: (texto: string) => void;
  /** Enquanto true, a câmera continua aberta mas não dispara leituras. */
  pausado?: boolean;
}
