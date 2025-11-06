// hooks/useSupplements.ts

import { useFirebaseStorage } from './useFirebaseStorage';

export type TrackingType = 'daily_check' | 'counter';

export interface Supplement {
    id: string;
    name: string;
    dose: number;
    unit: string; // ex: 'g', 'mg', 'scoop', 'cápsula'
    trackingType: TrackingType;
    showOnHome?: boolean;
}

const SUPPLEMENTS_STORAGE_KEY = 'user_supplements_list';

// Dados iniciais para o utilizador começar
const INITIAL_SUPPLEMENTS_DATA: Supplement[] = [
    { id: 'supp_creatine', name: 'Creatina', dose: 6, unit: 'g', trackingType: 'daily_check', showOnHome: true },
    { id: 'supp_whey', name: 'Whey Protein', dose: 30, unit: 'g', trackingType: 'counter', showOnHome: true },
];

export function useSupplements() {
    const {
        data: supplements,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync: forceSync
    } = useFirebaseStorage<Supplement[]>(
        SUPPLEMENTS_STORAGE_KEY,
        'supplements',
        INITIAL_SUPPLEMENTS_DATA,
        { enableRealtime: true, syncOnMount: true }
    );

    const addSupplement = async (supplement: Omit<Supplement, 'id'>) => {
        const newSupplement: Supplement = { ...supplement, id: `supp_${Date.now()}`, showOnHome: supplement.showOnHome ?? true };
        const updatedSupplements = [...supplements, newSupplement];
        await saveData(updatedSupplements);
    };

    const updateSupplement = async (updatedSupplement: Supplement) => {
        const updatedSupplements = supplements.map(s => s.id === updatedSupplement.id ? updatedSupplement : s);
        await saveData(updatedSupplements);
    };

    const deleteSupplement = async (supplementId: string) => {
        const updatedSupplements = supplements.filter(s => s.id !== supplementId);
        await saveData(updatedSupplements);
    };

    return { 
        supplements, 
        isLoading, 
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        addSupplement, 
        updateSupplement, 
        deleteSupplement, 
        refreshSupplements: forceSync,
        forceSync 
    };
}