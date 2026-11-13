import { ListaSessoes } from '@/components/ListaSessoes';
import { Tela, Titulo } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Texto } from '@/components/ui';

export default function Cartaz() {
  const { usuario } = useAuth();
  return (
    <Tela>
      <Titulo>Em cartaz</Titulo>
      <Texto suave>Olá, {usuario?.nome.split(' ')[0]}. Escolha um horário para ver os lugares.</Texto>
      <ListaSessoes />
    </Tela>
  );
}
