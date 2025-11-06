// hooks/useWorkouts.ts

import { Exercise, WORKOUT_DATA, Workout } from '../constants/workoutData';
import { useFirebaseStorage } from './useFirebaseStorage';

const WORKOUTS_STORAGE_KEY = 'user_workouts_storage';

export function useWorkouts() {
    const {
        data: workouts,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync: forceSync
    } = useFirebaseStorage<Record<string, Workout>>(
        WORKOUTS_STORAGE_KEY,
        'workouts',
        WORKOUT_DATA,
        { enableRealtime: true, syncOnMount: true }
    );

    const addExercise = async (workoutId: string, newExercise: Exercise) => {
        const newWorkouts = { ...workouts };
        if (newWorkouts[workoutId]) {
            newWorkouts[workoutId].exercises.push(newExercise);
            await saveData(newWorkouts);
        }
    };

    const updateExercise = async (workoutId: string, updatedExercise: Exercise) => {
        const newWorkouts = { ...workouts };
        if (newWorkouts[workoutId]) {
            const index = newWorkouts[workoutId].exercises.findIndex(ex => ex.id === updatedExercise.id);
            if (index > -1) {
                newWorkouts[workoutId].exercises[index] = updatedExercise;
                await saveData(newWorkouts);
            }
        }
    };

    const deleteExercise = async (workoutId: string, exerciseId: string) => {
        const newWorkouts = { ...workouts };
        if (newWorkouts[workoutId]) {
            newWorkouts[workoutId].exercises = newWorkouts[workoutId].exercises.filter(ex => ex.id !== exerciseId);
            await saveData(newWorkouts);
        }
    };
    
    const reorderExercises = async (workoutId: string, reorderedExercises: Exercise[]) => {
        const newWorkouts = { ...workouts };
        if (newWorkouts[workoutId]) {
            newWorkouts[workoutId].exercises = reorderedExercises;
            await saveData(newWorkouts);
        }
    };

    // NOVA FUNÇÃO para adicionar uma ficha de treino
    const addWorkout = async (name: string, groups: string, exercises?: Exercise[]) => {
        const newWorkouts = { ...workouts };
        const newWorkoutId = `workout_${Date.now()}`;
        const newWorkout: Workout = {
            id: newWorkoutId,
            name: name,
            groups: groups,
            exercises: exercises || [],
        };
        newWorkouts[newWorkoutId] = newWorkout;
        await saveData(newWorkouts);
    };

    // NOVA FUNÇÃO para apagar uma ficha de treino
    const deleteWorkout = async (workoutId: string) => {
        const newWorkouts = { ...workouts };
        delete newWorkouts[workoutId];
        await saveData(newWorkouts);
    };

    return { 
        workouts, 
        isLoading, 
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        refreshWorkouts: forceSync, 
        addExercise, 
        updateExercise, 
        deleteExercise, 
        reorderExercises, 
        addWorkout, 
        deleteWorkout,
        forceSync 
    };
}

