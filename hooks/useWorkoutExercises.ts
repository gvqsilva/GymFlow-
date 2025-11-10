// hooks/useWorkoutExercises.ts
// Hook para gerenciar exercícios selecionados na criação/edição de ficha

import { useState } from 'react';
import { CatalogExercise, WorkoutExercise, catalogToWorkoutExercise } from '../constants/exercisesData';

// Re-export para facilitar imports
export type { WorkoutExercise } from '../constants/exercisesData';

interface UseWorkoutExercisesReturn {
  exercises: WorkoutExercise[];
  addExercise: (exercise: CatalogExercise | WorkoutExercise) => void;
  removeExercise: (exerciseId: string) => void;
  updateExercise: (exerciseId: string, updates: Partial<WorkoutExercise>) => void;
  reorderExercises: (exercises: WorkoutExercise[]) => void;
  clearExercises: () => void;
  getSelectedIds: () => string[];
  resetExercises: () => void;
}

// Flag simples para controlar logs de depuração deste hook
const DEBUG = true;

// Sanitização de atualizações para garantir integridade dos dados
function sanitizeUpdates(base: WorkoutExercise, updates: Partial<WorkoutExercise>): Partial<WorkoutExercise> {
  const out: Partial<WorkoutExercise> = { ...updates };

  if (out.series !== undefined) {
    const n = Number(out.series);
    const clamped = Number.isFinite(n) ? Math.min(30, Math.max(1, Math.trunc(n))) : base.series;
    out.series = clamped;
  }

  if (out.reps !== undefined) {
    const txt = String(out.reps).trim();
    out.reps = txt.slice(0, 25);
  }

  if (out.obs !== undefined) {
    const txt = String(out.obs).trim();
    out.obs = txt.slice(0, 200);
  }

  if (out.name !== undefined) {
    out.name = String(out.name).trim();
  }

  if (out.muscle !== undefined) {
    out.muscle = String(out.muscle).trim();
  }

  return out;
}

export const useWorkoutExercises = (
  initialExercises: WorkoutExercise[] = []
): UseWorkoutExercisesReturn => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialExercises);

  // Adicionar exercício à ficha
  const addExercise = (exercise: CatalogExercise | WorkoutExercise) => {
    if (DEBUG) console.log('➕ [useWorkoutExercises] Adicionando exercício:', exercise?.name);

    // Normalizar SEMPRE para WorkoutExercise
    const normalized: WorkoutExercise = 'series' in exercise && 'reps' in exercise && 'obs' in exercise
      ? {
          id: exercise.id,
          name: exercise.name,
          muscle: exercise.muscle,
          series: (exercise as WorkoutExercise).series,
          reps: (exercise as WorkoutExercise).reps,
          obs: (exercise as WorkoutExercise).obs,
        }
      : catalogToWorkoutExercise(exercise as CatalogExercise);

    // Não permitir duplicatas por ID (mantém compatibilidade com FlatList keyExtractor)
    setExercises(prev => {
      const exists = prev.some(ex => ex.id === normalized.id);
      if (exists) {
        if (DEBUG) console.warn('⚠️ [useWorkoutExercises] Exercício já existe na ficha:', normalized.name);
        return prev;
      }

      // Sanitizar campos antes de inserir
      const sanitized = { ...normalized } as WorkoutExercise;
      const sUpdates = sanitizeUpdates(sanitized, sanitized);
      const safe: WorkoutExercise = { ...sanitized, ...sUpdates };

      const newExercises = [...prev, safe];
      if (DEBUG) console.log('✅ [useWorkoutExercises] Exercício adicionado. Total:', newExercises.length);
      return newExercises;
    });
  };

  // Remover exercício da ficha
  const removeExercise = (exerciseId: string) => {
    if (DEBUG) console.log('🗑️ [useWorkoutExercises] Removendo exercício:', exerciseId);
    setExercises(prev => {
      const filtered = prev.filter(ex => ex.id !== exerciseId);
      if (DEBUG) console.log('✅ [useWorkoutExercises] Exercício removido. Restantes:', filtered.length);
      return filtered;
    });
  };

  // Atualizar exercício na ficha
  const updateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
    if (DEBUG) console.log('📝 [useWorkoutExercises] Atualizando exercício:', exerciseId, updates);
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const safe = sanitizeUpdates(ex, updates);
        return { ...ex, ...safe };
      })
    );
  };

  // Reordenar exercícios
  const reorderExercises = (reorderedExercises: WorkoutExercise[]) => {
    if (DEBUG) console.log('🔄 [useWorkoutExercises] Reordenando exercícios');
    // Garante novo array e evita condições de corrida
    setExercises(() => [...reorderedExercises]);
  };

  // Limpar todos os exercícios
  const clearExercises = () => {
    if (DEBUG) console.log('🧹 [useWorkoutExercises] Limpando todos os exercícios');
    setExercises([]);
  };

  // Reset para o estado inicial fornecido ao hook
  const resetExercises = () => {
    if (DEBUG) console.log('↩️ [useWorkoutExercises] Resetando exercícios ao estado inicial');
    setExercises(() => [...initialExercises]);
  };

  // Obter IDs dos exercícios selecionados
  const getSelectedIds = (): string[] => {
    const ids = exercises.map(ex => ex.id);
    if (DEBUG) console.log('🔍 [useWorkoutExercises] IDs selecionados:', ids);
    return ids;
  };

  return {
    exercises,
    addExercise,
    removeExercise,
    updateExercise,
    reorderExercises,
    clearExercises,
    getSelectedIds,
    resetExercises,
  };
};