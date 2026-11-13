import { ReactNode, Ref } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, espaco, fonte, raio } from '@/lib/theme';

export function Tela({
  children,
  rolar = true,
  estilo,
  rolagemRef,
}: {
  children: ReactNode;
  rolar?: boolean;
  estilo?: StyleProp<ViewStyle>;
  rolagemRef?: Ref<ScrollView>;
}) {
  const conteudo = <View style={[s.conteudo, estilo]}>{children}</View>;
  return (
    <SafeAreaView style={s.tela} edges={['top', 'left', 'right']}>
      {rolar ? (
        <ScrollView ref={rolagemRef} contentContainerStyle={s.rolagem} keyboardShouldPersistTaps="handled">
          {conteudo}
        </ScrollView>
      ) : (
        conteudo
      )}
    </SafeAreaView>
  );
}

export function Titulo({ children, estilo }: { children: ReactNode; estilo?: StyleProp<TextStyle> }) {
  return <Text style={[s.titulo, estilo]} accessibilityRole="header">{children}</Text>;
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <Text style={s.subtitulo} accessibilityRole="header">{children}</Text>;
}

export function Texto({ children, suave, estilo }: { children: ReactNode; suave?: boolean; estilo?: StyleProp<TextStyle> }) {
  return <Text style={[s.texto, suave && s.suave, estilo]}>{children}</Text>;
}

type VarianteBotao = 'principal' | 'secundario' | 'perigo' | 'fantasma';

export function Botao({
  titulo,
  onPress,
  variante = 'principal',
  carregando,
  desabilitado,
  estilo,
}: {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const off = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!carregando }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [s.botao, s[`b_${variante}`], off && s.botaoOff, pressed && !off && s.pressionado, estilo]}
    >
      {carregando ? (
        <ActivityIndicator color={variante === 'principal' ? cores.fundo : cores.texto} />
      ) : (
        <Text style={[s.botaoTexto, variante === 'principal' && { color: cores.fundo }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({ rotulo, erro, ref, style, ...props }: TextInputProps & { rotulo: string; erro?: string; ref?: Ref<TextInput> }) {
  return (
    <View style={s.campo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={cores.textoSuave}
        style={[s.input, erro && { borderColor: cores.erro }, style]}
        accessibilityLabel={rotulo}
        {...props}
      />
      {erro ? <Text style={s.erroCampo}>{erro}</Text> : null}
    </View>
  );
}

/** Grupo de opções (substitui selects: o usuário escolhe pelo nome, nunca digita IDs). */
export function Opcoes<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  onChange,
}: {
  rotulo?: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.campo}>
      {rotulo ? <Text style={s.rotulo}>{rotulo}</Text> : null}
      <View style={s.opcoes}>
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              onPress={() => onChange(o.valor)}
              style={[s.opcao, ativo && s.opcaoAtiva]}
            >
              <Text style={[s.opcaoTexto, ativo && { color: cores.fundo }]}>{o.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Aviso({ tipo = 'erro', children }: { tipo?: 'erro' | 'sucesso' | 'info'; children: ReactNode }) {
  const cor = tipo === 'erro' ? cores.erro : tipo === 'sucesso' ? cores.sucesso : cores.latao;
  return (
    <View style={[s.aviso, { borderLeftColor: cor }]} accessibilityRole="alert">
      <Text style={s.texto}>{children}</Text>
    </View>
  );
}

export function Carregando() {
  return (
    <View style={s.centro}>
      <ActivityIndicator color={cores.latao} size="large" />
    </View>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <View style={s.vazio}>
      <Texto suave estilo={{ textAlign: 'center' }}>{children}</Texto>
    </View>
  );
}

export function Linha({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[s.linha, estilo]}>{children}</View>;
}

export function Bloco({ children, estilo, onPress }: { children: ReactNode; estilo?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.bloco, pressed && s.pressionado, estilo]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.bloco, estilo]}>{children}</View>;
}

/** Confirmação que funciona na web (window.confirm) e no celular (Alert). */
export function confirmar(titulo: string, mensagem: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${titulo}\n\n${mensagem}`) ?? true);
  return new Promise((ok) =>
    Alert.alert(titulo, mensagem, [
      { text: 'Voltar', style: 'cancel', onPress: () => ok(false) },
      { text: 'Confirmar', style: 'destructive', onPress: () => ok(true) },
    ]),
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rolagem: { flexGrow: 1 },
  conteudo: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: espaco.l, gap: espaco.m },
  titulo: { fontFamily: fonte.tituloForte, fontSize: 34, lineHeight: 38, color: cores.texto, letterSpacing: 0.3 },
  subtitulo: { fontFamily: fonte.titulo, fontSize: 22, lineHeight: 26, color: cores.texto, marginTop: espaco.s },
  texto: { color: cores.texto, fontSize: 15, lineHeight: 21 },
  suave: { color: cores.textoSuave },
  botao: { minHeight: 48, borderRadius: raio.m, paddingHorizontal: espaco.l, alignItems: 'center', justifyContent: 'center' },
  b_principal: { backgroundColor: cores.latao },
  b_secundario: { backgroundColor: cores.superficieAlta, borderWidth: 1, borderColor: cores.borda },
  b_perigo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: cores.erro },
  b_fantasma: { backgroundColor: 'transparent' },
  botaoOff: { opacity: 0.45 },
  pressionado: { opacity: 0.8 },
  botaoTexto: { color: cores.texto, fontSize: 16, fontWeight: '700' },
  campo: { gap: 6 },
  rotulo: { color: cores.textoSuave, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.m,
    paddingHorizontal: espaco.m,
    paddingVertical: 12,
    color: cores.texto,
    fontSize: 16,
  },
  erroCampo: { color: cores.erro, fontSize: 13 },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  opcao: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  opcaoAtiva: { backgroundColor: cores.latao, borderColor: cores.latao },
  opcaoTexto: { color: cores.texto, fontSize: 14, fontWeight: '600' },
  aviso: { backgroundColor: cores.superficie, borderLeftWidth: 4, borderRadius: raio.s, padding: espaco.m },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xxl },
  vazio: { padding: espaco.xl, alignItems: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  bloco: { backgroundColor: cores.superficie, borderRadius: raio.l, padding: espaco.l, gap: espaco.s },
});
