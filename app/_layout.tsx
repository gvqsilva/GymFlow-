// app/_layout.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { SportsProvider } from '../context/SportsProvider';
import { authService } from '../services/authService';

const themeColor = '#5a4fcf';

// 🔔 Configuração global das notificações (SDK 51+)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // substitui shouldShowAlert
    shouldShowList: true,   // mostra na central de notificações
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  // Inicializar Firebase Auth na inicialização do app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // PRIMEIRO: Inicializar Firebase Auth e verificar se há usuário logado
        const user = await authService.initialize();
        console.log('🔥 Firebase Auth inicializado');
        
        // Se há usuário autenticado e verificado, ir direto para home
        if (user && authService.shouldSyncWithFirebase()) {
          console.log('✅ Usuário já autenticado:', user.email);
          console.log('🏠 Redirecionando para home');
          router.replace('/(tabs)');
          return;
        }
        
        console.log('❌ Usuário não autenticado ou email não verificado');
        
        // SEGUNDO: Se não está autenticado, verificar se é primeira abertura
        const hasSeenWelcome = await AsyncStorage.getItem('has_seen_welcome');
        
        if (!hasSeenWelcome) {
          // Primeira vez abrindo o app - mostrar welcome
          console.log('📱 Primeira abertura do app - redirecionando para welcome');
          router.replace('/welcome');
        } else {
          // Já viu welcome mas não está logado - ir para login
          console.log('🔑 Usuário precisa fazer login');
          router.replace('/login');
        }
        
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        // Em caso de erro, mostrar welcome por segurança
        router.replace('/welcome');
      }
    };

    // Pequeno delay para garantir que o router está pronto
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SportsProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeColor },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* ✅ Telas de autenticação */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        
        {/* ✅ Tela de informações sobre nuvem */}
        <Stack.Screen name="cloud-info" options={{ title: 'Backup na Nuvem' }} />
        
        {/* ✅ Tela de configuração da home */}
        <Stack.Screen name="configurar-home" options={{ title: 'Configurar Home' }} />
        
        <Stack.Screen name="fichas/[id]" options={{ title: 'Detalhes do Treino' }} />
        <Stack.Screen name="fichas/exercicio" options={{ title: 'Exercício' }} />
        <Stack.Screen name="musculacao" options={{ title: 'Fichas de Treino' }} />
        <Stack.Screen name="logEsporte" options={{ title: 'Registar Atividade' }} />
        <Stack.Screen name="gerir-fichas" options={{ title: 'Gerir Fichas' }} />
        <Stack.Screen name="gerir-esportes" options={{ title: 'Gerir Esportes' }} />
        <Stack.Screen name="editar-ficha/[id]" options={{ title: 'Editar Ficha' }} />
        <Stack.Screen name="exercicio-modal" options={{ presentation: 'modal', title: 'Exercício' }} />
        <Stack.Screen name="ficha-modal" options={{ presentation: 'modal', title: 'Nova Ficha' }} />
        <Stack.Screen name="perfil-modal" options={{ presentation: 'modal', title: 'Meu Perfil' }} />
        <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />

        {/* ✅ Ecrãs de suplementos */}
        <Stack.Screen name="gerir-suplementos" options={{ title: 'Gerir Suplementos' }} />
        <Stack.Screen name="suplemento-modal" options={{ presentation: 'modal', title: 'Suplemento' }} />
      </Stack>

      <Toast />
    </SportsProvider>
  );
}