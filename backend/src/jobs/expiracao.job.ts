import { reservaService } from '../services/reserva.service';

/** A cada 30s executa a procedure sp_expirar_reservas (via service/repository). */
export function iniciarJobExpiracao(intervaloMs = 30_000) {
  const executar = async () => {
    try {
      const qtd = await reservaService.expirarVencidas();
      if (qtd > 0) console.log(`[job] ${qtd} reserva(s) expirada(s) e assentos liberados`);
    } catch (e) {
      console.error('[job] falha ao expirar reservas:', e);
    }
  };
  void executar();
  return setInterval(executar, intervaloMs);
}
