const TZ = 'America/Sao_Paulo';

export const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

export const diaCurto = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: TZ });

export const dataHora = (iso: string) => `${diaCurto(iso)} às ${hora(iso)}`;

/** AAAA-MM-DD no fuso de Brasília. */
export const isoDia = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: TZ });

export const proximosDias = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() + i * 86_400_000);
    return {
      iso: isoDia(d),
      rotulo: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: TZ }),
      dia: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TZ }),
    };
  });

export const metodoRotulo: Record<string, string> = { PIX: 'Pix', CARTAO: 'Cartão', DINHEIRO: 'Dinheiro' };

/** Converte "DD/MM/AAAA" + "HH:MM" (horário de Brasília) para ISO. */
export function paraISO(data: string, horario: string): string | null {
  const d = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const h = horario.match(/^(\d{2}):(\d{2})$/);
  if (!d || !h) return null;
  const iso = `${d[3]}-${d[2]}-${d[1]}T${h[1]}:${h[2]}:00-03:00`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

export const mascaraData = (t: string) => {
  const n = t.replace(/\D/g, '').slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/');
};

export const mascaraHora = (t: string) => {
  const n = t.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}:${n.slice(2)}` : n;
};
