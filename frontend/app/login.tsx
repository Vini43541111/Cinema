import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aviso, Botao, Campo, Tela, Texto } from '@/components/ui';
import { mensagemErro } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cores, espaco, fonte } from '@/lib/theme';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!email.trim() || !senha) return setErro('Informe e-mail e senha.');
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
      router.replace('/');
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela estilo={s.tela}>
      <View style={s.marca}>
        <Text style={s.logo}>Cinema</Text>
        <Texto suave>Escolha a sessão, o seu lugar e pronto.</Texto>
      </View>
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" onSubmitEditing={enviar} />
      {erro ? <Aviso>{erro}</Aviso> : null}
      <Botao titulo="Entrar" onPress={enviar} carregando={enviando} />
      <Link href="/registrar" style={s.link}>Não tem conta? Criar conta</Link>
    </Tela>
  );
}

const s = StyleSheet.create({
  tela: { justifyContent: 'center', maxWidth: 420 },
  marca: { marginBottom: espaco.xl, gap: espaco.xs },
  logo: { fontFamily: fonte.tituloForte, fontSize: 56, lineHeight: 58, color: cores.latao },
  link: { color: cores.latao, textAlign: 'center', padding: espaco.m, fontSize: 15 },
});
