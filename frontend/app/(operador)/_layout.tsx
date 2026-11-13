import { Abas } from '@/components/Abas';

export default function LayoutOperador() {
  return (
    <Abas
      papel="OPERADOR"
      abas={[
        { nome: 'venda', titulo: 'Venda', icone: 'cash-outline' },
        { nome: 'validar', titulo: 'Entrada', icone: 'qr-code-outline' },
        { nome: 'cadastros', titulo: 'Cadastros', icone: 'albums-outline' },
        { nome: 'relatorios', titulo: 'Relatórios', icone: 'bar-chart-outline' },
        { nome: 'perfil', titulo: 'Conta', icone: 'person-outline' },
      ]}
    />
  );
}
