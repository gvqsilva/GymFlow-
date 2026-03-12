// app/(tabs)/perfil.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { BodyMeasurementsCard } from "../../components/BodyMeasurementsCard";
import { useResponsive } from "../../hooks/useResponsive";
import { authService } from "../../services/authService";
import { firebaseSyncService } from "../../services/firebaseSync";
import { BMRInput, calculateTDEE } from "../../utils/calorieCalculator";

const { width } = Dimensions.get("window");
const themeColor = "#5a4fcf";

// --- Funções Auxiliares ---
// Retorna a data no formato YYYY-MM-DD usando componentes de data local (evita usar toISOString que converte para UTC)
const getLocalDateString = (date: Date | string = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const normalizeText = (value: string = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const parseHistoryDate = (value: string | Date) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

const isDateInCurrentWeek = (date: Date, now: Date) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
};

const isDateInCurrentMonth = (date: Date, now: Date) =>
  date.getMonth() === now.getMonth() &&
  date.getFullYear() === now.getFullYear();

const getActivityDistanceKm = (
  entry: any,
  normalizedCategory: string,
): number => {
  const details = entry?.details || {};
  const distanceKm = Number(details?.distanceKm || 0);
  if (Number.isFinite(distanceKm) && distanceKm > 0) return distanceKm;

  const isSwimming = normalizedCategory.includes("natacao");
  const swimMeters = Number(details?.distance || 0);
  if (isSwimming && Number.isFinite(swimMeters) && swimMeters > 0) {
    return swimMeters / 1000;
  }

  return 0;
};

const calculateAge = (birthDate: string | Date): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
};

const getBmiClassification = (imc: number) => {
  if (imc < 18.5) return { text: "Abaixo do peso", color: "#3498db" };
  if (imc < 25) return { text: "Peso ideal", color: "#2ecc71" };
  if (imc < 30) return { text: "Sobrepeso", color: "#f39c12" };
  return { text: "Obesidade", color: "#e74c3c" };
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const calculateIMC = (weight: number, height: number) => {
  if (weight > 0 && height > 0) {
    const heightInMeters = height / 100;
    const imc = weight / (heightInMeters * heightInMeters);
    const classification = getBmiClassification(imc);
    return {
      value: imc.toFixed(1),
      text: classification.text,
      color: classification.color,
    };
  }
  return { value: "N/A", text: "", color: "gray" };
};

// ✅ Calcula TMB (Taxa Metabólica Basal)
const calculateTMB = (
  weight: number,
  height: number,
  age: number,
  gender: string,
): number => {
  if (gender === "M" || gender === "masculino") {
    // Fórmula de Harris-Benedict para homens
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    // Fórmula de Harris-Benedict para mulheres
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
};

// ✅ Calcula Body Composition (estimado)
const calculateBodyComposition = (
  weight: number,
  age: number,
  gender: string,
  imc: number,
): { fatPercentage: number; musclePercentage: number } => {
  let fatPercentage = 0;

  if (gender === "M" || gender === "masculino") {
    // Fórmula Katch para homens
    fatPercentage = 1.1 * imc + 0.1 * age - 10.8 - 5.4;
  } else {
    // Fórmula Katch para mulheres
    fatPercentage = 1.07 * imc + 0.2 * age - 5.4;
  }

  fatPercentage = Math.max(5, Math.min(50, fatPercentage)); // Limita entre 5-50%
  const musclePercentage = Math.max(0, 100 - fatPercentage - 20); // 20% para ossos/órgãos

  return {
    fatPercentage: Math.round(fatPercentage),
    musclePercentage: Math.round(musclePercentage),
  };
};

// ✅ Determina o status de progresso (tendência)
const getTrendStatus = (
  currentWeight: number,
  previousWeight: number | undefined,
): { trend: string; emoji: string; color: string } => {
  if (!previousWeight || previousWeight === currentWeight) {
    return { trend: "Estável", emoji: "➡️", color: "#666" };
  }
  if (currentWeight < previousWeight) {
    return { trend: "Em queda", emoji: "📉", color: "#2ecc71" };
  }
  return { trend: "Em alta", emoji: "📈", color: "#e74c3c" };
};

// ✅ Calcula dias até meta
const calculateDaysToGoal = (
  currentWeight: number,
  targetWeight: number,
  weeklyRate: number = 0.5,
): number | null => {
  if (!targetWeight || currentWeight === targetWeight || weeklyRate === 0)
    return null;
  const weightDiff = Math.abs(currentWeight - targetWeight);
  const weeks = weightDiff / weeklyRate;
  return Math.round(weeks * 7);
};

const getProfileTimestamp = (profile: any): number => {
  if (!profile) return 0;

  if (typeof profile.updatedAtMs === "number" && Number.isFinite(profile.updatedAtMs)) {
    return profile.updatedAtMs;
  }

  const updatedAt = profile.updatedAt || profile.lastUpdated;
  if (!updatedAt) return 0;

  const parsedDate = new Date(updatedAt).getTime();
  return Number.isFinite(parsedDate) ? parsedDate : 0;
};

const getMostRecentProfile = (localProfile: any, firebaseProfile: any): any => {
  if (!localProfile && !firebaseProfile) return null;
  if (!localProfile) return firebaseProfile;
  if (!firebaseProfile) return localProfile;

  const localTimestamp = getProfileTimestamp(localProfile);
  const firebaseTimestamp = getProfileTimestamp(firebaseProfile);

  if (localTimestamp >= firebaseTimestamp) {
    return localProfile;
  }

  return firebaseProfile;
};

// ✅ Gera badges baseado em métricas
const generateBadges = (
  dailyConsumed: number,
  dailySpent: number,
  calorieGoal: number,
  weeklyGymWorkouts: number = 0,
): string[] => {
  const badges = [];
  if (
    dailyConsumed >= calorieGoal * 0.95 &&
    dailyConsumed <= calorieGoal * 1.05
  )
    badges.push("🎯 Meta Atingida");
  if (dailySpent >= 500) badges.push("🔥 Super Queimador");
  if (weeklyGymWorkouts >= 5) badges.push("💪 Dedicado");
  return badges;
};
// --- Fim das Funções Auxiliares ---

export default function ProfileScreen() {
  const router = useRouter();
  const { fontSize, spacing, isTablet } = useResponsive();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "progresso" | "atividades" | "configuracoes"
  >("progresso");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [activityPeriod, setActivityPeriod] = useState<"semana" | "mes">(
    "semana",
  );
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [userSports, setUserSports] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{
    workoutEntries: number;
    foodEntries: number;
    supplementEntries: number;
  }>({ workoutEntries: 0, foodEntries: 0, supplementEntries: 0 });
  const [dailyConsumed, setDailyConsumed] = useState(0);
  const [dailySpent, setDailySpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [calorieGoal, setCalorieGoal] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const loadStorageStats = useCallback(async () => {
    try {
      const workoutHistoryJSON = await AsyncStorage.getItem("workoutHistory");
      const foodHistoryJSON = await AsyncStorage.getItem("foodHistory");
      const supplementsHistoryJSON = await AsyncStorage.getItem(
        "supplements_history",
      );

      const workoutHistoryData = workoutHistoryJSON
        ? JSON.parse(workoutHistoryJSON)
        : [];
      const foodHistoryData = foodHistoryJSON
        ? JSON.parse(foodHistoryJSON)
        : [];
      const supplementsHistoryData = supplementsHistoryJSON
        ? JSON.parse(supplementsHistoryJSON)
        : {};

      const supplementEntries = Object.keys(supplementsHistoryData).reduce(
        (total, date) => {
          return total + Object.keys(supplementsHistoryData[date]).length;
        },
        0,
      );

      setStorageStats({
        workoutEntries: workoutHistoryData.length,
        foodEntries: foodHistoryData.length,
        supplementEntries,
      });
    } catch (error) {
      console.warn("Erro ao carregar estatísticas:", error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Sair da Conta",
      "Tem certeza que deseja sair? Seus dados ficarão salvos apenas no dispositivo até fazer login novamente.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
              Alert.alert(
                "Logout realizado",
                "Agora você está no modo offline. Seus dados estão salvos apenas neste dispositivo.",
              );
            } catch (error) {
              Alert.alert("Erro", "Falha ao fazer logout");
            }
          },
        },
      ],
    );
  }, []);

  // Função para verificar status do Firebase (DEBUG)
  const checkFirebaseStatus = async () => {
    try {
      let firebaseProfile = null;

      // Verificar se a função existe antes de usar
      if (
        firebaseSyncService &&
        typeof firebaseSyncService.loadProfile === "function"
      ) {
        firebaseProfile = await firebaseSyncService.loadProfile();
      }

      const localProfile = await AsyncStorage.getItem("userProfile");

      Alert.alert(
        "🔍 Status de Sincronização",
        `Firebase: ${firebaseProfile ? "✅ Encontrado" : "❌ Não encontrado"}\n` +
          `Local: ${localProfile ? "✅ Encontrado" : "❌ Não encontrado"}\n` +
          `Usuário: ${authService.getCurrentUser()?.email || "Não logado"}\n` +
          `Sync Habilitado: ${authService.shouldSyncWithFirebase() ? "✅ Sim" : "❌ Não"}\n` +
          `Função loadProfile: ${firebaseSyncService && typeof firebaseSyncService.loadProfile === "function" ? "✅ Disponível" : "❌ Não disponível"}`,
        [
          { text: "OK" },
          {
            text: "Ver Logs",
            onPress: () => {
              console.log("🔍 DADOS FIREBASE:", firebaseProfile);
              console.log(
                "🔍 DADOS LOCAL:",
                localProfile ? JSON.parse(localProfile) : null,
              );
              console.log("🔍 FIREBASE SERVICE:", firebaseSyncService);
            },
          },
          {
            text: "🧹 Reset Completo",
            style: "destructive",
            onPress: resetCompleteData,
          },
        ],
      );
    } catch (error) {
      Alert.alert("❌ Erro", `Erro ao verificar status: ${error}`);
    }
  };

  // Função para reset completo dos dados
  const resetCompleteData = async () => {
    Alert.alert(
      "⚠️ Reset Completo",
      "Isso vai apagar TODOS os dados locais e fazer logout. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "🧹 Sim, Resetar",
          style: "destructive",
          onPress: async () => {
            try {
              // Limpar AsyncStorage
              await AsyncStorage.multiRemove([
                "userProfile",
                "firebase_user_id",
                "user_email",
                "user_credentials",
                "first_login_completed",
                "sports",
                "supplements",
                "workouts",
                "foodHistory",
              ]);

              // Fazer logout
              await authService.logout();

              Alert.alert(
                "✅ Reset Completo",
                "Dados limpos! Reinicie o app e crie nova conta.",
              );
            } catch (error) {
              Alert.alert("❌ Erro", `Erro no reset: ${error}`);
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        setLastSyncTime(timeString);

        try {
          // Checar se o usuário está autenticado
          const current = authService.getCurrentUser();
          setIsAuthenticated(!!current && authService.shouldSyncWithFirebase());
          setIsOfflineMode(authService.isInOfflineMode());
          setUserEmail(current?.email || null);

          const profileJSON = await AsyncStorage.getItem("userProfile");
          const localProfile = profileJSON ? JSON.parse(profileJSON) : null;

          let firebaseProfile = null;

          // Tentar carregar do Firebase se o usuário estiver autenticado
          if (current && authService.shouldSyncWithFirebase()) {
            try {
              // Verificar se a função existe antes de chamá-la
              if (
                firebaseSyncService &&
                typeof firebaseSyncService.loadProfile === "function"
              ) {
                firebaseProfile = await firebaseSyncService.loadProfile();
                if (firebaseProfile) {
                  console.log("✅ Carregando perfil do Firebase na home");
                }
              } else {
                console.warn(
                  "⚠️ Função loadProfile não está disponível no firebaseSyncService",
                );
              }
            } catch (error) {
              console.warn(
                "⚠️ Erro ao carregar perfil do Firebase na home:",
                error,
              );
            }
          }

          const loadedProfile = getMostRecentProfile(localProfile, firebaseProfile);

          if (loadedProfile) {
            await AsyncStorage.setItem("userProfile", JSON.stringify(loadedProfile));
            if (loadedProfile === localProfile && firebaseProfile) {
              console.log("📱 Mantendo perfil local mais recente");
            } else if (loadedProfile === firebaseProfile) {
              console.log("☁️ Mantendo perfil do Firebase mais recente");
            } else {
              console.log("📱 Carregando perfil do AsyncStorage local na home");
            }
          }

          setProfile(loadedProfile);

          const today = getLocalDateString();

          const foodHistoryJSON = await AsyncStorage.getItem("foodHistory");
          const foodHistory = foodHistoryJSON
            ? JSON.parse(foodHistoryJSON)
            : [];
          const consumed = foodHistory
            .filter((entry: any) => entry.date === today)
            .reduce(
              (sum: number, entry: any) => sum + (entry.data?.calories || 0),
              0,
            );
          setDailyConsumed(Math.round(consumed));

          const workoutHistoryJSON =
            await AsyncStorage.getItem("workoutHistory");
          const workoutHistory = workoutHistoryJSON
            ? JSON.parse(workoutHistoryJSON)
            : [];
          setWorkoutHistory(workoutHistory);

          // Carrega lista de esportes configurados pelo usuário
          const sportsJSON = await AsyncStorage.getItem("user_sports_list");
          const sports = sportsJSON ? JSON.parse(sportsJSON) : [];
          setUserSports(sports);

          const spent = workoutHistory
            .filter((entry: any) => entry.date === today)
            .reduce(
              (sum: number, entry: any) => sum + (entry.details?.calories || 0),
              0,
            );
          setDailySpent(Math.round(spent));

          await loadStorageStats();

          if (loadedProfile) {
            const age = calculateAge(loadedProfile.birthDate);
            const weightNum = parseFloat(loadedProfile.weight || 0);
            const heightNum = parseInt(loadedProfile.height || 0, 10);
            const targetWeightNum = parseFloat(loadedProfile.targetWeight || 0);

            if (
              weightNum > 0 &&
              heightNum > 0 &&
              age > 0 &&
              loadedProfile.gender
            ) {
              const tdee = calculateTDEE({
                weight: weightNum,
                height: heightNum,
                age: age,
                gender: loadedProfile.gender,
                activityLevel: loadedProfile.activityLevel || "moderado",
                targetWeight: targetWeightNum > 0 ? targetWeightNum : undefined,
                goalDate: loadedProfile.goalDate,
              } as BMRInput);
              setCalorieGoal(tdee);
            }
          }
        } catch (e) {
          console.error("Falha ao carregar dados do perfil:", e);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, [loadStorageStats]),
  );

  const activityData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const weekLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const monthLabels = ["S1", "S2", "S3", "S4", "S5"];
    const palette = [
      "#ff4d6d",
      "#4d96ff",
      "#2ecc71",
      "#f39c12",
      "#9b59b6",
      "#16a085",
      "#e67e22",
    ];

    const getActivityVisual = (key: string, index: number) => {
      if (key.includes("corrida")) return { icon: "walk", color: "#ff4d6d" };
      if (key.includes("natacao")) return { icon: "water", color: "#4d96ff" };
      if (
        key.includes("ciclismo") ||
        key.includes("bike") ||
        key.includes("bicicleta")
      ) {
        return { icon: "bicycle", color: "#2ecc71" };
      }
      return { icon: "barbell", color: palette[index % palette.length] };
    };

    const activitiesMap = new Map<
      string,
      {
        key: string;
        label: string;
        icon: string;
        color: string;
        totalCount: number;
        totalDistance: number;
        weekCount: number;
        monthCount: number;
        weekDistance: number;
        monthDistance: number;
        weekMinutes: number;
        monthMinutes: number;
        weekElevation: number;
        monthElevation: number;
        weekCalories: number;
        monthCalories: number;
      }
    >();

    const weekSeriesByActivity: Record<string, number[]> = {};
    const monthSeriesByActivity: Record<string, number[]> = {};

    workoutHistory.forEach((entry) => {
      if (!entry?.category || !entry?.date) return;
      const category = normalizeText(entry.category);
      const historyDate = parseHistoryDate(entry.date);
      if (Number.isNaN(historyDate.getTime())) return;

      const isWeek = isDateInCurrentWeek(historyDate, now);
      const isMonth = isDateInCurrentMonth(historyDate, now);
      if (!isWeek && !isMonth) return;

      const minutes = Number(entry?.details?.duration || 0);
      const calories = Number(entry?.details?.calories || 0);
      const elevation = Number(
        entry?.details?.elevation || entry?.details?.elevationGain || 0,
      );
      const distanceKm = getActivityDistanceKm(entry, category);

      if (!activitiesMap.has(category)) {
        const visual = getActivityVisual(category, activitiesMap.size);
        activitiesMap.set(category, {
          key: category,
          label: String(entry.category || "Atividade"),
          icon: visual.icon,
          color: visual.color,
          totalCount: 0,
          totalDistance: 0,
          weekCount: 0,
          monthCount: 0,
          weekDistance: 0,
          monthDistance: 0,
          weekMinutes: 0,
          monthMinutes: 0,
          weekElevation: 0,
          monthElevation: 0,
          weekCalories: 0,
          monthCalories: 0,
        });
      }

      const activity = activitiesMap.get(category);
      if (!activity) return;

      activity.totalCount += 1;
      activity.totalDistance += distanceKm;

      if (isWeek) {
        activity.weekCount += 1;
        activity.weekDistance += distanceKm;
        activity.weekMinutes += minutes;
        activity.weekElevation += elevation;
        activity.weekCalories += calories;

        if (distanceKm > 0) {
          if (!weekSeriesByActivity[category]) {
            weekSeriesByActivity[category] = new Array(7).fill(0);
          }
          const dayIndex = Math.floor(
            (historyDate.getTime() - startOfWeek.getTime()) /
              (24 * 60 * 60 * 1000),
          );
          if (dayIndex >= 0 && dayIndex < 7) {
            weekSeriesByActivity[category][dayIndex] += distanceKm;
          }
        }
      }

      if (isMonth) {
        activity.monthCount += 1;
        activity.monthDistance += distanceKm;
        activity.monthMinutes += minutes;
        activity.monthElevation += elevation;
        activity.monthCalories += calories;

        if (distanceKm > 0) {
          if (!monthSeriesByActivity[category]) {
            monthSeriesByActivity[category] = new Array(5).fill(0);
          }
          const weekOfMonth = Math.min(
            4,
            Math.floor((historyDate.getDate() - 1) / 7),
          );
          monthSeriesByActivity[category][weekOfMonth] += distanceKm;
        }
      }
    });

    // Adiciona todos os esportes configurados ao mapa, mesmo sem histórico
    userSports.forEach((sport) => {
      const normalizedSportName = normalizeText(sport.name);

      // Se o esporte já está no mapa (tem histórico), não sobrescreve
      if (!activitiesMap.has(normalizedSportName)) {
        const visual = getActivityVisual(
          normalizedSportName,
          activitiesMap.size,
        );
        activitiesMap.set(normalizedSportName, {
          key: normalizedSportName,
          label: sport.name,
          icon: visual.icon,
          color: visual.color,
          totalCount: 0,
          totalDistance: 0,
          weekCount: 0,
          monthCount: 0,
          weekDistance: 0,
          monthDistance: 0,
          weekMinutes: 0,
          monthMinutes: 0,
          weekElevation: 0,
          monthElevation: 0,
          weekCalories: 0,
          monthCalories: 0,
        });
      }
    });

    const allActivities = Array.from(activitiesMap.values()).sort(
      (a, b) => b.totalCount - a.totalCount,
    );

    const distanceActivities = allActivities.filter(
      (activity) => activity.totalDistance > 0,
    );

    distanceActivities.forEach((activity) => {
      if (!weekSeriesByActivity[activity.key]) {
        weekSeriesByActivity[activity.key] = new Array(7).fill(0);
      }
      if (!monthSeriesByActivity[activity.key]) {
        monthSeriesByActivity[activity.key] = new Array(5).fill(0);
      }
    });

    return {
      weekLabels,
      monthLabels,
      weekSeriesByActivity,
      monthSeriesByActivity,
      distanceActivities,
      allActivities,
    };
  }, [workoutHistory, userSports]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColor} />
      </SafeAreaView>
    );
  }

  // Se não há perfil salvo, permite ao usuário criar um — evita spinner infinito
  if (!profile) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={120}
                color={themeColor}
              />
            </View>

            <Text style={styles.emptyTitle}>Bem-vindo ao GymFlow!</Text>
            <Text style={styles.emptySubtitle}>
              Para começar sua jornada fitness, vamos criar seu perfil
              personalizado{" "}
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="fitness" size={24} color={themeColor} />
                <Text style={styles.benefitText}>
                  Cálculo personalizado de calorias{" "}
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="analytics" size={24} color={themeColor} />
                <Text style={styles.benefitText}>
                  Acompanhamento do seu progresso{" "}
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="flag" size={24} color={themeColor} />
                <Text style={styles.benefitText}>
                  Metas personalizadas para você{" "}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/perfil-modal")}
              style={styles.createProfileButton}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.createProfileText}>Criar Meu Perfil </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const age = calculateAge(profile.birthDate);
  const imcData = calculateIMC(profile.weight, profile.height);
  const weightNum = parseFloat(profile.weight || 0);
  const heightNum = parseInt(profile.height || 0, 10);
  const targetWeightNum = parseFloat(profile.targetWeight || 0);

  // ✅ NOVAS MÉTRICAS
  const tmb = calculateTMB(weightNum, heightNum, age, profile.gender);
  const bodyComposition = calculateBodyComposition(
    weightNum,
    age,
    profile.gender,
    parseFloat(imcData.value),
  );
  const trendStatus = getTrendStatus(weightNum, profile.previousWeight);
  const daysToGoal = calculateDaysToGoal(weightNum, targetWeightNum);
  const weightGoalProgress =
    targetWeightNum && targetWeightNum !== weightNum
      ? Math.min(
          Math.max(
            (Math.abs(
              profile.previousWeight ? weightNum - profile.previousWeight : 0,
            ) /
              Math.abs(
                targetWeightNum - (profile.previousWeight || weightNum),
              )) *
              100,
            0,
          ),
          100,
        )
      : 0;

  // ✅ OBJETIVO
  const weightGoalDiff = targetWeightNum ? targetWeightNum - weightNum : 0;
  const goalDirection =
    weightGoalDiff < 0
      ? "Perder"
      : weightGoalDiff > 0
        ? "Ganhar"
        : "Manutenção";
  const goalText = Math.abs(weightGoalDiff).toFixed(1);

  const netBalance = dailyConsumed - dailySpent;
  const remainingCalories = calorieGoal - dailyConsumed;

  // ✅ Textos dinâmicos
  const netBalanceText =
    netBalance < 0
      ? "Você gastou mais do que consumiu"
      : netBalance > 0
        ? "Você consumiu mais do que gastou"
        : "Balanço neutro";
  const goalStatusText =
    remainingCalories < 0
      ? "Você ultrapassou a sua meta"
      : "Abaixo da sua meta";

  const selectedSportData =
    activityData.distanceActivities.find(
      (activity) => activity.key === selectedActivity,
    ) || activityData.distanceActivities[0];

  const selectedActivityKey = selectedSportData?.key || "";

  const selectedSportSeries =
    activityPeriod === "semana"
      ? activityData.weekSeriesByActivity[selectedActivityKey] ||
        new Array(7).fill(0)
      : activityData.monthSeriesByActivity[selectedActivityKey] ||
        new Array(5).fill(0);

  const selectedXAxisLabels =
    activityPeriod === "semana"
      ? activityData.weekLabels
      : activityData.monthLabels;

  const selectedDistance =
    activityPeriod === "semana"
      ? selectedSportData.weekDistance
      : selectedSportData.monthDistance;

  const selectedMinutes =
    activityPeriod === "semana"
      ? selectedSportData.weekMinutes
      : selectedSportData.monthMinutes;

  const selectedSessions =
    activityPeriod === "semana"
      ? selectedSportData.weekCount
      : selectedSportData.monthCount;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.internalTabsContainer}>
          <Pressable
            style={[
              styles.internalTabButton,
              activeTab === "progresso" && styles.internalTabButtonActive,
            ]}
            onPress={() => setActiveTab("progresso")}
          >
            <Text
              style={[
                styles.internalTabText,
                activeTab === "progresso" && styles.internalTabTextActive,
              ]}
            >
              Progresso
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.internalTabButton,
              activeTab === "atividades" && styles.internalTabButtonActive,
            ]}
            onPress={() => setActiveTab("atividades")}
          >
            <Text
              style={[
                styles.internalTabText,
                activeTab === "atividades" && styles.internalTabTextActive,
              ]}
            >
              Atividades
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.internalTabButton,
              activeTab === "configuracoes" && styles.internalTabButtonActive,
            ]}
            onPress={() => setActiveTab("configuracoes")}
          >
            <Text
              style={[
                styles.internalTabText,
                activeTab === "configuracoes" && styles.internalTabTextActive,
              ]}
            >
              Configurações
            </Text>
          </Pressable>
        </View>

        {activeTab === "progresso" && (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                {profile?.profileImage ? (
                  <Image
                    source={{ uri: profile.profileImage }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.profileAvatar,
                      { backgroundColor: profile?.avatarColor || themeColor },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {profile?.name ? getInitials(profile.name) : "US"}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileName}>Olá, {profile.name}!</Text>
              <Text style={styles.profileInfo}>
                {age} anos • {profile.height}cm • {profile.gender}
              </Text>
            </View>

            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatCard}>
                <Ionicons name="scale" size={24} color={themeColor} />
                <Text style={styles.quickStatValue}>{profile.weight}kg </Text>
                <Text style={styles.quickStatLabel}>Peso Atual </Text>
              </View>

              <View style={styles.quickStatCard}>
                <Ionicons name="analytics" size={24} color={imcData.color} />
                <Text style={[styles.quickStatValue, { color: imcData.color }]}>
                  {imcData.value}{" "}
                </Text>
                <Text style={styles.quickStatLabel}>IMC </Text>
                <Text
                  style={[styles.quickStatSubtext, { color: imcData.color }]}
                >
                  {imcData.text}{" "}
                </Text>
              </View>

              <View style={styles.quickStatCard}>
                <Ionicons name="flame" size={24} color="#ff6b35" />
                <Text style={[styles.quickStatValue, { color: "#ff6b35" }]}>
                  {calorieGoal}
                </Text>
                <Text style={styles.quickStatLabel}>Meta Diária </Text>
                <Text style={styles.quickStatSubtext}>kcal </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="today" size={20} color={themeColor} />
                <Text style={styles.sectionTitle}>Progresso de Hoje </Text>
              </View>

              <View style={styles.progressCard}>
                <View style={styles.progressRow}>
                  <View style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressIcon,
                        { backgroundColor: "#e8f5e8" },
                      ]}
                    >
                      <Ionicons name="restaurant" size={20} color="#2ecc71" />
                    </View>
                    <Text style={styles.progressValue}>{dailyConsumed} </Text>
                    <Text style={styles.progressLabel}>Consumidas </Text>
                  </View>

                  <View style={styles.progressDivider} />

                  <View style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressIcon,
                        { backgroundColor: "#ffe8e8" },
                      ]}
                    >
                      <Ionicons name="fitness" size={20} color="#e74c3c" />
                    </View>
                    <Text style={styles.progressValue}>{dailySpent} </Text>
                    <Text style={styles.progressLabel}>Queimadas </Text>
                  </View>
                </View>

                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Balanço Energético </Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      {
                        color:
                          netBalance > 0
                            ? "#f39c12"
                            : netBalance < 0
                              ? "#2ecc71"
                              : "#666",
                      },
                    ]}
                  >
                    {netBalance > 0 ? "+" : ""}
                    {netBalance} kcal{" "}
                  </Text>
                  <Text style={styles.balanceDescription}>
                    {netBalanceText}{" "}
                  </Text>
                </View>
              </View>
            </View>

            {targetWeightNum > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flag" size={20} color={themeColor} />
                  <Text style={styles.sectionTitle}>Sua Meta</Text>
                </View>

                <View style={styles.goalCard}>
                  <View style={styles.goalMetaHeader}>
                    <View style={styles.goalMetaItem}>
                      <Text style={styles.goalMetaLabel}>Peso Atual</Text>
                      <Text style={styles.goalMetaValue}>{weightNum}kg</Text>
                    </View>
                    <View
                      style={[
                        styles.goalMetaArrow,
                        {
                          backgroundColor:
                            weightGoalDiff < 0 ? "#e74c3c" : "#2ecc71",
                        },
                      ]}
                    >
                      <Ionicons
                        name={weightGoalDiff < 0 ? "arrow-down" : "arrow-up"}
                        size={20}
                        color="white"
                      />
                    </View>
                    <View style={styles.goalMetaItem}>
                      <Text style={styles.goalMetaLabel}>Peso Alvo</Text>
                      <Text style={styles.goalMetaValue}>
                        {targetWeightNum}kg
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalProgressBlock}>
                    <View style={styles.goalProgressBar}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          {
                            width: `${weightGoalProgress}%`,
                            backgroundColor:
                              weightGoalDiff < 0 ? "#e74c3c" : "#2ecc71",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.goalProgressPercent}>
                      {Math.round(weightGoalProgress)}%
                    </Text>
                  </View>

                  <View style={styles.goalInfoRow}>
                    <View style={styles.goalInfoItem}>
                      <Text style={styles.goalInfoLabel}>Falta Perder</Text>
                      <Text
                        style={[styles.goalInfoValue, { color: "#e74c3c" }]}
                      >
                        {goalText}kg
                      </Text>
                    </View>
                    {daysToGoal && (
                      <View style={styles.goalInfoItem}>
                        <Text style={styles.goalInfoLabel}>Estimativa</Text>
                        <Text
                          style={[styles.goalInfoValue, { color: "#f39c12" }]}
                        >
                          ~{daysToGoal} dias
                        </Text>
                      </View>
                    )}
                    <View style={styles.goalInfoItem}>
                      <Text style={styles.goalInfoLabel}>Tendência</Text>
                      <Text
                        style={[
                          styles.goalInfoValue,
                          { color: trendStatus.color },
                        ]}
                      >
                        {trendStatus.emoji}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.progressSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pulse" size={20} color={themeColor} />
                <Text style={styles.sectionTitle}>Dados Metabólicos</Text>
              </View>

              <View style={styles.statsGridContainer}>
                <View style={styles.statGridCard}>
                  <View
                    style={[
                      styles.statGridIcon,
                      { backgroundColor: "#ffe8e8" },
                    ]}
                  >
                    <Ionicons name="flame" size={20} color="#e74c3c" />
                  </View>
                  <Text style={styles.statGridLabel}>TMB</Text>
                  <Text style={styles.statGridValue}>{Math.round(tmb)}</Text>
                  <Text style={styles.statGridUnit}>kcal/dia</Text>
                  <Text style={styles.statGridDescription}>
                    Gasto em repouso
                  </Text>
                </View>

                <View style={styles.statGridCard}>
                  <View
                    style={[
                      styles.statGridIcon,
                      { backgroundColor: "#fff3e0" },
                    ]}
                  >
                    <Ionicons name="flash" size={20} color="#f39c12" />
                  </View>
                  <Text style={styles.statGridLabel}>TDEE</Text>
                  <Text style={styles.statGridValue}>{calorieGoal}</Text>
                  <Text style={styles.statGridUnit}>kcal/dia</Text>
                  <Text style={styles.statGridDescription}>
                    Gasto total do dia
                  </Text>
                </View>

                <View style={styles.statGridCard}>
                  <View
                    style={[
                      styles.statGridIcon,
                      { backgroundColor: "#e8f5e8" },
                    ]}
                  >
                    <Ionicons name="body" size={20} color="#2ecc71" />
                  </View>
                  <Text style={styles.statGridLabel}>Atividade</Text>
                  <Text style={styles.statGridValue}>
                    {profile.activityLevel || "Moderada"}
                  </Text>
                  <Text style={styles.statGridUnit}></Text>
                  <Text style={styles.statGridDescription}>Seu nível</Text>
                </View>
              </View>

              <View style={styles.metricsInfoContainer}>
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={themeColor}
                  />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoBold}>TMB</Text> = calorias gastas
                    apenas respirando, sem atividade
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={themeColor}
                  />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoBold}>TDEE</Text> = TMB + atividade
                    diária (seu déficit/excesso baseia-se nisto)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="man" size={20} color={themeColor} />
                <Text style={styles.sectionTitle}>
                  Composição Corporal (Est.)
                </Text>
              </View>

              <View style={styles.bodyCompCard}>
                <View style={styles.bodyCompItem}>
                  <View style={styles.bodyCompBar}>
                    <View
                      style={[
                        styles.bodyCompFill,
                        {
                          width: `${bodyComposition.fatPercentage}%`,
                          backgroundColor: "#e74c3c",
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.bodyCompLabel}>
                    <Text style={styles.bodyCompLabelText}>
                      Gordura Corporal
                    </Text>
                    <Text
                      style={[styles.bodyCompLabelValue, { color: "#e74c3c" }]}
                    >
                      {bodyComposition.fatPercentage}%
                    </Text>
                  </View>
                </View>

                <View style={styles.bodyCompItem}>
                  <View style={styles.bodyCompBar}>
                    <View
                      style={[
                        styles.bodyCompFill,
                        {
                          width: `${bodyComposition.musclePercentage}%`,
                          backgroundColor: "#2ecc71",
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.bodyCompLabel}>
                    <Text style={styles.bodyCompLabelText}>
                      Musculatura (Est.)
                    </Text>
                    <Text
                      style={[styles.bodyCompLabelValue, { color: "#2ecc71" }]}
                    >
                      {bodyComposition.musclePercentage}%
                    </Text>
                  </View>
                </View>

                <View style={styles.bodyCompItem}>
                  <View style={styles.bodyCompBar}>
                    <View
                      style={[
                        styles.bodyCompFill,
                        { width: "20%", backgroundColor: "#666" },
                      ]}
                    />
                  </View>
                  <View style={styles.bodyCompLabel}>
                    <Text style={styles.bodyCompLabelText}>Ossos/Órgãos</Text>
                    <Text
                      style={[styles.bodyCompLabelValue, { color: "#666" }]}
                    >
                      20%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <BodyMeasurementsCard />
          </>
        )}

        {activeTab === "atividades" && (
          <View style={styles.activityContainer}>
            <View style={styles.activitySelectorRow}>
              {activityData.distanceActivities.map((sport) => {
                const isSelected = selectedActivityKey === sport.key;
                return (
                  <Pressable
                    key={sport.key}
                    style={[
                      styles.activitySelectorButton,
                      isSelected && {
                        borderColor: sport.color,
                        backgroundColor: `${sport.color}15`,
                      },
                    ]}
                    onPress={() => setSelectedActivity(sport.key)}
                  >
                    <Ionicons
                      name={sport.icon as any}
                      size={16}
                      color={isSelected ? sport.color : "#666"}
                    />
                    <Text
                      style={[
                        styles.activitySelectorText,
                        isSelected && { color: sport.color },
                      ]}
                    >
                      {sport.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activityData.distanceActivities.length === 0 && (
              <View style={styles.activityDistanceEmptyCard}>
                <Text style={styles.activityDistanceEmptyText}>
                  Nenhuma atividade com distância registrada ainda.
                </Text>
              </View>
            )}

            <View style={styles.activityPeriodRow}>
              <Pressable
                style={[
                  styles.activityPeriodButton,
                  activityPeriod === "semana" &&
                    styles.activityPeriodButtonActive,
                ]}
                onPress={() => setActivityPeriod("semana")}
              >
                <Text
                  style={[
                    styles.activityPeriodText,
                    activityPeriod === "semana" &&
                      styles.activityPeriodTextActive,
                  ]}
                >
                  Semana
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.activityPeriodButton,
                  activityPeriod === "mes" && styles.activityPeriodButtonActive,
                ]}
                onPress={() => setActivityPeriod("mes")}
              >
                <Text
                  style={[
                    styles.activityPeriodText,
                    activityPeriod === "mes" && styles.activityPeriodTextActive,
                  ]}
                >
                  Mês
                </Text>
              </Pressable>
            </View>

            <Text style={styles.activityWeekTitle}>
              {activityPeriod === "semana" ? "Esta semana" : "Este mês"}
            </Text>

            <View style={styles.activityWeekStatsRow}>
              <View style={styles.activityWeekStatItem}>
                <Text style={styles.activityWeekStatLabel}>Distância</Text>
                <Text style={styles.activityWeekStatValue}>
                  {(selectedDistance || 0).toFixed(1)} km
                </Text>
              </View>
              <View style={styles.activityWeekStatItem}>
                <Text style={styles.activityWeekStatLabel}>Tempo</Text>
                <Text style={styles.activityWeekStatValue}>
                  {selectedMinutes || 0} min
                </Text>
              </View>
              <View style={styles.activityWeekStatItem}>
                <Text style={styles.activityWeekStatLabel}>Sessões</Text>
                <Text style={styles.activityWeekStatValue}>
                  {selectedSessions || 0}
                </Text>
              </View>
            </View>

            <View style={styles.activityChartCard}>
              <Text style={styles.activityChartTitle}>
                {activityPeriod === "semana"
                  ? "Distância por dia (km)"
                  : "Distância por semana (km)"}
              </Text>

              <View style={styles.activityLineChartContainer}>
                <LineChart
                  data={{
                    labels: selectedXAxisLabels,
                    datasets: [
                      {
                        data: selectedSportSeries,
                        color: () => selectedSportData?.color || themeColor,
                        strokeWidth: 3,
                      },
                    ],
                  }}
                  width={Math.max(width - 72, 260)}
                  height={220}
                  withShadow
                  withDots
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines
                  withVerticalLabels
                  withHorizontalLabels
                  fromZero
                  yAxisInterval={1}
                  yAxisSuffix=" km"
                  bezier
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 1,
                    color: () => selectedSportData?.color || themeColor,
                    labelColor: () => "#999",
                    fillShadowGradientFrom:
                      selectedSportData?.color || themeColor,
                    fillShadowGradientTo:
                      selectedSportData?.color || themeColor,
                    fillShadowGradientFromOpacity: 0.28,
                    fillShadowGradientToOpacity: 0.02,
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: selectedSportData?.color || themeColor,
                      fill: "#ffffff",
                    },
                    propsForLabels: {
                      fontSize: 10,
                    },
                    propsForBackgroundLines: {
                      strokeWidth: 1,
                      stroke: "#eee",
                    },
                  }}
                  style={styles.activityLineChart}
                />
              </View>

              <Text style={styles.activityFooterText}>
                Distância total: {(selectedDistance || 0).toFixed(1)} km
              </Text>
            </View>

            {activityData.allActivities.map((sport) => (
              <View key={sport.key} style={styles.activitySummaryCard}>
                <View style={styles.activitySummaryHeader}>
                  <View
                    style={[
                      styles.activitySummaryIcon,
                      { backgroundColor: `${sport.color}22` },
                    ]}
                  >
                    <Ionicons
                      name={sport.icon as any}
                      size={18}
                      color={sport.color}
                    />
                  </View>
                  <Text style={styles.activitySummaryTitle}>{sport.label}</Text>
                </View>

                <View style={styles.activitySummaryGrid}>
                  <View style={styles.activitySummaryItem}>
                    <Text style={styles.activitySummaryLabel}>
                      {activityPeriod === "semana" ? "Semana" : "Mês"}
                    </Text>
                    <Text style={styles.activitySummaryValue}>
                      {activityPeriod === "semana"
                        ? sport.weekCount
                        : sport.monthCount}
                      x
                    </Text>
                  </View>
                  <View style={styles.activitySummaryItem}>
                    <Text style={styles.activitySummaryLabel}>Total</Text>
                    <Text style={styles.activitySummaryValue}>
                      {sport.totalCount}x
                    </Text>
                  </View>
                  <View style={styles.activitySummaryItem}>
                    <Text style={styles.activitySummaryLabel}>
                      Min ({activityPeriod === "semana" ? "sem" : "mês"})
                    </Text>
                    <Text style={styles.activitySummaryValue}>
                      {activityPeriod === "semana"
                        ? sport.weekMinutes
                        : sport.monthMinutes}
                    </Text>
                  </View>
                  <View style={styles.activitySummaryItem}>
                    <Text style={styles.activitySummaryLabel}>
                      Dist ({activityPeriod === "semana" ? "sem" : "mês"})
                    </Text>
                    <Text style={styles.activitySummaryValue}>
                      {(activityPeriod === "semana"
                        ? sport.weekDistance
                        : sport.monthDistance
                      ).toFixed(1)}
                      km
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "configuracoes" && (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsSectionHeader}>Conta</Text>

            {isOfflineMode ? (
              <View style={[styles.settingsLinkCard, styles.accessCard]}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={32}
                  color="#FF3B30"
                />
                <View style={styles.settingsCardTextContainer}>
                  <Text style={styles.settingsCardTitle}>Modo Offline</Text>
                  <Text style={styles.settingsCardSubtitle}>
                    Dados salvos apenas neste dispositivo
                  </Text>
                </View>
                <Pressable
                  style={styles.settingsActionButton}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.settingsActionButtonText}>Entrar</Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={[styles.settingsLinkCard, styles.settingsAccountCard]}
              >
                <Ionicons name="person-circle" size={32} color="#34C759" />
                <View style={styles.settingsCardTextContainer}>
                  <Text style={styles.settingsCardTitle}>Conta Conectada</Text>
                  <Text style={styles.settingsCardSubtitle}>
                    {userEmail || "Usuário autenticado"}
                  </Text>
                </View>
                <Pressable
                  style={styles.settingsLogoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.settingsLogoutButtonText}>Sair</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.settingsSectionHeader}>Armazenamento</Text>

            <Pressable
              style={[styles.settingsLinkCard, styles.cloudCard]}
              onPress={() => router.push("/cloud-info")}
            >
              <Ionicons name="cloud" size={28} color="#007AFF" />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>☁️ Backup na Nuvem</Text>
                <Text style={styles.settingsCardSubtitle}>
                  {isAuthenticated
                    ? `${storageStats.workoutEntries + storageStats.foodEntries + storageStats.supplementEntries} registros protegidos`
                    : "Proteja seus dados na nuvem"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </Pressable>

            <Text style={styles.settingsSectionHeader}>Dados e Progresso</Text>

            <Pressable
              style={styles.settingsLinkCard}
              onPress={() => router.push("/gestao-dados")}
            >
              <Ionicons name="calendar-outline" size={28} color={themeColor} />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>Gestão de Dados</Text>
                <Text style={styles.settingsCardSubtitle}>
                  Histórico mensal de atividades, suplementos e Kcal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </Pressable>

            <Text style={styles.settingsSectionHeader}>Personalização</Text>

            <Pressable
              style={styles.settingsLinkCard}
              onPress={() => router.push("/perfil-modal")}
            >
              <Ionicons name="person-outline" size={28} color={themeColor} />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>Editar Perfil</Text>
                <Text style={styles.settingsCardSubtitle}>
                  Altere peso, meta, prazo e foto de perfil
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </Pressable>

            <Pressable
              style={styles.settingsLinkCard}
              onPress={() => router.push("/gerir-fichas")}
            >
              <Ionicons
                name="document-text-outline"
                size={28}
                color={themeColor}
              />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>
                  Gerir Fichas de Treino
                </Text>
                <Text style={styles.settingsCardSubtitle}>
                  Crie e personalize as suas fichas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </Pressable>

            <Pressable
              style={styles.settingsLinkCard}
              onPress={() => router.push("/gerir-esportes")}
            >
              <Ionicons name="football-outline" size={28} color={themeColor} />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>Gerir Esportes</Text>
                <Text style={styles.settingsCardSubtitle}>
                  Adicione ou remova outras modalidades
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </Pressable>

            <Pressable
              style={styles.settingsLinkCard}
              onPress={() => router.push("/configurar-home")}
            >
              <Ionicons name="trophy-outline" size={28} color={themeColor} />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>Configurar Metas</Text>
                <Text style={styles.settingsCardSubtitle}>
                  Defina as metas que aparecem na home
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </Pressable>

            <Pressable
              style={styles.settingsLinkCard}
              onPress={() => router.push("/planejar-semana")}
            >
              <Ionicons name="calendar" size={28} color={themeColor} />
              <View style={styles.settingsCardTextContainer}>
                <Text style={styles.settingsCardTitle}>Planejar Semana</Text>
                <Text style={styles.settingsCardSubtitle}>
                  Organize seus treinos para a semana
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="gray" />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },

  internalTabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: "#eef0f4",
    borderRadius: 14,
    padding: 4,
  },
  internalTabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  internalTabButtonActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  internalTabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  internalTabTextActive: {
    color: "#5a4fcf",
    fontWeight: "700",
  },

  activityContainer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  activitySelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  activitySelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "white",
  },
  activitySelectorText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
  },
  activityDistanceEmptyCard: {
    backgroundColor: "#fff7f0",
    borderWidth: 1,
    borderColor: "#ffd9bf",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  activityDistanceEmptyText: {
    color: "#a65a1f",
    fontSize: 13,
    fontWeight: "600",
  },
  activityPeriodRow: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#eef0f4",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  activityPeriodButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  activityPeriodButtonActive: {
    backgroundColor: "white",
  },
  activityPeriodText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },
  activityPeriodTextActive: {
    color: "#5a4fcf",
  },
  activityWeekTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#222",
    marginBottom: 12,
  },
  activityWeekStatsRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  activityWeekStatItem: {
    flex: 1,
  },
  activityWeekStatLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },
  activityWeekStatValue: {
    fontSize: 28,
    color: "#222",
    fontWeight: "800",
  },
  activityChartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  activityChartTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginBottom: 12,
  },
  activityLineChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f9fb",
    paddingTop: 6,
    paddingRight: 8,
  },
  activityLineChart: {
    borderRadius: 16,
    marginLeft: -12,
  },
  activityFooterText: {
    marginTop: 12,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  activitySummaryCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  activitySummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  activitySummaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  activitySummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  activitySummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  activitySummaryItem: {
    width: "50%",
  },
  activitySummaryLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },
  activitySummaryValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "700",
  },

  settingsContainer: {
    paddingBottom: 28,
  },
  settingsSectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "gray",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  settingsLinkCard: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  settingsCardTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  settingsCardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  settingsCardSubtitle: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
  settingsActionButton: {
    backgroundColor: "#5a4fcf",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settingsActionButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  settingsAccountCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#34C759",
  },
  cloudCard: {
    backgroundColor: "#f0f8ff",
    borderColor: "#b3d9ff",
    borderWidth: 1,
    borderLeftWidth: 5,
    borderLeftColor: "#007AFF",
    minHeight: 120,
  },
  settingsLogoutButton: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffdddd",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settingsLogoutButtonText: {
    color: "#ff3b30",
    fontWeight: "700",
    fontSize: 13,
  },

  // Empty State
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    marginVertical: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  benefitsList: {
    width: "100%",
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#f8f9fa",
    marginBottom: 12,
    borderRadius: 12,
  },
  benefitText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    fontWeight: "500",
  },
  createProfileButton: {
    backgroundColor: "#5a4fcf",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#5a4fcf",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createProfileText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Profile Header
  profileHeader: {
    backgroundColor: "white",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatarContainer: {
    marginBottom: 15,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  profileName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  profileInfo: {
    fontSize: 16,
    color: "#666",
  },

  // Quick Stats
  quickStatsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 8,
  },
  quickStatLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  quickStatSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  // Progress Section
  progressSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  progressCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
  },
  progressIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
  },
  progressDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#e9ecef",
    marginHorizontal: 20,
  },
  balanceContainer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Goal Progress
  goalCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalProgress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  goalProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginRight: 15,
  },
  goalProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    minWidth: 50,
    textAlign: "right",
  },
  goalDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  goalDetailItem: {
    alignItems: "center",
  },
  goalDetailValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  goalDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  goalStatus: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },

  // ✅ NOVOS ESTILOS
  goalMetaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  goalMetaItem: {
    flex: 1,
    alignItems: "center",
  },
  goalMetaLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  goalMetaValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  goalMetaArrow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  goalProgressBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  goalProgressPercent: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 12,
    minWidth: 45,
    textAlign: "right",
  },
  goalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  goalInfoItem: {
    alignItems: "center",
    flex: 1,
  },
  goalInfoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  goalInfoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  // Stats Grid (TMB, TDEE)
  statsGridContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statGridCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statGridIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statGridLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  statGridValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  statGridUnit: {
    fontSize: 11,
    color: "#999",
    fontWeight: "400",
  },
  statGridDescription: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },

  // Métricas Info
  metricsInfoContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f0f4ff",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#5a4fcf",
    gap: 10,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: "#333",
    flex: 1,
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: "700",
    color: "#5a4fcf",
  },

  // Body Composition
  bodyCompCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bodyCompItem: {
    marginBottom: 20,
  },
  bodyCompBar: {
    height: 12,
    backgroundColor: "#e9ecef",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  bodyCompFill: {
    height: "100%",
    borderRadius: 6,
  },
  bodyCompLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bodyCompLabelText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  bodyCompLabelValue: {
    fontSize: 14,
    fontWeight: "bold",
  },

  // Legacy styles (manter compatibilidade)
  header: { marginBottom: 30, alignItems: "center", paddingTop: 20 },
  greeting: { fontSize: 32, fontWeight: "bold", color: "#333" },
  subHeader: { fontSize: 16, color: "gray", marginTop: 5 },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  cardContent: { flexDirection: "row", justifyContent: "space-around" },
  infoValue: { fontSize: 24, fontWeight: "bold", marginBottom: 2 },
  infoLabel: { fontSize: 14, color: "gray", textAlign: "center", marginTop: 5 },
  infoClassification: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  netBalanceContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  netBalanceValue: { fontSize: 32, fontWeight: "bold", color: "#5a4fcf" },
  cardSubtext: {
    fontSize: 14,
    color: "gray",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  accessCard: {
    backgroundColor: "#fff7f0",
    borderColor: "#ffcc99",
    borderWidth: 1,
  },
});
