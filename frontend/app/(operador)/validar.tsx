import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, Campo, Tela, Texto, Titulo } from '@/components/ui';
import { api, ApiError, mensagemErro } from '@/lib/api';
import { dataHora, hora } from '@/lib/format';
import type { Ingresso } from '@/lib/types';
import { cores, espaco, fonte, raio } from '@/lib/theme';

type Resultado = { ok: true; ingresso: Ingresso } | { ok: false; mensagem: string };

export default function Validar() {
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const campo = useRef<TextInput>(null);

  async function validar() {
    const c = codigo.trim().toUpperCase();
    if (c.length < 4) return;
    setEnviando(true);
    try {
      const ingresso = await api.post<Ingresso>('/bilheteria/validar', { codigo: c });
      setResultado({ ok: true, ingresso });
    } catch (e) {
      let mensagem = mensagemErro(e);
      if (e instanceof ApiError && e.status === 409) {
        const quando = (e.detalhes as { utilizadoEm?: string } | undefined)?.utilizadoEm;
        mensagem = quando ? `Ingresso já utilizado às ${hora(quando)}.` : 'Ingresso já utilizado.';
      }
      setResultado({ ok: false, mensagem });
    } finally {
      setEnviando(false);
      setCodigo('');
      campo.current?.focus();
    }
  }

  return (
    <Tela>
      <Titulo>Entrada</Titulo>
      <Texto suave>Digite o código impresso no ingresso (ou leia o QR com um leitor) para liberar a entrada.</Texto>
      <Campo
        ref={campo}
        rotulo="Código do ingresso"
        placeholder="XXXX-XXXX-XXXX"
        value={codigo}
        onChangeText={(t) => setCodigo(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        onSubmitEditing={validar}
        returnKeyType="go"
      />
      <Botao titulo="Validar entrada" onPress={validar} carregando={enviando} desabilitado={codigo.trim().length < 4} />

      {resultado ? (
        <View style={[s.painel, { borderColor: resultado.ok ? cores.sucesso : cores.erro }]} accessibilityRole="alert">
          <Text style={[s.status, { color: resultado.ok ? cores.sucesso : cores.erro }]}>
            {resultado.ok ? 'Entrada liberada' : 'Entrada negada'}
          </Text>
          {resultado.ok ? (
            <>
              <Text style={s.filme}>{resultado.ingresso.sessao.filme}</Text>
              <Texto>{resultado.ingresso.sessao.sala}, {dataHora(resultado.ingresso.sessao.inicio)}</Texto>
              <Text style={s.assento}>Assento {resultado.ingresso.assento}</Text>
            </>
          ) : (
            <Texto>{resultado.mensagem}</Texto>
          )}
        </View>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  painel: { borderWidth: 2, borderRadius: raio.l, padding: espaco.l, gap: espaco.xs, backgroundColor: cores.superficie },
  status: { fontFamily: fonte.tituloForte, fontSize: 36, lineHeight: 40 },
  filme: { fontFamily: fonte.titulo, fontSize: 24, color: cores.texto },
  assento: { fontFamily: fonte.tituloForte, fontSize: 28, color: cores.latao, marginTop: espaco.s },
});
