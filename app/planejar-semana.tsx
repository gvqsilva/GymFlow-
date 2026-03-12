import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSportsContext } from "../context/SportsProvider";
import { Period, useWeeklyPlan } from "../hooks/useWeeklyPlan";
import { useWorkouts } from "../hooks/useWorkouts";

const themeColor = "#5a4fcf";

export default function PlanarSemanaScreen() {
  const {
    weeklyPlan,
    addActivityToDay,
    removeActivityFromDay,
    clearDay,
    clearWeek,
    periodLabels,
    daysOfWeek,
    isLoading,
  } = useWeeklyPlan();

  const { workouts } = useWorkouts();
  const { sports } = useSportsContext();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [activityNotes, setActivityNotes] = useState("");

  // Garantir que weeklyPlan seja um array
  const validWeeklyPlan = Array.isArray(weeklyPlan) ? weeklyPlan : [];

  // Lista de atividades disponíveis
  const availableActivities = [
    ...Object.entries(workouts || {}).map(([id, workout]) => ({
      id,
      name: workout.name,
      emoji: workout.emoji || "💪",
      type: "workout" as const,
      icon: "barbell-outline" as const,
    })),
    ...sports.map((sport) => ({
      id: sport.id,
      name: sport.name,
      emoji: sport.emoji || "⭐",
      type: "sport" as const,
      icon: "football-outline" as const,
    })),
  ];

  const handleAddActivity = async (
    activity: (typeof availableActivities)[0],
  ) => {
    if (selectedDay === null || selectedPeriod === null) return;

    await addActivityToDay(
      selectedDay,
      selectedPeriod,
      activity.id,
      activity.name,
      activityNotes,
      activity.emoji,
    );

    Toast.show({
      type: "success",
      text1: "✅ Adicionado",
      text2: `${activity.name} agendado`,
    });

    // Limpar estados após adicionar
    setShowActivityPicker(false);
    setActivityNotes("");
    setSelectedDay(null);
    setSelectedPeriod(null);
  };

  const handleRemoveActivity = async (
    dayIndex: number,
    period: Period,
    activityId: string,
  ) => {
    await removeActivityFromDay(dayIndex, period, activityId);
    Toast.show({
      type: "success",
      text1: "🗑️ Removido",
    });
  };

  const handleClearDay = (dayIndex: number, dayName: string) => {
    Alert.alert("Limpar Dia", `Remover todas as atividades de ${dayName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: async () => {
          await clearDay(dayIndex);
          Toast.show({
            type: "success",
            text1: "🗑️ Dia limpo",
          });
        },
      },
    ]);
  };

  const handleClearWeek = () => {
    Alert.alert("Limpar Semana", `Remover todas as atividades da semana?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: async () => {
          await clearWeek();
          // Fechar modal se estiver aberto
          setShowActivityPicker(false);
          setActivityNotes("");
          setSelectedDay(null);
          setSelectedPeriod(null);
          Toast.show({
            type: "success",
            text1: "🗑️ Semana limpa",
          });
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Planejar Semana",
          headerStyle: { backgroundColor: themeColor },
          headerTintColor: "#fff",
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Plano Semanal</Text>

        <View style={styles.headerActions}>
          <Pressable onPress={handleClearWeek} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Limpar Tudo</Text>
          </Pressable>
        </View>
      </View>

      {/* Lista de dias */}
      <ScrollView style={styles.content}>
        {validWeeklyPlan.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>
              Nenhum plano encontrado. Recarregue o aplicativo.
            </Text>
          </View>
        ) : (
          validWeeklyPlan.map((dayPlan, dayIndex) => (
            <View key={dayIndex} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{dayPlan.day}</Text>
                <Pressable
                  onPress={() => handleClearDay(dayIndex, dayPlan.day)}
                  style={styles.clearDayButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </Pressable>
              </View>

              {/* Períodos do dia */}
              {(["manha", "tarde", "noite"] as Period[]).map((period) => (
                <View key={period} style={styles.periodSection}>
                  <View style={styles.periodHeader}>
                    <Text style={styles.periodLabel}>
                      {periodLabels[period]}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSelectedDay(dayIndex);
                        setSelectedPeriod(period);
                        setShowActivityPicker(true);
                      }}
                      style={styles.addButton}
                    >
                      <Ionicons
                        name="add-circle"
                        size={24}
                        color={themeColor}
                      />
                    </Pressable>
                  </View>

                  {/* Lista de atividades */}
                  {dayPlan.periods[period].length === 0 ? (
                    <Text style={styles.emptyText}>Nenhuma atividade</Text>
                  ) : (
                    dayPlan.periods[period].map((activity) => (
                      <View key={activity.id} style={styles.activityItem}>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityName}>
                            {activity.name}
                          </Text>
                          {activity.notes && (
                            <Text style={styles.activityNotes}>
                              {activity.notes}
                            </Text>
                          )}
                        </View>
                        <Pressable
                          onPress={() =>
                            handleRemoveActivity(dayIndex, period, activity.id)
                          }
                        >
                          <Ionicons name="trash" size={20} color="#ff4444" />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de seleção de atividade */}
      {showActivityPicker && (
        <Pressable
          style={styles.modal}
          onPress={() => {
            setShowActivityPicker(false);
            setActivityNotes("");
            setSelectedDay(null);
            setSelectedPeriod(null);
          }}
        >
          <Pressable
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Atividade</Text>
              <Pressable onPress={() => setShowActivityPicker(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedDay !== null && `${daysOfWeek[selectedDay]} - `}
              {selectedPeriod && periodLabels[selectedPeriod]}
            </Text>

            {/* Campo de notas */}
            <TextInput
              style={styles.notesInput}
              placeholder="Observações (opcional)"
              value={activityNotes}
              onChangeText={setActivityNotes}
              placeholderTextColor="#999"
            />

            {/* Lista de atividades */}
            <FlatList
              data={availableActivities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAddActivity(item)}
                  style={styles.activityOption}
                >
                  <Ionicons name={item.icon} size={24} color={themeColor} />
                  <Text style={styles.activityOptionText}>{item.name}</Text>
                  <Text style={styles.activityType}>
                    {item.type === "workout" ? "Treino" : "Esporte"}
                  </Text>
                </Pressable>
              )}
              style={styles.activityList}
            />
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: themeColor,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  dayCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  clearDayButton: {
    padding: 4,
  },
  periodSection: {
    marginTop: 12,
  },
  periodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  addButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginLeft: 8,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  activityNotes: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#666",
    padding: 16,
    paddingTop: 12,
    fontWeight: "500",
  },
  notesInput: {
    backgroundColor: "#f5f5f5",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: "#333",
  },
  activityList: {
    maxHeight: 400,
  },
  activityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  activityOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  activityType: {
    fontSize: 12,
    color: "#999",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
