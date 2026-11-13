import { Redirect } from 'expo-router';
import { Carregando, Tela } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function Inicio() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Tela rolar={false}><Carregando /></Tela>;
  if (!usuario) return <Redirect href="/login" />;
  return <Redirect href={usuario.papel === 'OPERADOR' ? '/venda' : '/cartaz'} />;
}
