// app/_layout.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { SportsProvider } from "../context/SportsProvider";
import { authService } from "../services/authService";

const themeColor = "#5a4fcf";
const SUPPLEMENTS_STORAGE_KEY = "user_supplements_list";
const SUPPLEMENTS_HISTORY_STORAGE_KEY = "supplementsHistory";
const LEGACY_SUPPLEMENTS_HISTORY_KEY = "supplements_history";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function shouldSuppressSupplementNotification(
  supplementId: string,
): Promise<boolean> {
  try {
    const today = getLocalDateString();

    const supplementsJSON = await AsyncStorage.getItem(SUPPLEMENTS_STORAGE_KEY);
    const supplements = supplementsJSON ? JSON.parse(supplementsJSON) : [];
    const supplement = Array.isArray(supplements)
      ? supplements.find((item: any) => item?.id === supplementId)
      : null;

    if (supplement?.trackingType === "counter") {
      return false;
    }

    const historyJSON = await AsyncStorage.getItem(
      SUPPLEMENTS_HISTORY_STORAGE_KEY,
    );
    const history = historyJSON ? JSON.parse(historyJSON) : {};
    const key = `${supplementId}_${today}`;
    const entry = history?.[key];

    if (entry?.taken === true || Number(entry?.timesTaken || 0) > 0) {
      return true;
    }

    const legacyJSON = await AsyncStorage.getItem(LEGACY_SUPPLEMENTS_HISTORY_KEY);
    const legacyHistory = legacyJSON ? JSON.parse(legacyJSON) : {};
    const legacyValue = legacyHistory?.[today]?.[supplementId];

    if (legacyValue === true || Number(legacyValue || 0) > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.warn("Falha ao validar status do suplemento para notificação:", error);
    return false;
  }
}

// Configuração customizada do Toast
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#00C851" }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 14,
        color: "#666",
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#ff4444" }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 14,
        color: "#666",
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: themeColor }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 14,
        color: "#666",
      }}
    />
  ),
};

// 🔔 Configuração global das notificações (SDK 51+)
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const supplementId =
      typeof notification.request.content.data?.supplementId === "string"
        ? notification.request.content.data.supplementId
        : null;

    if (supplementId) {
      const suppress = await shouldSuppressSupplementNotification(supplementId);
      if (suppress) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

export default function RootLayout() {
  const router = useRouter();
  // Inicializar Firebase Auth na inicialização do app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // PRIMEIRO: Inicializar Firebase Auth e verificar se há usuário logado
        const user = await authService.initialize();
        console.log("🔥 Firebase Auth inicializado");

        // Se há usuário autenticado e verificado, ir direto para home
        if (user && authService.shouldSyncWithFirebase()) {
          console.log("✅ Usuário já autenticado:", user.email);
          console.log("🏠 Redirecionando para home");
          router.replace("/(tabs)");
          return;
        }

        console.log("❌ Usuário não autenticado ou email não verificado");

        // SEGUNDO: Se não está autenticado, verificar se é primeira abertura
        const hasSeenWelcome = await AsyncStorage.getItem("has_seen_welcome");

        if (!hasSeenWelcome) {
          // Primeira vez abrindo o app - mostrar welcome
          console.log(
            "📱 Primeira abertura do app - redirecionando para welcome",
          );
          router.replace("/welcome");
        } else {
          // Já viu welcome mas não está logado - ir para login
          console.log("🔑 Usuário precisa fazer login");
          router.replace("/login");
        }
      } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        // Em caso de erro, mostrar welcome por segurança
        router.replace("/welcome");
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
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* ✅ Telas de autenticação */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* ✅ Tela de informações sobre nuvem */}
        <Stack.Screen
          name="cloud-info"
          options={{ title: "Backup na Nuvem" }}
        />

        {/* ✅ Tela de configuração da home */}
        <Stack.Screen
          name="configurar-home"
          options={{ title: "Configurar Home" }}
        />

        {/* ✅ Tela de planejamento semanal */}
        <Stack.Screen
          name="planejar-semana"
          options={{ title: "Planejar Semana" }}
        />

        <Stack.Screen
          name="fichas/[id]"
          options={{ title: "Detalhes do Treino" }}
        />
        <Stack.Screen
          name="fichas/exercicio"
          options={{ title: "Exercício" }}
        />
        <Stack.Screen
          name="musculacao"
          options={{ title: "Fichas de Treino" }}
        />
        <Stack.Screen
          name="logEsporte"
          options={{ title: "Registar Atividade" }}
        />
        <Stack.Screen name="gerir-fichas" options={{ title: "Gerir Fichas" }} />
        <Stack.Screen
          name="gerir-esportes"
          options={{ title: "Gerir Esportes" }}
        />
        <Stack.Screen
          name="editar-ficha/[id]"
          options={{ title: "Editar Ficha" }}
        />
        <Stack.Screen
          name="exercicio-modal"
          options={{ presentation: "modal", title: "Exercício" }}
        />
        <Stack.Screen
          name="ficha-modal"
          options={{ presentation: "modal", title: "Nova Ficha" }}
        />
        <Stack.Screen
          name="perfil-modal"
          options={{ presentation: "modal", title: "Meu Perfil" }}
        />
        <Stack.Screen name="perfil" options={{ title: "Perfil" }} />

        {/* ✅ Ecrãs de suplementos */}
        <Stack.Screen
          name="gerir-suplementos"
          options={{ title: "Gerir Suplementos" }}
        />
        <Stack.Screen
          name="suplemento-modal"
          options={{ presentation: "modal", title: "Suplemento" }}
        />
      </Stack>

      {/* Toast com configuração customizada - renderizado por último para aparecer sobre tudo */}
      <Toast config={toastConfig} />
    </SportsProvider>
  );
}
