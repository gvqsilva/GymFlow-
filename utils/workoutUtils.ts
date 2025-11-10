// utils/workoutUtils.ts
// Utilitários para manipulação de workouts

import { getExerciseById } from '../constants/exercisesData';
import { Exercise, Workout } from '../constants/workoutData';

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

/**
 * MIGRAÇÃO: Mapeia IDs legados (A1, B2, C3...) para IDs do catálogo (ex_xxxx)
 */
export const legacyIdToCatalogId: Record<string, string> = {
    // Treino A
    A1: 'ex_0202', // Supino Inclinado com Halteres
    A2: 'ex_0204', // Supino com Halteres
    A3: 'ex_0212', // Supino Articulado Declinado
    A4: 'ex_0213', // Crucifixo Máquina
    A5: 'ex_0607', // Desenvolvimento Maquina
    A6: 'ex_0602', // Elevação Lateral Halter
    A7: 'ex_0505', // Tríceps Testa
    A8: 'ex_0503', // Tríceps Francês Halter
    // Treino B
    B1: 'ex_0301', // Puxada Frontal
    B2: 'ex_0304', // Remada Unilateral com Halter
    B3: 'ex_0309', // Remada na Máquina
    B4: 'ex_0316', // Extensão Lombar 45°
    B5: 'ex_0313', // Remada Alta
    B6: 'ex_0403', // Rosca Alternada com Halteres
    B7: 'ex_0404', // Rosca Martelo
    // Treino C
    C1: 'ex_0802', // Gemeos em Pé Maquina
    C2: 'ex_0104', // Agachamento Smith
    C3: 'ex_0106', // Leg Press Horizontal
    C4: 'ex_0110', // Cadeira Extensora
    C5: 'ex_0114', // Mesa Flexora
    C6: 'ex_0113', // Cadeira Flexora
    C7: 'ex_0116', // Cadeira abdutora
    C8: 'ex_0117', // Cadeira adutora
};

/**
 * Migra um exercício para o formato atual usando IDs do catálogo
 */
export function migrateExercise(ex: Exercise): { exercise: Exercise; changed: boolean } {
    const mappedId = legacyIdToCatalogId[ex.id] || ex.id;
    let changed = mappedId !== ex.id;

    // Buscar dados canônicos pelo ID catalogado para alinhar name/muscle
    const catalog = getExerciseById(mappedId);
    if (catalog) {
        const nameChanged = catalog.name !== ex.name;
        const muscleChanged = catalog.muscle !== ex.muscle;
        changed = changed || nameChanged || muscleChanged;
        return {
            exercise: {
                ...ex,
                id: mappedId,
                name: catalog.name,
                muscle: catalog.muscle,
            },
            changed,
        };
    }

    // Se não achar no catálogo, apenas aplica o ID mapeado
    return {
        exercise: { ...ex, id: mappedId },
        changed,
    };
}

/**
 * Migra todos os workouts carregados para o formato atual
 */
export function migrateWorkouts(
    workouts: Record<string, Workout>
): { migrated: Record<string, Workout>; changed: boolean } {
    let anyChanged = false;
    const migratedEntries = Object.entries(workouts).map(([wid, w]) => {
        let workoutChanged = false;
        const migratedExercises = (w.exercises || []).map((ex) => {
            const { exercise, changed } = migrateExercise(ex);
            if (changed) workoutChanged = true;
            return exercise;
        });

        if (workoutChanged) anyChanged = true;
        return [wid, { ...w, exercises: migratedExercises } as Workout] as const;
    });

    return {
        migrated: Object.fromEntries(migratedEntries),
        changed: anyChanged,
    };
}