import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useWeeklyPlan } from "../hooks/useWeeklyPlan";
import {
  generateRunningPlan,
  runningPlanToWeeklyPlanActivities,
  RunningGoal,
  RunningLevel,
  RunningSessionType,
} from "../utils/runningPlanRules";

const themeColor = "#5a4fcf";

const GOAL_OPTIONS: Array<{ label: string; value: RunningGoal }> = [
  { label: "5K", value: "5k" },
  { label: "10K", value: "10k" },
  { label: "Resistência", value: "resistencia" },
  { label: "Velocidade", value: "velocidade" },
  { label: "Perda de peso", value: "perda_peso" },
  { label: "Meia", value: "meia_maratona" },
  { label: "Maratona", value: "maratona" },
];

const LEVEL_OPTIONS: Array<{ label: string; value: RunningLevel }> = [
  { label: "Iniciante", value: "iniciante" },
  { label: "Intermediário", value: "intermediario" },
  { label: "Avançado", value: "avancado" },
];

const PREF_OPTIONS: Array<{ label: string; value: RunningSessionType }> = [
  { label: "Longão", value: "longao" },
  { label: "Intervalado", value: "intervalado" },
  { label: "Fartlek", value: "fartlek" },
  { label: "Subida", value: "subida" },
  { label: "Regenerativo", value: "regenerativo" },
];

export default function ModoTreinadorScreen() {
  const { clearWeek, addActivityToDay, daysOfWeek } = useWeeklyPlan();

  const [goal, setGoal] = useState<RunningGoal>("5k");
  const [level, setLevel] = useState<RunningLevel>("iniciante");
  const [weeklyFrequency, setWeeklyFrequency] = useState("3");
  const [minutesPerWorkout, setMinutesPerWorkout] = useState("35");
  const [preferredTypes, setPreferredTypes] = useState<RunningSessionType[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<ReturnType<
    typeof generateRunningPlan
  > | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const canGenerate = useMemo(() => {
    return Number(weeklyFrequency) > 0 && Number(minutesPerWorkout) > 0;
  }, [weeklyFrequency, minutesPerWorkout]);

  const togglePreferredType = (value: RunningSessionType) => {
    setPreferredTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const handleGeneratePlan = () => {
    if (!canGenerate) {
      Toast.show({
        type: "info",
        text1: "Preencha frequência e duração",
      });
      return;
    }

    const plan = generateRunningPlan({
      goal,
      level,
      weeklyFrequency: Number(weeklyFrequency),
      availableMinutesPerWorkout: Number(minutesPerWorkout),
      preferredSessionTypes: preferredTypes,
      weekNumber: 1,
    });

    setGeneratedPlan(plan);
    Toast.show({
      type: "success",
      text1: "Plano gerado com sucesso",
      text2: `${plan.sessions.length} treinos definidos`,
    });
  };

  const handleApplyPlan = async () => {
    if (!generatedPlan) return;

    try {
      setIsApplying(true);
      await clearWeek();

      const activities = runningPlanToWeeklyPlanActivities(generatedPlan);
      for (const activity of activities) {
        const dayIndex = daysOfWeek.indexOf(activity.day);
        if (dayIndex < 0) continue;

        await addActivityToDay(
          dayIndex,
          activity.period,
          activity.id,
          activity.name,
          activity.notes,
          activity.emoji,
        );
      }

      Toast.show({
        type: "success",
        text1: "Plano aplicado na semana",
        text2: "Confira os treinos no Planejar Semana",
      });
    } catch (error) {
      console.error("Erro ao aplicar plano do treinador:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao aplicar plano",
        text2: "Tente novamente",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Modo Treinador",
          headerStyle: { backgroundColor: themeColor },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Objetivo</Text>
        <View style={styles.chipRow}>
          {GOAL_OPTIONS.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.chip, goal === item.value && styles.chipActive]}
              onPress={() => setGoal(item.value)}
            >
              <Text style={[styles.chipText, goal === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Nível</Text>
        <View style={styles.chipRow}>
          {LEVEL_OPTIONS.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.chip, level === item.value && styles.chipActive]}
              onPress={() => setLevel(item.value)}
            >
              <Text style={[styles.chipText, level === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inlineInputs}>
          <View style={styles.inputBlock}>
            <Text style={styles.sectionTitle}>Dias/semana</Text>
            <TextInput
              value={weeklyFrequency}
              onChangeText={setWeeklyFrequency}
              keyboardType="numeric"
              style={styles.input}
              placeholder="3"
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.sectionTitle}>Min/treino</Text>
            <TextInput
              value={minutesPerWorkout}
              onChangeText={setMinutesPerWorkout}
              keyboardType="numeric"
              style={styles.input}
              placeholder="35"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferências (opcional)</Text>
        <View style={styles.chipRow}>
          {PREF_OPTIONS.map((item) => {
            const selected = preferredTypes.includes(item.value);
            return (
              <Pressable
                key={item.value}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => togglePreferredType(item.value)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.primaryButton} onPress={handleGeneratePlan}>
          <Ionicons name="sparkles-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Gerar Plano</Text>
        </Pressable>

        {generatedPlan && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Treinos Gerados</Text>
            {generatedPlan.sessions.map((session, idx) => (
              <View key={`${session.day}-${idx}`} style={styles.sessionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>
                    {session.day} • {session.type.replace("_", " ")}
                  </Text>
                  <Text style={styles.sessionSubtitle}>
                    {session.totalMin} min • ~{session.estimatedDistanceKm} km • {session.intensity}
                  </Text>
                </View>
              </View>
            ))}

            <Pressable
              style={[styles.applyButton, isApplying && { opacity: 0.6 }]}
              onPress={handleApplyPlan}
              disabled={isApplying}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={themeColor} />
              <Text style={styles.applyButtonText}>
                {isApplying ? "Aplicando..." : "Aplicar no Planejar Semana"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 8 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {
    borderColor: themeColor,
    backgroundColor: "#efeefe",
  },
  chipText: { color: "#555", fontWeight: "600" },
  chipTextActive: { color: themeColor },
  inlineInputs: { flexDirection: "row", gap: 12, marginBottom: 10 },
  inputBlock: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: themeColor,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  resultsCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  resultsTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10 },
  sessionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  sessionTitle: { fontWeight: "700", color: "#333", textTransform: "capitalize" },
  sessionSubtitle: { color: "#666", marginTop: 2 },
  applyButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#cfc9ff",
    backgroundColor: "#f6f4ff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  applyButtonText: { color: themeColor, fontWeight: "700" },
});
