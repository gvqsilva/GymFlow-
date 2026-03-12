// hooks/useWorkouts.ts

import { Exercise, WORKOUT_DATA, Workout } from "../constants/workoutData";
import { ToastPresets } from "../utils/toastUtils";
import { migrateWorkouts } from "../utils/workoutUtils";
import { useFirebaseStorage } from "./useFirebaseStorage";

const WORKOUTS_STORAGE_KEY = "user_workouts_storage";

export function useWorkouts() {
  const {
    data: workouts = WORKOUT_DATA,
    isLoading,
    isSyncing,
    lastSyncTime,
    isAuthenticated,
    saveData,
    reloadData,
    forcSync,
  } = useFirebaseStorage<Record<string, Workout>>(
    WORKOUTS_STORAGE_KEY,
    "workouts",
    WORKOUT_DATA,
  );

  const updateWorkout = async (workoutId: string, updatedWorkout: Workout) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    // Antes de salvar, garantir migração
    const { migrated } = migrateWorkouts(currentWorkouts);
    const newWorkouts = {
      ...migrated,
      [workoutId]: updatedWorkout,
    };
    await saveData(newWorkouts);
  };

  const addExerciseToWorkout = async (
    workoutId: string,
    exercise: Exercise,
  ) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    const currentWorkout = currentWorkouts[workoutId];

    if (!currentWorkout) {
      throw new Error("Workout não encontrado");
    }

    const updatedExercises = [...currentWorkout.exercises, exercise];
    const updatedWorkout: Workout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    await updateWorkout(workoutId, updatedWorkout);

    ToastPresets.exerciseAdded(exercise.name);
  };

  const removeExerciseFromWorkout = async (
    workoutId: string,
    exerciseIndex: number,
  ) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    const currentWorkout = currentWorkouts[workoutId];

    if (!currentWorkout) {
      throw new Error("Workout não encontrado");
    }

    const updatedExercises = currentWorkout.exercises.filter(
      (_, index) => index !== exerciseIndex,
    );
    const updatedWorkout: Workout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    await updateWorkout(workoutId, updatedWorkout);
  };

  const createNewWorkout = async (newWorkout: Workout) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    const workoutId = Date.now().toString(); // Simple ID generation
    const newWorkouts = {
      ...currentWorkouts,
      [workoutId]: {
        ...newWorkout,
        id: workoutId,
      },
    };

    await saveData(newWorkouts);

    ToastPresets.workoutCreated(newWorkout.name);

    return workoutId;
  };

  const deleteWorkout = async (workoutId: string) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    const resolvedWorkoutKey = currentWorkouts[workoutId]
      ? workoutId
      : Object.keys(currentWorkouts).find(
          (key) => currentWorkouts[key]?.id === workoutId,
        );

    if (!resolvedWorkoutKey) {
      ToastPresets.error("Erro ao remover treino", "Ficha não encontrada.");
      return;
    }

    const workoutName = currentWorkouts[resolvedWorkoutKey]?.name || "Treino";
    const newWorkouts = { ...currentWorkouts };
    delete newWorkouts[resolvedWorkoutKey];
    await saveData(newWorkouts);

    ToastPresets.info("Treino removido", `${workoutName} foi excluído.`);
  };

  const addWorkout = async (newWorkout: Omit<Workout, "id">) => {
    return await createNewWorkout(newWorkout as Workout);
  };

  const addExercise = async (workoutId: string, exercise: Exercise) => {
    return await addExerciseToWorkout(workoutId, exercise);
  };

  const updateExercise = async (
    workoutId: string,
    exerciseIndex: number,
    updatedExercise: Exercise,
  ) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    const currentWorkout = currentWorkouts[workoutId];

    if (!currentWorkout) {
      throw new Error("Workout não encontrado");
    }

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;

    const updatedWorkout: Workout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    await updateWorkout(workoutId, updatedWorkout);
  };

  const deleteExercise = async (workoutId: string, exerciseIndex: number) => {
    return await removeExerciseFromWorkout(workoutId, exerciseIndex);
  };

  const reorderExercises = async (workoutId: string, exercises: Exercise[]) => {
    const currentWorkouts = workouts || WORKOUT_DATA;
    const currentWorkout = currentWorkouts[workoutId];

    if (!currentWorkout) {
      throw new Error("Workout não encontrado");
    }

    const updatedWorkout: Workout = {
      ...currentWorkout,
      exercises: exercises,
    };

    await updateWorkout(workoutId, updatedWorkout);
  };

  const refreshWorkouts = async () => {
    await reloadData();
    await forcSync();
  };

  // Migração automática dos workouts carregados (em memória)
  const { migrated: migratedWorkouts, changed } = migrateWorkouts(
    workouts || WORKOUT_DATA,
  );
  // Se houve mudança estrutural (IDs legados), poderia opcionalmente disparar um save
  if (changed && !isLoading) {
    // Fire and forget - não bloquear hook
    saveData(migratedWorkouts).catch(() => {});
  }

  return {
    workouts: migratedWorkouts,
    isLoading,
    isSyncing,
    lastSyncTime,
    isAuthenticated,
    forceSync: forcSync,
    updateWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    createNewWorkout,
    deleteWorkout,
    addWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
    reorderExercises,
    refreshWorkouts,
  };
}
