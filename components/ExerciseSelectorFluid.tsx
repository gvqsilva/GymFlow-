// components/ExerciseSelectorFluid.tsx
// Componente fluido e legível para seleção de exercícios

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import {
    Exercise,
    ExerciseGroup,
    getAllExercises,
    getExercisesByGroup
} from '../constants/exercisesData';

const themeColor = '#5a4fcf';

interface ExerciseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises?: string[];
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ 
  visible,
  onClose,
  onSelectExercise, 
  selectedExercises = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | 'all'>('all');
  
  // Grupos musculares com nomes mais limpos e compactos
  const muscleGroups = [
    { key: 'all', name: 'Todos' },
    { key: 'Quadríceps', name: 'Quad' },
    { key: 'Posterior', name: 'Post' },
    { key: 'Glúteos', name: 'Glúteo' },
    { key: 'Peitoral', name: 'Peito' },
    { key: 'Costas', name: 'Costas' },
    { key: 'Bíceps', name: 'Bíceps' },
    { key: 'Tríceps', name: 'Tríceps' },
    { key: 'Ombros', name: 'Ombros' },
    { key: 'Abdômen', name: 'Abs' },
    { key: 'Panturrilha', name: 'Pantu' }
  ];
  
  // Exercícios filtrados
  const filteredExercises = useMemo(() => {
    let exercises: Exercise[] = [];
    
    if (selectedGroup === 'all') {
      exercises = getAllExercises();
    } else {
      exercises = getExercisesByGroup(selectedGroup);
    }
    
    if (searchQuery.trim()) {
      exercises = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return exercises;
  }, [selectedGroup, searchQuery]);

  const isExerciseSelected = (exerciseId: string): boolean => {
    return selectedExercises.includes(exerciseId);
  };

  const handleExercisePress = (exercise: Exercise) => {
    if (isExerciseSelected(exercise.id)) {
      return;
    }
    onSelectExercise(exercise);
  };

  const renderGroupFilter = ({ item }: { item: typeof muscleGroups[0] }) => (
    <Pressable
      style={[
        styles.filterChip,
        selectedGroup === item.key && styles.filterChipActive
      ]}
      onPress={() => setSelectedGroup(item.key as any)}
    >
      <Text style={[
        styles.filterChipText,
        selectedGroup === item.key && styles.filterChipTextActive
      ]}>
        {item.name}
      </Text>
    </Pressable>
  );

  const renderExerciseItem = ({ item, index }: { item: Exercise; index: number }) => (
    <Pressable
      style={[
        styles.exerciseCard,
        isExerciseSelected(item.id) && styles.exerciseCardSelected
      ]}
      onPress={() => handleExercisePress(item)}
      disabled={isExerciseSelected(item.id)}
    >
      <View style={styles.exerciseImageContainer}>
        {item.videoUrl ? (
          <Image 
            source={{ uri: item.videoUrl }} 
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="fitness" size={20} color="#9CA3AF" />
          </View>
        )}
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.exerciseMuscle}>
          {item.muscle}
        </Text>
      </View>
      
      <View style={styles.exerciseAction}>
        {isExerciseSelected(item.id) ? (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        ) : (
          <Ionicons name="add" size={20} color={themeColor} />
        )}
      </View>
    </Pressable>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="formSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={themeColor} />
        
        {/* Header compacto */}
        <View style={styles.header}>
          <Text style={styles.title}>Adicionar Exercícios</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Barra de pesquisa minimalista */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar exercício..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filtros horizontais compactos */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={muscleGroups}
            keyExtractor={(item) => item.key}
            renderItem={renderGroupFilter}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Lista de exercícios */}
        <View style={styles.exercisesContainer}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.exercisesCount}>
              {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exercisesList}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: themeColor,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  
  // Filters
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: themeColor,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  
  // Exercises
  exercisesContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  exercisesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  exercisesCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  exercisesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  exerciseCardSelected: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  exerciseImageContainer: {
    marginRight: 16,
  },
  exerciseImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#6B7280',
  },
  exerciseAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});