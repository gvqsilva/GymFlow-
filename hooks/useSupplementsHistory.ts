// hooks/useSupplementsHistory.ts

import { useFirebaseStorage } from './useFirebaseStorage';

export interface SupplementHistoryEntry {
    supplementId: string;
    supplementName: string;
    date: string;
    taken: boolean;
    doseTaken?: number;
    timesTaken?: number;
    notes?: string;
}

export type SupplementsHistoryData = Record<string, SupplementHistoryEntry>;

const SUPPLEMENTS_HISTORY_STORAGE_KEY = 'supplementsHistory';

// Dados iniciais vazios
const INITIAL_SUPPLEMENTS_HISTORY_DATA: SupplementsHistoryData = {};

export function useSupplementsHistory() {
    const {
        data: supplementsHistory = INITIAL_SUPPLEMENTS_HISTORY_DATA,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync
    } = useFirebaseStorage<SupplementsHistoryData>(
        SUPPLEMENTS_HISTORY_STORAGE_KEY,
        'supplementsHistory',
        INITIAL_SUPPLEMENTS_HISTORY_DATA
    );

    const markSupplementTaken = async (supplementId: string, supplementName: string, date: string, doseTaken?: number) => {
        const entryKey = `${supplementId}_${date}`;
        const currentHistory = supplementsHistory || INITIAL_SUPPLEMENTS_HISTORY_DATA;
        
        const newEntry: SupplementHistoryEntry = {
            supplementId,
            supplementName,
            date,
            taken: true,
            doseTaken,
            timesTaken: (currentHistory[entryKey]?.timesTaken || 0) + 1
        };

        const updatedHistory = {
            ...currentHistory,
            [entryKey]: newEntry
        };
        
        await saveData(updatedHistory);
    };

    const markSupplementNotTaken = async (supplementId: string, supplementName: string, date: string) => {
        const entryKey = `${supplementId}_${date}`;
        const currentHistory = supplementsHistory || INITIAL_SUPPLEMENTS_HISTORY_DATA;
        
        const newEntry: SupplementHistoryEntry = {
            supplementId,
            supplementName,
            date,
            taken: false
        };

        const updatedHistory = {
            ...currentHistory,
            [entryKey]: newEntry
        };
        
        await saveData(updatedHistory);
    };

    const updateSupplementEntry = async (supplementId: string, date: string, updates: Partial<SupplementHistoryEntry>) => {
        const entryKey = `${supplementId}_${date}`;
        const currentHistory = supplementsHistory || INITIAL_SUPPLEMENTS_HISTORY_DATA;
        const currentEntry = currentHistory[entryKey];

        if (currentEntry) {
            const updatedEntry = { ...currentEntry, ...updates };
            const updatedHistory = {
                ...currentHistory,
                [entryKey]: updatedEntry
            };
            await saveData(updatedHistory);
        }
    };

    const getSupplementHistoryForDate = (date: string): SupplementHistoryEntry[] => {
        const currentHistory = supplementsHistory || INITIAL_SUPPLEMENTS_HISTORY_DATA;
        return Object.values(currentHistory).filter((entry: SupplementHistoryEntry) => entry.date === date);
    };

    const getSupplementStatus = (supplementId: string, date: string): SupplementHistoryEntry | null => {
        const entryKey = `${supplementId}_${date}`;
        const currentHistory = supplementsHistory || INITIAL_SUPPLEMENTS_HISTORY_DATA;
        return currentHistory[entryKey] || null;
    };

    const clearHistory = async () => {
        await saveData({});
    };

    return { 
        supplementsHistory, 
        isLoading, 
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        forceSync: forcSync,
        markSupplementTaken, 
        markSupplementNotTaken,
        updateSupplementEntry,
        getSupplementHistoryForDate,
        getSupplementStatus,
        clearHistory,
    };
}