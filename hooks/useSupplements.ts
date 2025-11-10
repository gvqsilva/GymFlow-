// hooks/useSupplements.ts

import { ToastPresets } from '../utils/toastUtils';
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
        data: supplements = INITIAL_SUPPLEMENTS_DATA,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync
    } = useFirebaseStorage<Supplement[]>(
        SUPPLEMENTS_STORAGE_KEY,
        'supplements',
        INITIAL_SUPPLEMENTS_DATA
    );

    const addSupplement = async (supplement: Omit<Supplement, 'id'>) => {
        const newSupplement: Supplement = { 
            ...supplement, 
            id: `supp_${Date.now()}`, 
            showOnHome: supplement.showOnHome ?? true 
        };
        const currentSupplements = supplements || INITIAL_SUPPLEMENTS_DATA;
        const updatedSupplements = [...currentSupplements, newSupplement];
        await saveData(updatedSupplements);
        
        ToastPresets.success('Suplemento adicionado!', 'Suplemento adicionado com sucesso!');
    };

    const updateSupplement = async (updatedSupplement: Supplement) => {
        const currentSupplements = supplements || INITIAL_SUPPLEMENTS_DATA;
        const updatedSupplements = currentSupplements.map((s: Supplement) => 
            s.id === updatedSupplement.id ? updatedSupplement : s
        );
        await saveData(updatedSupplements);
    };

    const deleteSupplement = async (supplementId: string) => {
        const currentSupplements = supplements || INITIAL_SUPPLEMENTS_DATA;
        const supplementName = currentSupplements.find(s => s.id === supplementId)?.name || 'Suplemento';
        const updatedSupplements = currentSupplements.filter((s: Supplement) => s.id !== supplementId);
        await saveData(updatedSupplements);
        
        ToastPresets.info('Suplemento removido', `${supplementName} foi excluído da lista.`);
    };

    const refreshSupplements = async () => {
        // Force sync with Firebase if available
        // This function is called by components that need to manually refresh data
    };

    return { 
        supplements, 
        isLoading, 
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        forceSync: forcSync,
        addSupplement, 
        updateSupplement, 
        deleteSupplement,
        refreshSupplements,
    };
}