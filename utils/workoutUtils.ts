// utils/workoutUtils.ts
// Utilitários para manipulação de workouts

import { Workout } from '../constants/workoutData';

/**
 * Ordena workouts por nome de forma consistente
 */
export function sortWorkoutsByName(workouts: Record<string, Workout>): Workout[] {
    return Object.values(workouts).sort((a, b) => 
        (a?.name || '').localeCompare(b?.name || '')
    );
}

/**
 * Obtém IDs dos workouts ordenados por nome
 */
export function getSortedWorkoutIds(workouts: Record<string, Workout>): string[] {
    return Object.keys(workouts).sort((a, b) => 
        (workouts[a]?.name || '').localeCompare(workouts[b]?.name || '')
    );
}

/**
 * Obtém o próximo workout na sequência ordenada
 */
export function getNextWorkoutId(workouts: Record<string, Workout>, currentId: string): string {
    const sortedIds = getSortedWorkoutIds(workouts);
    const currentIndex = sortedIds.indexOf(currentId);
    const nextIndex = (currentIndex + 1) % sortedIds.length;
    return sortedIds[nextIndex];
}