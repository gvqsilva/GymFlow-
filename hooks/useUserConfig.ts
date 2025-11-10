// hooks/useUserConfig.ts

import { useFirebaseStorage } from './useFirebaseStorage';

export interface UserGoals {
    dailyCalories: number;
    weeklyWorkouts: number;
    weeklyActivities: number;
    dailyTime: number;
}

export interface VisibleMetrics {
    calories: boolean;
    activities: boolean;
    time: boolean;
}

export interface UserConfig {
    // Configurações pessoais
    name: string;
    age?: number;
    weight?: number; // em kg
    height?: number; // em cm
    gender?: 'male' | 'female' | 'other';
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    
    // Objetivos
    fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'maintain' | 'strength' | 'endurance';
    targetWeight?: number;
    dailyCalorieGoal?: number;
    weeklyWorkoutGoal?: number;
    
    // Preferências do app
    theme?: 'light' | 'dark' | 'auto';
    language?: 'pt' | 'en' | 'es';
    notifications?: {
        workoutReminders: boolean;
        supplementReminders: boolean;
        mealReminders: boolean;
        progressTracking: boolean;
    };
    
    // Configurações de unidades
    units?: {
        weight: 'kg' | 'lbs';
        height: 'cm' | 'ft';
        distance: 'km' | 'miles';
    };
    
    // Data de criação e última modificação
    createdAt?: string;
    updatedAt?: string;
    lastModified?: string;
    version?: string;

    // Configurações da Home
    userGoals?: UserGoals;
    visibleMetrics?: VisibleMetrics;
}

const USER_CONFIG_STORAGE_KEY = 'userConfig';

export const DEFAULT_USER_GOALS: UserGoals = {
    dailyCalories: 600,
    weeklyWorkouts: 4,
    weeklyActivities: 8,
    dailyTime: 120,
};

export const DEFAULT_VISIBLE_METRICS: VisibleMetrics = {
    calories: true,
    activities: true,
    time: true,
};

// Dados iniciais com configurações padrão
const INITIAL_USER_CONFIG_DATA: UserConfig = {
    name: '',
    theme: 'auto',
    language: 'pt',
    notifications: {
        workoutReminders: true,
        supplementReminders: true,
        mealReminders: true,
        progressTracking: true,
    },
    units: {
        weight: 'kg',
        height: 'cm',
        distance: 'km',
    },
    userGoals: DEFAULT_USER_GOALS,
    visibleMetrics: DEFAULT_VISIBLE_METRICS,
    createdAt: new Date().toISOString(),
};

export function useUserConfig() {
    const {
        data: userConfig = INITIAL_USER_CONFIG_DATA,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        saveData,
        forcSync
    } = useFirebaseStorage<UserConfig>(
        USER_CONFIG_STORAGE_KEY,
        'userConfig',
        INITIAL_USER_CONFIG_DATA,
        {
            enableRealtime: true,
            syncOnMount: true,
        }
    );

    const updateUserConfig = async (updates: Partial<UserConfig>) => {
        const currentConfig = userConfig || INITIAL_USER_CONFIG_DATA;
        const updatedConfig: UserConfig = {
            ...currentConfig,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await saveData(updatedConfig);
    };

    const updateHomePreferences = async (updates: Partial<Pick<UserConfig, 'userGoals' | 'visibleMetrics'>>) => {
        const currentConfig = userConfig || INITIAL_USER_CONFIG_DATA;
        await updateUserConfig({
            ...updates,
            userGoals: {
                ...(currentConfig.userGoals || DEFAULT_USER_GOALS),
                ...(updates.userGoals || {}),
            },
            visibleMetrics: {
                ...(currentConfig.visibleMetrics || DEFAULT_VISIBLE_METRICS),
                ...(updates.visibleMetrics || {}),
            }
        });
    };

    const resetHomePreferences = async () => {
        await updateUserConfig({
            userGoals: DEFAULT_USER_GOALS,
            visibleMetrics: DEFAULT_VISIBLE_METRICS,
        });
    };

    const updatePersonalInfo = async (personalInfo: Pick<UserConfig, 'name' | 'age' | 'weight' | 'height' | 'gender' | 'activityLevel'>) => {
        await updateUserConfig(personalInfo);
    };

    const updateFitnessGoals = async (goals: Pick<UserConfig, 'fitnessGoal' | 'targetWeight' | 'dailyCalorieGoal' | 'weeklyWorkoutGoal'>) => {
        await updateUserConfig(goals);
    };

    const updateAppPreferences = async (preferences: Pick<UserConfig, 'theme' | 'language' | 'notifications' | 'units'>) => {
        await updateUserConfig(preferences);
    };

    const resetConfig = async () => {
        const reset: UserConfig = {
            ...INITIAL_USER_CONFIG_DATA,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await saveData(reset);
    };

    // Funções de cálculo baseadas na configuração
    const calculateBMI = (): number | null => {
        const config = userConfig || INITIAL_USER_CONFIG_DATA;
        if (config.weight && config.height) {
            const heightInMeters = config.height / 100;
            return config.weight / (heightInMeters * heightInMeters);
        }
        return null;
    };

    const calculateBMR = (): number | null => {
        const config = userConfig || INITIAL_USER_CONFIG_DATA;
        if (config.weight && config.height && config.age && config.gender) {
            // Fórmula de Harris-Benedict
            if (config.gender === 'male') {
                return 88.362 + (13.397 * config.weight) + (4.799 * config.height) - (5.677 * config.age);
            } else if (config.gender === 'female') {
                return 447.593 + (9.247 * config.weight) + (3.098 * config.height) - (4.330 * config.age);
            }
        }
        return null;
    };

    const calculateTDEE = (): number | null => {
        const bmr = calculateBMR();
        const config = userConfig || INITIAL_USER_CONFIG_DATA;
        
        if (bmr && config.activityLevel) {
            const multipliers = {
                sedentary: 1.2,
                light: 1.375,
                moderate: 1.55,
                active: 1.725,
                very_active: 1.9
            };
            return bmr * multipliers[config.activityLevel];
        }
        return null;
    };

    return {
        userConfig,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        forceSync: forcSync,
        updateUserConfig,
        updatePersonalInfo,
        updateFitnessGoals,
        updateHomePreferences,
        resetHomePreferences,
        updateAppPreferences,
        resetConfig,
        calculateBMI,
        calculateBMR,
        calculateTDEE,
    };
}