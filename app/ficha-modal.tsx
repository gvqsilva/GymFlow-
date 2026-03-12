// app/ficha-modal.tsx

import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { ExerciseSelector } from "../components/ExerciseSelectorEnhanced";
import { WorkoutExerciseItem } from "../components/WorkoutExerciseItem";
import { CatalogExercise } from "../constants/exercisesData";
import { Exercise } from "../constants/workoutData";
import { useWorkoutExercises } from "../hooks/useWorkoutExercises";
import { useWorkouts } from "../hooks/useWorkouts";

const themeColor = "#5a4fcf";

export default function FichaModal() {
  const { addWorkout } = useWorkouts();
  const router = useRouter();

  const [name, setName] = useState("");
  const [groups, setGroups] = useState("");
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const {
    exercises,
    addExercise,
    removeExercise,
    updateExercise,
    getSelectedIds,
  } = useWorkoutExercises();

  const handleSelectExercise = (exercise: CatalogExercise) => {
    addExercise(exercise);
    setShowExerciseSelector(false);
  };

  const handleSave = async () => {
    if (!name || !groups) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um exercício à ficha.");
      return;
    }

    // Criar a ficha com os exercícios selecionados
    // Converter WorkoutExercise para o formato Exercise esperado pelo addWorkout
    const workoutExercises: Exercise[] = exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      series: exercise.series,
      reps: exercise.reps,
      obs: exercise.obs,
      // gifUrl removido - será obtido automaticamente pelo ID
    }));

    const newWorkout = {
      name,
      groups,
      exercises: workoutExercises,
    };

    await addWorkout(newWorkout);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Nova Ficha de Treino" }} />

      <Text style={styles.label}>Nome da Ficha</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Treino D"
      />

      <Text style={styles.label}>Grupos Musculares</Text>
      <TextInput
        style={styles.input}
        value={groups}
        onChangeText={setGroups}
        placeholder="Ex: Cardio e Abdômen"
      />

      <View style={styles.exercisesSection}>
        <View style={styles.exercisesHeader}>
          <Text style={styles.exercisesTitle}>
            Exercícios ({exercises.length})
          </Text>
          <Pressable
            style={styles.addExerciseButton}
            onPress={() => setShowExerciseSelector(true)}
          >
            <Text style={styles.addExerciseText}>+ Adicionar </Text>
          </Pressable>
        </View>

        {exercises.length > 0 ? (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <WorkoutExerciseItem
                exercise={item}
                onUpdate={updateExercise}
                onRemove={removeExercise}
                canEdit={true}
              />
            )}
            style={styles.exercisesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyExercises}>
            <Text style={styles.emptyExercisesText}>
              Nenhum exercício adicionado
            </Text>
            <Text style={styles.emptyExercisesSubtext}>
              Toque em &quot;Adicionar&quot; para incluir exercícios
            </Text>
          </View>
        )}
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Salvar Ficha</Text>
      </Pressable>

      <ExerciseSelector
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleSelectExercise}
        selectedExercises={getSelectedIds()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f2f5" },
  label: { fontSize: 16, marginBottom: 5, color: "gray" },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  exercisesSection: {
    flex: 1,
    marginTop: 10,
  },
  exercisesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addExerciseButton: {
    backgroundColor: themeColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addExerciseText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  exercisesList: {
    flex: 1,
  },
  emptyExercises: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
  },
  emptyExercisesText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  emptyExercisesSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: themeColor,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
