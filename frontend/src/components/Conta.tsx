import { router } from 'expo-router';
import { Bloco, Botao, Tela, Texto, Titulo } from './ui';
import { useAuth } from '@/lib/auth';

export function Conta() {
  const { usuario, sair } = useAuth();
  return (
    <Tela>
      <Titulo>Minha conta</Titulo>
      <Bloco>
        <Texto estilo={{ fontSize: 18, fontWeight: '700' }}>{usuario?.nome}</Texto>
        <Texto suave>{usuario?.email}</Texto>
        <Texto suave>{usuario?.papel === 'OPERADOR' ? 'Operador (bilheteria e gerência)' : 'Cliente'}</Texto>
      </Bloco>
      <Botao
        titulo="Sair"
        variante="perigo"
        onPress={async () => {
          await sair();
          router.replace('/login');
        }}
      />
    </Tela>
  );
}
