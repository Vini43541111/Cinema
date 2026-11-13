import { router } from 'expo-router';
import { useState } from 'react';
import { Aviso, Botao, Campo, Tela, Texto } from '@/components/ui';
import { mensagemErro } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Registrar() {
  const { registrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (nome.trim().length < 3) return setErro('Informe seu nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Informe um e-mail válido.');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmacao) return setErro('As senhas não conferem.');
    setEnviando(true);
    setErro(null);
    try {
      await registrar(nome, email, senha);
      router.replace('/');
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela estilo={{ maxWidth: 420 }}>
      <Texto suave>Com a conta você reserva assentos e guarda seus ingressos.</Texto>
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name" />
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" />
      <Campo rotulo="Confirme a senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry onSubmitEditing={enviar} />
      {erro ? <Aviso>{erro}</Aviso> : null}
      <Botao titulo="Criar conta" onPress={enviar} carregando={enviando} />
    </Tela>
  );
}
