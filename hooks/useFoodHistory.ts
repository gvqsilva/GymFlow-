// hooks/useFoodHistory.ts

import { useFirebaseStorage } from './useFirebaseStorage';

export interface FoodHistoryEntry {
    id: string;
    date: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: string;
}

const FOOD_HISTORY_STORAGE_KEY = 'foodHistory';

// Dados iniciais vazios
const INITIAL_FOOD_HISTORY_DATA: FoodHistoryEntry[] = [];

export function useFoodHistory() {
    const {
        data: foodHistory = INITIAL_FOOD_HISTORY_DATA,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync
    } = useFirebaseStorage<FoodHistoryEntry[]>(
        FOOD_HISTORY_STORAGE_KEY,
        'foodHistory',
        INITIAL_FOOD_HISTORY_DATA
    );

    const addFoodEntry = async (entry: Omit<FoodHistoryEntry, 'id'>) => {
        const newEntry: FoodHistoryEntry = { 
            ...entry, 
            id: `food_${Date.now()}` 
        };
        const currentHistory = foodHistory || INITIAL_FOOD_HISTORY_DATA;
        const updatedHistory = [...currentHistory, newEntry];
        await saveData(updatedHistory);
    };

    const updateFoodEntry = async (updatedEntry: FoodHistoryEntry) => {
        const currentHistory = foodHistory || INITIAL_FOOD_HISTORY_DATA;
        const updatedHistory = currentHistory.map((entry: FoodHistoryEntry) => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        );
        await saveData(updatedHistory);
    };

    const deleteFoodEntry = async (entryId: string) => {
        const currentHistory = foodHistory || INITIAL_FOOD_HISTORY_DATA;
        const updatedHistory = currentHistory.filter((entry: FoodHistoryEntry) => entry.id !== entryId);
        await saveData(updatedHistory);
    };

    const getFoodEntriesByDate = (date: string): FoodHistoryEntry[] => {
        const currentHistory = foodHistory || INITIAL_FOOD_HISTORY_DATA;
        return currentHistory.filter((entry: FoodHistoryEntry) => entry.date === date);
    };

    const clearHistory = async () => {
        await saveData([]);
    };

    return { 
        foodHistory, 
        isLoading, 
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        forceSync: forcSync,
        addFoodEntry, 
        updateFoodEntry, 
        deleteFoodEntry,
        getFoodEntriesByDate,
        clearHistory,
    };
}