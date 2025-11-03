// components/ExerciseSelector.tsx
// Componente para selecionar exercícios do catálogo local para adicionar à ficha

import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Exercise,
    ExerciseGroup,
    exercisesData,
    getAllExercises,
    getExercisesByGroup
} from '../constants/exercisesData';

interface ExerciseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises?: string[]; // IDs dos exercícios já selecionados
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ 
  visible,
  onClose,
  onSelectExercise, 
  selectedExercises = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | 'all'>('all');
  
  // Grupos musculares disponíveis
  const muscleGroups = Object.keys(exercisesData.exercises) as ExerciseGroup[];
  
  // Exercícios filtrados
  const getFilteredExercises = (): Exercise[] => {
    let exercises: Exercise[] = [];
    
    if (selectedGroup === 'all') {
      exercises = getAllExercises();
    } else {
      exercises = getExercisesByGroup(selectedGroup);
    }
    
    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscle.toLowerCase().includes(query)
      );
    }
    
    return exercises;
  };

  // Verificar se exercício já foi selecionado
  const isSelected = (exerciseId: string) => {
    return selectedExercises.includes(exerciseId);
  };

  // Renderizar item de exercício
  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[
        styles.exerciseItem,
        isSelected(item.id) && styles.selectedItem
      ]}
      onPress={() => {
        if (isSelected(item.id)) {
          Alert.alert('Exercício já selecionado', 'Este exercício já está na sua ficha.');
          return;
        }
        onSelectExercise(item);
      }}
    >
      <Image 
        source={{ uri: item.videoUrl }} 
        style={styles.exerciseImage}
        resizeMode="cover"
      />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMuscle}>{item.muscle}</Text>
      </View>
      {isSelected(item.id) && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Renderizar filtro de grupo muscular
  const renderGroupFilter = ({ item }: { item: ExerciseGroup | 'all' }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedGroup === item && styles.selectedChip
      ]}
      onPress={() => setSelectedGroup(item)}
    >
      <Text style={[
        styles.filterText,
        selectedGroup === item && styles.selectedFilterText
      ]}>
        {item === 'all' ? 'Todos' : item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Selecionar Exercícios</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fechar </Text>
          </TouchableOpacity>
        </View>

        {/* Campo de busca */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar exercícios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />

        {/* Filtros por grupo muscular */}
        <FlatList
          data={['all', ...muscleGroups]}
          renderItem={renderGroupFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
        />

        {/* Lista de exercícios */}
        <FlatList
          data={getFilteredExercises()}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          style={styles.exercisesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.exercisesContent}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  closeText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterList: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedChip: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: 'white',
    fontWeight: '700',
  },
  exercisesList: {
    flex: 1,
  },
  exercisesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItem: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f8ff',
    shadowColor: '#0066cc',
    shadowOpacity: 0.2,
  },
  exerciseImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    lineHeight: 22,
  },
  exerciseMuscle: {
    fontSize: 15,
    color: '#0066cc',
    fontWeight: '600',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    backgroundColor: '#0066cc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});