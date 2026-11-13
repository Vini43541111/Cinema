import { Abas } from '@/components/Abas';

export default function LayoutCliente() {
  return (
    <Abas
      papel="CLIENTE"
      abas={[
        { nome: 'cartaz', titulo: 'Em cartaz', icone: 'film-outline' },
        { nome: 'ingressos', titulo: 'Ingressos', icone: 'ticket-outline' },
        { nome: 'conta', titulo: 'Conta', icone: 'person-outline' },
      ]}
    />
  );
}
