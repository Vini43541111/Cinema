import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Carregando, Tela } from './ui';
import { useAuth } from '@/lib/auth';
import type { Papel } from '@/lib/types';
import { cores } from '@/lib/theme';

type Icone = ComponentProps<typeof Ionicons>['name'];

/** Layout de abas protegido por papel (cliente x operador). */
export function Abas({ papel, abas }: { papel: Papel; abas: { nome: string; titulo: string; icone: Icone }[] }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Tela rolar={false}><Carregando /></Tela>;
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.papel !== papel) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
        tabBarActiveTintColor: cores.latao,
        tabBarInactiveTintColor: cores.textoSuave,
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      {abas.map((a) => (
        <Tabs.Screen
          key={a.nome}
          name={a.nome}
          options={{ title: a.titulo, tabBarIcon: ({ color, size }) => <Ionicons name={a.icone} color={color} size={size} /> }}
        />
      ))}
    </Tabs>
  );
}
