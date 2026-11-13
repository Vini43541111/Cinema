import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IngressoCartao } from '@/components/IngressoCartao';
import { Aviso, Bloco, Botao, Carregando, confirmar, Opcoes, Tela, Texto, Titulo } from '@/components/ui';
import { api, mensagemErro } from '@/lib/api';
import { dataHora, metodoRotulo, moeda } from '@/lib/format';
import { useCarregar, useContagem } from '@/lib/hooks';
import type { MetodoPagamento, Reserva } from '@/lib/types';
import { cores, fonte } from '@/lib/theme';

export default function Pagamento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dados: reserva, erro, carregando, setDados } = useCarregar(() => api.get<Reserva>(`/reservas/${id}`), [id]);
  const restante = useContagem(reserva?.status === 'PENDENTE' ? reserva.expiraEm : null);
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  if (carregando && !reserva) return <Tela rolar={false}><Carregando /></Tela>;
  if (!reserva) return <Tela><Aviso>{erro ?? 'Reserva não encontrada.'}</Aviso></Tela>;

  const expirou = reserva.status === 'EXPIRADA' || (reserva.status === 'PENDENTE' && restante === 0);
  const assentos = reserva.assentos.map((a) => `${a.fila}${a.numero}`).join(', ');

  async function pagar() {
    if (!metodo) return setFalha('Escolha a forma de pagamento.');
    setEnviando(true);
    setFalha(null);
    try {
      setDados(await api.post<Reserva>(`/reservas/${id}/pagamento`, { metodo }));
    } catch (e) {
      setFalha(mensagemErro(e));
      try {
        setDados(await api.get<Reserva>(`/reservas/${id}`));
      } catch {
        /* mantém a tela */
      }
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (!(await confirmar('Cancelar reserva', 'Os assentos serão liberados para outras pessoas.'))) return;
    try {
      await api.post(`/reservas/${id}/cancelar`);
      router.replace('/cartaz');
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  }

  return (
    <Tela>
      <Titulo>{reserva.sessao.filme}</Titulo>
      <Texto suave>{reserva.sessao.sala}, {dataHora(reserva.sessao.inicio)}</Texto>

      {reserva.status === 'PAGA' ? (
        <>
          <Aviso tipo="sucesso">
            Pagamento confirmado ({metodoRotulo[reserva.pagamento?.metodo ?? 'PIX']}, {moeda(reserva.total)}). Apresente o código na entrada.
          </Aviso>
          {reserva.ingressos.map((i) => (
            <IngressoCartao
              key={i.codigo}
              codigo={i.codigo}
              filme={reserva.sessao.filme}
              sala={reserva.sessao.sala}
              inicio={reserva.sessao.inicio}
              assento={`${i.fila}${i.numero}`}
              utilizado={i.status === 'UTILIZADO'}
            />
          ))}
          <Botao titulo="Ver todos os meus ingressos" variante="secundario" onPress={() => router.replace('/ingressos')} />
        </>
      ) : expirou || reserva.status === 'CANCELADA' ? (
        <>
          <Aviso>
            {reserva.status === 'CANCELADA'
              ? 'Esta reserva foi cancelada.'
              : 'O tempo para pagamento acabou e os assentos foram liberados.'}
          </Aviso>
          <Botao titulo="Escolher assentos de novo" onPress={() => router.replace(`/sessao/${reserva.sessao.id}`)} />
        </>
      ) : (
        <>
          <Bloco>
            <View style={s.contagemLinha}>
              <Text style={s.contagemRotulo}>Seus lugares estão guardados por</Text>
              <Text style={[s.contagem, restante < 60 && { color: cores.erro }]}>
                {String(Math.floor(restante / 60)).padStart(2, '0')}:{String(restante % 60).padStart(2, '0')}
              </Text>
            </View>
            <Texto>Assentos {assentos}</Texto>
            <Texto>
              {reserva.assentos.length} × {moeda(reserva.sessao.preco)} = <Text style={s.total}>{moeda(reserva.total)}</Text>
            </Texto>
          </Bloco>

          <Opcoes
            rotulo="Forma de pagamento"
            valor={metodo}
            onChange={setMetodo}
            opcoes={(['PIX', 'CARTAO'] as const).map((m) => ({ valor: m, rotulo: metodoRotulo[m] }))}
          />
          <Texto suave estilo={{ fontSize: 13 }}>Pagamento simulado para fins acadêmicos: nenhum valor é cobrado.</Texto>

          {falha ? <Aviso>{falha}</Aviso> : null}
          <Botao titulo={`Pagar ${moeda(reserva.total)}`} onPress={pagar} carregando={enviando} desabilitado={!metodo} />
          <Botao titulo="Cancelar reserva" variante="fantasma" onPress={cancelar} />
        </>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  contagemLinha: { alignItems: 'center', paddingVertical: 4 },
  contagemRotulo: { color: cores.textoSuave, fontSize: 14 },
  contagem: { fontFamily: fonte.tituloForte, fontSize: 48, lineHeight: 52, color: cores.latao },
  total: { fontWeight: '800', color: cores.latao },
});
