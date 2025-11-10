// hooks/useFirebaseData.ts

import { useFoodHistory } from './useFoodHistory';
import { useSupplements } from './useSupplements';
import { useSupplementsHistory } from './useSupplementsHistory';
import { useUserConfig } from './useUserConfig';
import { useWorkoutHistory } from './useWorkoutHistory';
import { useWorkouts } from './useWorkouts';

/**
 * Hook centralizado que fornece acesso a todos os dados sincronizados com o Firebase
 * 
 * Este hook facilita o uso de todos os dados do app em um só lugar,
 * incluindo workouts, suplementos, históricos e configurações do usuário.
 */
export function useFirebaseData() {
    const workouts = useWorkouts();
    const supplements = useSupplements();
    const foodHistory = useFoodHistory();
    const supplementsHistory = useSupplementsHistory();
    const workoutHistory = useWorkoutHistory();
    const userConfig = useUserConfig();

    // Status geral de sincronização
    const isAnythingSyncing = 
        workouts.isSyncing || 
        supplements.isSyncing || 
        foodHistory.isSyncing || 
        supplementsHistory.isSyncing || 
        workoutHistory.isSyncing || 
        userConfig.isSyncing;

    const isAnythingLoading = 
        workouts.isLoading || 
        supplements.isLoading || 
        foodHistory.isLoading || 
        supplementsHistory.isLoading || 
        workoutHistory.isLoading || 
        userConfig.isLoading;

    const isAuthenticated = 
        workouts.isAuthenticated && 
        supplements.isAuthenticated && 
        foodHistory.isAuthenticated && 
        supplementsHistory.isAuthenticated && 
        workoutHistory.isAuthenticated && 
        userConfig.isAuthenticated;

    // Função para forçar sync de todos os dados
    const forceSync = async () => {
        await Promise.all([
            workouts.forceSync(),
            supplements.forceSync(),
            foodHistory.forceSync(),
            supplementsHistory.forceSync(),
            workoutHistory.forceSync(),
            userConfig.forceSync(),
        ]);
    };

    // Função para limpar todos os dados (útil para logout)
    const clearAllData = async () => {
        await Promise.all([
            foodHistory.clearHistory(),
            supplementsHistory.clearHistory(),
            workoutHistory.clearHistory(),
            userConfig.resetConfig(),
        ]);
    };

    return {
        // Hooks individuais
        workouts,
        supplements,
        foodHistory,
        supplementsHistory,
        workoutHistory,
        userConfig,
        
        // Status globais
        isAnythingSyncing,
        isAnythingLoading,
        isAuthenticated,
        
        // Ações globais
        forceSync,
        clearAllData,
    };
}

export default useFirebaseData;