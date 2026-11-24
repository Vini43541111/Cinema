import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LeitorQR } from '@/components/LeitorQR';
import { Botao, Campo, Tela, Texto, Titulo } from '@/components/ui';
import { api, ApiError, mensagemErro } from '@/lib/api';
import { feedback } from '@/lib/feedback';
import { dataHora, hora } from '@/lib/format';
import type { Ingresso } from '@/lib/types';
import { cores, espaco, fonte, raio } from '@/lib/theme';

type Resultado = { ok: true; ingresso: Ingresso } | { ok: false; mensagem: string; codigo: string };

/** Tempo mostrando o resultado antes de voltar a ler. */
const PAUSA_APOS_LEITURA_MS = 2000;
/**
 * A câmera "vê" o mesmo QR várias vezes por segundo. Enquanto o mesmo código continuar
 * aparecendo (janela deslizante), ele é ignorado; só volta a ser validado se sumir por esse tempo.
 */
const IGNORAR_REPETIDO_MS = 20000;

/** Extrai o código XXXX-XXXX-XXXX do texto lido (aceita QR com texto extra). */
function extrairCodigo(texto: string) {
  const t = texto.trim().toUpperCase();
  return t.match(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/)?.[0] ?? t;
}

export default function Validar() {
  const [camera, setCamera] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const campo = useRef<TextInput>(null);
  const ultimo = useRef<{ codigo: string; quando: number } | null>(null);
  const ocupado = useRef(false);

  const validar = useCallback(async (bruto: string, origem: 'camera' | 'teclado') => {
    const c = extrairCodigo(bruto);
    if (c.length < 4 || ocupado.current) return;
    if (origem === 'camera') {
      const u = ultimo.current;
      if (u && u.codigo === c && Date.now() - u.quando < IGNORAR_REPETIDO_MS) {
        u.quando = Date.now(); // ainda na frente da câmera: renova a janela
        return;
      }
      ultimo.current = { codigo: c, quando: Date.now() };
    }
    ocupado.current = true;
    setPausado(true);
    setEnviando(true);
    try {
      const ingresso = await api.post<Ingresso>('/bilheteria/validar', { codigo: c });
      setResultado({ ok: true, ingresso });
      feedback.sucesso();
    } catch (e) {
      let mensagem = mensagemErro(e);
      if (e instanceof ApiError && e.status === 409) {
        const quando = (e.detalhes as { utilizadoEm?: string } | undefined)?.utilizadoEm;
        mensagem = quando ? `Ingresso já utilizado às ${hora(quando)}.` : 'Ingresso já utilizado.';
      } else if (e instanceof ApiError && e.status === 404) {
        mensagem = 'Ingresso não encontrado. Confira o código.';
      }
      setResultado({ ok: false, mensagem, codigo: c });
      feedback.falha();
    } finally {
      setEnviando(false);
      setCodigo('');
      setTimeout(() => {
        ocupado.current = false;
        setPausado(false);
        if (origem === 'teclado') campo.current?.focus();
      }, origem === 'camera' ? PAUSA_APOS_LEITURA_MS : 0);
    }
  }, []);

  return (
    <Tela>
      <Titulo>Entrada</Titulo>
      <Texto suave>Aponte a câmera para o QR code do ingresso. A entrada é validada automaticamente.</Texto>

      {camera ? (
        <>
          <LeitorQR onLer={(t) => void validar(t, 'camera')} pausado={pausado} />
          <Botao titulo="Fechar câmera" variante="secundario" onPress={() => setCamera(false)} />
        </>
      ) : (
        <Botao
          titulo="Ler QR code com a câmera"
          onPress={() => {
            feedback.preparar();
            setResultado(null);
            setCamera(true);
          }}
        />
      )}

      {resultado ? (
        <View style={[s.painel, { borderColor: resultado.ok ? cores.sucesso : cores.erro, backgroundColor: resultado.ok ? '#16302a' : '#3a1d22' }]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text style={[s.status, { color: resultado.ok ? cores.sucesso : cores.erro }]}>
            {resultado.ok ? 'Entrada liberada' : 'Entrada negada'}
          </Text>
          {resultado.ok ? (
            <>
              <Text style={s.assento}>Assento {resultado.ingresso.assento}</Text>
              <Text style={s.filme}>{resultado.ingresso.sessao.filme}</Text>
              <Texto>{resultado.ingresso.sessao.sala}, {dataHora(resultado.ingresso.sessao.inicio)}</Texto>
            </>
          ) : (
            <>
              <Texto>{resultado.mensagem}</Texto>
              <Texto suave estilo={{ fontSize: 13 }}>Código lido: {resultado.codigo}</Texto>
            </>
          )}
        </View>
      ) : null}

      <View style={s.separador}>
        <Texto suave estilo={{ fontSize: 13 }}>Sem câmera? Digite o código ou use um leitor de QR no campo abaixo.</Texto>
      </View>
      <Campo
        ref={campo}
        rotulo="Código do ingresso"
        placeholder="XXXX-XXXX-XXXX"
        value={codigo}
        onChangeText={(t) => setCodigo(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        onSubmitEditing={() => void validar(codigo, 'teclado')}
        returnKeyType="go"
      />
      <Botao titulo="Validar código" variante="secundario" onPress={() => void validar(codigo, 'teclado')} carregando={enviando && !camera} desabilitado={codigo.trim().length < 4} />
    </Tela>
  );
}

const s = StyleSheet.create({
  painel: { borderWidth: 2, borderRadius: raio.l, padding: espaco.l, gap: espaco.xs },
  status: { fontFamily: fonte.tituloForte, fontSize: 40, lineHeight: 44 },
  assento: { fontFamily: fonte.tituloForte, fontSize: 34, lineHeight: 38, color: cores.latao },
  filme: { fontFamily: fonte.titulo, fontSize: 22, color: cores.texto },
  separador: { marginTop: espaco.m },
});
