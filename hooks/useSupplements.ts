// hooks/useSupplements.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

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
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSupplements = useCallback(async () => {
        setIsLoading(true);
        try {
            const storedData = await AsyncStorage.getItem(SUPPLEMENTS_STORAGE_KEY);
            if (storedData) {
                // Normalize older entries that may not have `showOnHome`
                const parsed: Supplement[] = JSON.parse(storedData);
                const normalized = parsed.map(s => ({ showOnHome: s.showOnHome ?? true, ...s }));
                setSupplements(normalized);
                // Persist normalized shape so other parts of the app can rely on the field
                await AsyncStorage.setItem(SUPPLEMENTS_STORAGE_KEY, JSON.stringify(normalized));
            } else {
                setSupplements(INITIAL_SUPPLEMENTS_DATA);
                await AsyncStorage.setItem(SUPPLEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_SUPPLEMENTS_DATA));
            }
        } catch (e) {
            console.error("Falha ao carregar os suplementos.", e);
            setSupplements(INITIAL_SUPPLEMENTS_DATA);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSupplements();
    }, [loadSupplements]);

    const saveSupplements = async (newSupplements: Supplement[]) => {
        try {
            await AsyncStorage.setItem(SUPPLEMENTS_STORAGE_KEY, JSON.stringify(newSupplements));
            setSupplements(newSupplements);
        } catch (e) {
            console.error("Falha ao guardar os suplementos.", e);
        }
    };

    const addSupplement = async (supplement: Omit<Supplement, 'id'>) => {
        const newSupplement: Supplement = { ...supplement, id: `supp_${Date.now()}`, showOnHome: supplement.showOnHome ?? true };
        const updatedSupplements = [...supplements, newSupplement];
        await saveSupplements(updatedSupplements);
    };

    const updateSupplement = async (updatedSupplement: Supplement) => {
        const updatedSupplements = supplements.map(s => s.id === updatedSupplement.id ? updatedSupplement : s);
        await saveSupplements(updatedSupplements);
    };

    const deleteSupplement = async (supplementId: string) => {
        const updatedSupplements = supplements.filter(s => s.id !== supplementId);
        await saveSupplements(updatedSupplements);
    };

    return { supplements, isLoading, addSupplement, updateSupplement, deleteSupplement, refreshSupplements: loadSupplements };
}