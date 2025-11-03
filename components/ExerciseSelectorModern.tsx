// components/ExerciseSelectorModern.tsx
// Componente moderno para seleção de exercícios com design aprimorado

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
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

const { width, height } = Dimensions.get('window');

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
  
  // Lista dos grupos musculares
  const muscleGroups: ExerciseGroup[] = [
    'Quadríceps', 'Posterior', 'Glúteos', 'Peitoral', 'Costas', 
    'Bíceps', 'Tríceps', 'Ombros', 'Abdômen', 'Panturrilha'
  ];
  
  // Filtros dos exercícios
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
      return; // Exercício já selecionado
    }
    onSelectExercise(exercise);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
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
          <View style={[styles.exerciseImage, styles.placeholderImage]}>
            <Ionicons name="fitness" size={24} color="#999" />
          </View>
        )}
      </View>
      
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.exerciseMuscle}>
          {item.muscle}
        </Text>
      </View>
      
      <View style={styles.exerciseAction}>
        {isExerciseSelected(item.id) ? (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        ) : (
          <View style={styles.addIndicator}>
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </View>
        )}
      </View>
    </Pressable>
  );

  const renderGroupChip = (group: ExerciseGroup | 'all', displayName: string) => (
    <Pressable
      key={group}
      style={[
        styles.groupChip,
        selectedGroup === group && styles.groupChipActive
      ]}
      onPress={() => setSelectedGroup(group)}
    >
      <Text style={[
        styles.groupChipText,
        selectedGroup === group && styles.groupChipTextActive
      ]}>
        {displayName}
      </Text>
    </Pressable>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Adicionar Exercícios</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar exercícios..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Groups */}
        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ key: 'all', name: 'Todos' }, ...muscleGroups.map(group => ({ key: group, name: group }))]}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => renderGroupChip(item.key as any, item.name)}
            contentContainerStyle={styles.filterContent}
          />
        </View>

        {/* Exercise List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''} 
              {selectedGroup !== 'all' && ` • ${selectedGroup}`}
            </Text>
          </View>
          
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            style={styles.exerciseList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            numColumns={1}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  groupChip: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  groupChipActive: {
    backgroundColor: '#007AFF',
  },
  groupChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
  },
  groupChipTextActive: {
    color: '#fff',
  },
  listSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5f6368',
  },
  exerciseList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseCardSelected: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  exerciseImageContainer: {
    marginRight: 12,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f3f4',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseContent: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#5f6368',
  },
  exerciseAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    padding: 4,
  },
  addIndicator: {
    padding: 4,
  },
});