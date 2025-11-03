// components/WorkoutExerciseItem.tsx
// Componente para exibir e editar exercício em uma ficha

import React, { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WorkoutExercise } from '../hooks/useWorkoutExercises';

interface WorkoutExerciseItemProps {
  exercise: WorkoutExercise;
  onUpdate: (exerciseId: string, updates: Partial<WorkoutExercise>) => void;
  onRemove: (exerciseId: string) => void;
  canEdit?: boolean;
}

export const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
  exercise,
  onUpdate,
  onRemove,
  canEdit = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRemove = () => {
    Alert.alert(
      'Remover Exercício',
      `Deseja remover "${exercise.name}" da ficha?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => onRemove(exercise.id) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header do exercício */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: exercise.videoUrl }} 
          style={styles.exerciseImage}
          resizeMode="cover"
        />
        
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
          <Text style={styles.quickInfo}>
            {exercise.series}x {exercise.reps}
            {exercise.obs && ` • ${exercise.obs}`}
          </Text>
        </View>

        {canEdit && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={handleRemove}
          >
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Detalhes expandidos */}
      {isExpanded && canEdit && (
        <View style={styles.details}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Séries</Text>
              <TextInput
                style={styles.numberInput}
                value={exercise.series.toString()}
                onChangeText={(text) => {
                  const series = parseInt(text) || 1;
                  onUpdate(exercise.id, { series });
                }}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetições</Text>
              <TextInput
                style={styles.textInput}
                value={exercise.reps}
                onChangeText={(reps) => onUpdate(exercise.id, { reps })}
                placeholder="12-15"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Observações</Text>
            <TextInput
              style={[styles.textInput, styles.obsInput]}
              value={exercise.obs}
              onChangeText={(obs) => onUpdate(exercise.id, { obs })}
              placeholder="Ex: descanso 60s, carga progressiva..."
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 2,
  },
  quickInfo: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  details: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  obsInput: {
    height: 60,
    textAlignVertical: 'top',
  },
});