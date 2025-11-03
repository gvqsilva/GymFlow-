// components/ExerciseSelectorNew.tsx
// Novo componente para selecionar exercícios baseado no design mostrado

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
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
  
  // Lista explícita dos grupos musculares disponíveis
  const muscleGroups: ExerciseGroup[] = [
    'Quadríceps' , 'Posterior' , 'Glúteos', 'Peitoral' , 'Costas' , 
    'Bíceps' , 'Tríceps' , 'Ombros' , 'Abdômen' , 'Panturrilha'
  ];
  
  // Nomes dos chips para exibição
  const groupDisplayNames: Record<ExerciseGroup | 'all', string> = {
    'all': 'Todo',
    'Quadríceps': 'Quadríceps',
    'Posterior': 'Posterior',
    'Glúteos': 'Glúteo',
    'Peitoral': 'Peitoral',
    'Costas': 'Costas',
    'Bíceps': 'Bíceps',
    'Tríceps': 'Tríceps',
    'Ombros': 'Ombros',
    'Abdômen': 'Abdômen',
    'Panturrilha': 'Panturrilha'
  };
  
  const getFilteredExercises = (): Exercise[] => {
    let exercises: Exercise[] = [];
    
    if (selectedGroup === 'all') {
      exercises = getAllExercises();
    } else {
      exercises = getExercisesByGroup(selectedGroup);
    }
    
    if (searchQuery.trim()) {
      return exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return exercises;
  };

  const isExerciseSelected = (exerciseId: string): boolean => {
    return selectedExercises.includes(exerciseId);
  };

  const handleExercisePress = (exercise: Exercise) => {
    if (isExerciseSelected(exercise.id)) {
      Alert.alert('Exercício já adicionado', 'Este exercício já está na sua ficha de treino.');
      return;
    }
    onSelectExercise(exercise);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <Pressable
      style={[
        styles.exerciseItem,
        isExerciseSelected(item.id) && styles.exerciseItemSelected
      ]}
      onPress={() => handleExercisePress(item)}
      disabled={isExerciseSelected(item.id)}
    >
      {item.videoUrl && (
        <Image 
          source={{ uri: item.videoUrl }} 
          style={styles.exerciseImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name} </Text>
        <Text style={styles.exerciseMuscle}>{item.muscle} </Text>
      </View>
      {isExerciseSelected(item.id) && (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      )}
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Selecionar exercícios</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Fechar</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="grupo muscular ou exercício"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <Pressable
            style={[
              styles.filterChip,
              selectedGroup === 'all' && styles.filterChipActive
            ]}
            onPress={() => setSelectedGroup('all')}
          >
            <Text style={[
              styles.filterChipText,
              selectedGroup === 'all' && styles.filterChipTextActive
            ]}>
              {groupDisplayNames['all']} </Text>
          </Pressable>
          
          {muscleGroups.map((group) => (
            <Pressable
              key={group}
              style={[
                styles.filterChip,
                selectedGroup === group && styles.filterChipActive
              ]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text style={[
                styles.filterChipText,
                selectedGroup === group && styles.filterChipTextActive
              ]}>{groupDisplayNames[group]} </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercise List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Lista dos exercícios</Text>
          <FlatList
            data={getFilteredExercises()}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            style={styles.exerciseList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 4,
  },
  filterChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 4,
  },
  exerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  exerciseItemSelected: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  exerciseMuscle: {
    fontSize: 13,
    color: '#666',
  },
  separator: {
    height: 8,
  },
});