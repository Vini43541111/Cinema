import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, useFonts } from '@expo-google-fonts/barlow-condensed';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { cores, fonte } from '@/lib/theme';

export default function RootLayout() {
  const [fontesOk] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });
  if (!fontesOk) return <View style={{ flex: 1, backgroundColor: cores.fundo }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: cores.fundo },
            headerTintColor: cores.texto,
            headerTitleStyle: { fontFamily: fonte.titulo, fontSize: 22 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: cores.fundo },
            title: 'Cinema',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="registrar" options={{ title: 'Criar conta' }} />
          <Stack.Screen name="(cliente)" options={{ headerShown: false }} />
          <Stack.Screen name="(operador)" options={{ headerShown: false }} />
          <Stack.Screen name="sessao/[id]" options={{ title: 'Escolha seus assentos' }} />
          <Stack.Screen name="reserva/[id]" options={{ title: 'Pagamento' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
