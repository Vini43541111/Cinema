import { router } from 'expo-router';
import { useMemo } from 'react';
import { IngressoCartao } from '@/components/IngressoCartao';
import { Aviso, Bloco, Carregando, Subtitulo, Tela, Texto, Titulo, Vazio } from '@/components/ui';
import { api } from '@/lib/api';
import { dataHora, moeda } from '@/lib/format';
import { useCarregar } from '@/lib/hooks';
import type { Ingresso, Reserva } from '@/lib/types';

export default function Ingressos() {
  const ingressos = useCarregar(() => api.get<Ingresso[]>('/ingressos'));
  const reservas = useCarregar(() => api.get<Reserva[]>('/reservas'));

  const pendentes = (reservas.dados ?? []).filter(
    (r) => r.status === 'PENDENTE' && r.expiraEm && new Date(r.expiraEm).getTime() > Date.now(),
  );
  const { proximos, passados } = useMemo(() => {
    const agora = Date.now();
    const lista = ingressos.dados ?? [];
    return {
      proximos: lista.filter((i) => new Date(i.sessao.fim).getTime() > agora).reverse(),
      passados: lista.filter((i) => new Date(i.sessao.fim).getTime() <= agora),
    };
  }, [ingressos.dados]);

  return (
    <Tela>
      <Titulo>Meus ingressos</Titulo>
      {ingressos.erro ? <Aviso>{ingressos.erro}</Aviso> : null}

      {pendentes.map((r) => (
        <Bloco key={r.id} onPress={() => router.push(`/reserva/${r.id}`)} estilo={{ borderWidth: 1, borderColor: '#E3B04B' }}>
          <Texto estilo={{ fontWeight: '700' }}>Pagamento pendente: {r.sessao.filme}</Texto>
          <Texto suave>{dataHora(r.sessao.inicio)}</Texto>
          <Texto suave>
            Assentos {r.assentos.map((a) => `${a.fila}${a.numero}`).join(', ')}, total {moeda(r.total)}
          </Texto>
          <Texto estilo={{ color: '#E3B04B' }}>Toque para concluir o pagamento</Texto>
        </Bloco>
      ))}

      {ingressos.carregando && !ingressos.dados ? (
        <Carregando />
      ) : proximos.length === 0 && passados.length === 0 ? (
        <Vazio>Você ainda não tem ingressos. Escolha uma sessão em Em cartaz.</Vazio>
      ) : null}

      {proximos.map((i) => (
        <IngressoCartao key={i.codigo} codigo={i.codigo} filme={i.sessao.filme} sala={i.sessao.sala} inicio={i.sessao.inicio} assento={i.assento} utilizado={i.status === 'UTILIZADO'} />
      ))}

      {passados.length > 0 ? <Subtitulo>Sessões anteriores</Subtitulo> : null}
      {passados.map((i) => (
        <IngressoCartao key={i.codigo} codigo={i.codigo} filme={i.sessao.filme} sala={i.sessao.sala} inicio={i.sessao.inicio} assento={i.assento} utilizado={i.status === 'UTILIZADO'} />
      ))}
    </Tela>
  );
}
