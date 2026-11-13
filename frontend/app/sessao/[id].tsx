import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Capa } from '@/components/Capa';
import { MapaAssentos } from '@/components/MapaAssentos';
import { IngressoCartao } from '@/components/IngressoCartao';
import { Aviso, Bloco, Botao, Carregando, Opcoes, Tela, Texto, Titulo } from '@/components/ui';
import { api, ApiError, mensagemErro } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dataHora, metodoRotulo, moeda } from '@/lib/format';
import { useCarregar } from '@/lib/hooks';
import type { Mapa, MetodoPagamento, Reserva } from '@/lib/types';
import { cores, espaco, fonte } from '@/lib/theme';

const MAX = 10;

export default function SessaoAssentos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();
  const balcao = usuario?.papel === 'OPERADOR';

  // Atualiza o mapa a cada 5s: assentos ocupados por outras pessoas aparecem em tempo real
  const { dados: mapa, erro, carregando, recarregar } = useCarregar(() => api.get<Mapa>(`/sessoes/${id}/mapa`), [id], 5000);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [metodo, setMetodo] = useState<MetodoPagamento>('DINHEIRO');
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [vendida, setVendida] = useState<Reserva | null>(null);

  if (carregando && !mapa) return <Tela rolar={false}><Carregando /></Tela>;
  if (!mapa) return <Tela><Aviso>{erro ?? 'Sessão não encontrada.'}</Aviso></Tela>;

  // Se alguém ocupou um assento que estava selecionado, ele sai da seleção
  const livres = new Set(mapa.filas.flatMap((f) => f.assentos.filter((a) => a.status === 'LIVRE').map((a) => a.assentoId)));
  const selecao = selecionados.filter((a) => livres.has(a));
  const nomes = mapa.filas.flatMap((f) => f.assentos.filter((a) => selecao.includes(a.assentoId)).map((a) => `${f.fila}${a.numero}`));
  const total = selecao.length * mapa.sessao.preco;

  function alternar(assentoId: number) {
    setFalha(null);
    setSelecionados((atual) => {
      const base = atual.filter((a) => livres.has(a));
      if (base.includes(assentoId)) return base.filter((a) => a !== assentoId);
      if (base.length >= MAX) {
        setFalha(`Você pode escolher até ${MAX} assentos por compra.`);
        return base;
      }
      return [...base, assentoId];
    });
  }

  async function confirmar() {
    setEnviando(true);
    setFalha(null);
    try {
      if (balcao) {
        const r = await api.post<Reserva>('/bilheteria/vendas', { sessaoId: Number(id), assentoIds: selecao, metodo });
        setVendida(r);
        setSelecionados([]);
        void recarregar(true);
      } else {
        const r = await api.post<Reserva>('/reservas', { sessaoId: Number(id), assentoIds: selecao });
        router.replace(`/reserva/${r.id}`);
      }
    } catch (e) {
      setFalha(
        e instanceof ApiError && e.status === 409
          ? 'Alguém acabou de garantir um desses lugares. O mapa foi atualizado; escolha outros assentos.'
          : mensagemErro(e),
      );
      setSelecionados([]);
      void recarregar(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <View style={s.cabecalho}>
        <Capa url={mapa.sessao.filme.imagemUrl} titulo={mapa.sessao.filme.titulo} largura={64} />
        <View style={{ flex: 1 }}>
        <Titulo>{mapa.sessao.filme.titulo}</Titulo>
        <Texto suave>
          {mapa.sessao.sala.nome}, {dataHora(mapa.sessao.inicio)}
        </Texto>
        <Texto suave>
          {mapa.resumo.livres} de {mapa.resumo.capacidade} lugares livres, {moeda(mapa.sessao.preco)} cada
        </Texto>
        </View>
      </View>

      {vendida ? (
        <Bloco estilo={{ borderWidth: 1, borderColor: cores.sucesso }}>
          <Texto estilo={{ fontWeight: '700', color: cores.sucesso }}>
            Venda concluída: {moeda(vendida.total)} em {metodoRotulo[vendida.pagamento?.metodo ?? 'DINHEIRO']}
          </Texto>
          {vendida.ingressos.map((i) => (
            <IngressoCartao
              key={i.codigo}
              codigo={i.codigo}
              filme={vendida.sessao.filme}
              sala={vendida.sessao.sala}
              inicio={vendida.sessao.inicio}
              assento={`${i.fila}${i.numero}`}
            />
          ))}
          <Botao titulo="Nova venda nesta sessão" variante="secundario" onPress={() => setVendida(null)} />
        </Bloco>
      ) : null}

      <MapaAssentos mapa={mapa} selecionados={selecao} onAlternar={alternar} />

      {falha ? <Aviso>{falha}</Aviso> : null}

      <View style={s.rodape}>
        <View style={{ flex: 1 }}>
          <Text style={s.resumoRotulo}>{selecao.length ? `Assentos ${nomes.join(', ')}` : 'Toque nos assentos livres'}</Text>
          <Text style={s.total}>{moeda(total)}</Text>
        </View>
      </View>

      {balcao ? (
        <Opcoes
          rotulo="Forma de pagamento"
          valor={metodo}
          onChange={setMetodo}
          opcoes={(['DINHEIRO', 'CARTAO', 'PIX'] as const).map((m) => ({ valor: m, rotulo: metodoRotulo[m] }))}
        />
      ) : null}

      <Botao
        titulo={balcao ? 'Registrar venda' : 'Reservar e pagar'}
        onPress={confirmar}
        carregando={enviando}
        desabilitado={selecao.length === 0}
      />
      {!balcao ? (
        <Texto suave estilo={{ textAlign: 'center', fontSize: 13 }}>
          Os assentos ficam guardados para você por alguns minutos enquanto conclui o pagamento.
        </Texto>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  cabecalho: { flexDirection: 'row', gap: espaco.m, alignItems: 'center' },
  rodape: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco.m },
  resumoRotulo: { color: cores.textoSuave, fontSize: 14 },
  total: { fontFamily: fonte.tituloForte, fontSize: 30, color: cores.texto },
});
