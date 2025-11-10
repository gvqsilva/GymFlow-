// components/WorkoutExerciseItem-fixed.tsx
// Versão corrigida com tratamento de erro para imagens e melhor handling

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
import { getExerciseGif } from '../constants/exercisesData';
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
  const [imageError, setImageError] = useState(false);

  const handleRemove = () => {
    try {
      Alert.alert(
        'Remover Exercício',
        `Deseja remover "${exercise.name}" da ficha?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: () => {
            console.log('🗑️ Removendo exercício:', exercise.name);
            onRemove(exercise.id);
          }}
        ]
      );
    } catch (error) {
      console.error('❌ Erro ao remover exercício:', error);
    }
  };

  const handleUpdate = (field: keyof WorkoutExercise, value: string | number) => {
    try {
      console.log('📝 Atualizando exercício:', exercise.name, field, value);
      onUpdate(exercise.id, { [field]: value });
    } catch (error) {
      console.error('❌ Erro ao atualizar exercício:', error);
    }
  };

  const handleImageError = () => {
    const exerciseGif = getExerciseGif(exercise.id);
    console.warn('⚠️ Erro ao carregar imagem:', exerciseGif);
    setImageError(true);
  };

  return (
    <View style={styles.container}>
      {/* Header do exercício */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        {(() => {
          const exerciseGif = getExerciseGif(exercise.id);
          return !imageError && exerciseGif ? (
            <Image 
              source={exerciseGif}
              style={styles.exerciseImage}
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <View style={[styles.exerciseImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>💪</Text>
            </View>
          );
        })()}
        
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.exerciseMuscle} numberOfLines={1}>
            {exercise.muscle}
          </Text>
          <Text style={styles.quickInfo} numberOfLines={1}>
            {exercise.series}x {exercise.reps}
            {exercise.obs && ` • ${exercise.obs}`}
          </Text>
        </View>

        {canEdit && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={handleRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                style={styles.input}
                value={exercise.series.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  if (num > 0 && num <= 20) {
                    handleUpdate('series', num);
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetições</Text>
              <TextInput
                style={styles.input}
                value={exercise.reps}
                onChangeText={(text) => handleUpdate('reps', text)}
                placeholder="Ex: 12, 8-12, 30s"
                maxLength={20}
                selectTextOnFocus
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Observações</Text>
            <TextInput
              style={[styles.input, styles.obsInput]}
              value={exercise.obs}
              onChangeText={(text) => handleUpdate('obs', text)}
              placeholder="Dicas, carga, tempo de descanso..."
              multiline
              maxLength={150}
              selectTextOnFocus
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
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 20,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  quickInfo: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  obsInput: {
    height: 60,
    textAlignVertical: 'top',
  },
});