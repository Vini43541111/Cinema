import { ListaSessoes } from '@/components/ListaSessoes';
import { Tela, Texto, Titulo } from '@/components/ui';

export default function Venda() {
  return (
    <Tela>
      <Titulo>Venda no balcão</Titulo>
      <Texto suave>Escolha a sessão, marque os assentos no mapa e registre o pagamento.</Texto>
      <ListaSessoes />
    </Tela>
  );
}
