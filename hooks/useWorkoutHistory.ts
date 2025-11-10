// hooks/useWorkoutHistory.ts

import { useFirebaseStorage } from './useFirebaseStorage';

export interface WorkoutHistoryEntry {
    id: string;
    date: string;
    workoutId: string;
    workoutName: string;
    category: string; // ex: 'Musculação', 'Cardio', 'Esporte'
    duration: number; // em minutos
    calories?: number;
    exercises?: {
        exerciseId: string;
        exerciseName: string;
        setsCompleted: number;
        repsCompleted: string[];
        notes?: string;
    }[];
    notes?: string;
    type?: string; // ex: 'strength', 'cardio', 'flexibility'
}

const WORKOUT_HISTORY_STORAGE_KEY = 'workoutHistory';

// Dados iniciais vazios
const INITIAL_WORKOUT_HISTORY_DATA: WorkoutHistoryEntry[] = [];

export function useWorkoutHistory() {
    const {
        data: workoutHistory = INITIAL_WORKOUT_HISTORY_DATA,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync
    } = useFirebaseStorage<WorkoutHistoryEntry[]>(
        WORKOUT_HISTORY_STORAGE_KEY,
        'workoutHistory',
        INITIAL_WORKOUT_HISTORY_DATA
    );

    const addWorkoutEntry = async (entry: Omit<WorkoutHistoryEntry, 'id'>) => {
        const newEntry: WorkoutHistoryEntry = { 
            ...entry, 
            id: `workout_${Date.now()}` 
        };
        const currentHistory = workoutHistory || INITIAL_WORKOUT_HISTORY_DATA;
        const updatedHistory = [...currentHistory, newEntry];
        await saveData(updatedHistory);
    };

    const updateWorkoutEntry = async (updatedEntry: WorkoutHistoryEntry) => {
        const currentHistory = workoutHistory || INITIAL_WORKOUT_HISTORY_DATA;
        const updatedHistory = currentHistory.map((entry: WorkoutHistoryEntry) => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        );
        await saveData(updatedHistory);
    };

    const deleteWorkoutEntry = async (entryId: string) => {
        const currentHistory = workoutHistory || INITIAL_WORKOUT_HISTORY_DATA;
        const updatedHistory = currentHistory.filter((entry: WorkoutHistoryEntry) => entry.id !== entryId);
        await saveData(updatedHistory);
    };

    const getWorkoutEntriesByDate = (date: string): WorkoutHistoryEntry[] => {
        const currentHistory = workoutHistory || INITIAL_WORKOUT_HISTORY_DATA;
        return currentHistory.filter((entry: WorkoutHistoryEntry) => entry.date === date);
    };

    const getWorkoutEntriesByCategory = (category: string): WorkoutHistoryEntry[] => {
        const currentHistory = workoutHistory || INITIAL_WORKOUT_HISTORY_DATA;
        return currentHistory.filter((entry: WorkoutHistoryEntry) => entry.category === category);
    };

    const getWorkoutStats = () => {
        const currentHistory = workoutHistory || INITIAL_WORKOUT_HISTORY_DATA;
        const totalWorkouts = currentHistory.length;
        const totalDuration = currentHistory.reduce((sum, entry) => sum + entry.duration, 0);
        const totalCalories = currentHistory.reduce((sum, entry) => sum + (entry.calories || 0), 0);
        
        return {
            totalWorkouts,
            totalDuration,
            totalCalories,
            averageDuration: totalWorkouts > 0 ? totalDuration / totalWorkouts : 0
        };
    };

    const clearHistory = async () => {
        await saveData([]);
    };

    return { 
        workoutHistory, 
        isLoading, 
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        forceSync: forcSync,
        addWorkoutEntry, 
        updateWorkoutEntry, 
        deleteWorkoutEntry,
        getWorkoutEntriesByDate,
        getWorkoutEntriesByCategory,
        getWorkoutStats,
        clearHistory,
    };
}