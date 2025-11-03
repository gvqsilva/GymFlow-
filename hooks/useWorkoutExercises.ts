// hooks/useWorkoutExercises.ts
// Hook para gerenciar exercícios selecionados em uma ficha de treino

import { useState } from 'react';
import { Exercise } from '../constants/exercisesData';

export interface WorkoutExercise extends Exercise {
  // Campos adicionais para fichas de treino
  series: number;
  reps: string;
  obs: string;
  order: number; // Ordem na ficha
}

interface UseWorkoutExercisesReturn {
  exercises: WorkoutExercise[];
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  updateExercise: (exerciseId: string, updates: Partial<WorkoutExercise>) => void;
  reorderExercises: (exercises: WorkoutExercise[]) => void;
  clearExercises: () => void;
  getSelectedIds: () => string[];
}

export const useWorkoutExercises = (
  initialExercises: WorkoutExercise[] = []
): UseWorkoutExercisesReturn => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialExercises);

  // Adicionar exercício à ficha
  const addExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      ...exercise,
      series: 3, // Valor padrão
      reps: '12', // Valor padrão
      obs: '',
      order: exercises.length + 1
    };

    setExercises(prev => [...prev, newWorkoutExercise]);
  };

  // Remover exercício da ficha
  const removeExercise = (exerciseId: string) => {
    setExercises(prev => {
      const filtered = prev.filter(ex => ex.id !== exerciseId);
      // Reordenar após remoção
      return filtered.map((ex, index) => ({ ...ex, order: index + 1 }));
    });
  };

  // Atualizar exercício (series, reps, obs)
  const updateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setExercises(prev => 
      prev.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, ...updates }
          : ex
      )
    );
  };

  // Reordenar exercícios (drag & drop)
  const reorderExercises = (newExercises: WorkoutExercise[]) => {
    const reordered = newExercises.map((ex, index) => ({ 
      ...ex, 
      order: index + 1 
    }));
    setExercises(reordered);
  };

  // Limpar todos os exercícios
  const clearExercises = () => {
    setExercises([]);
  };

  // Obter IDs dos exercícios selecionados
  const getSelectedIds = (): string[] => {
    return exercises.map(ex => ex.id);
  };

  return {
    exercises,
    addExercise,
    removeExercise,
    updateExercise,
    reorderExercises,
    clearExercises,
    getSelectedIds
  };
};