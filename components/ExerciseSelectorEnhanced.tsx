// components/ExerciseSelectorEnhanced.tsx
// Componente aprimorado com animações, favoritos, preview e loading

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
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
  CatalogExercise,
  ExerciseGroup,
  getAllExercises,
  getExercisesByGroup
} from '../constants/exercisesData';

const { width } = Dimensions.get('window');
const themeColor = '#5a4fcf';

interface ExerciseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: CatalogExercise) => void;
  selectedExercises?: string[];
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ 
  visible,
  onClose,
  onSelectExercise, 
  selectedExercises = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | 'all' | 'favorites'>('all');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [previewExercise, setPreviewExercise] = useState<CatalogExercise | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Animações
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const chipScaleAnims = useRef(new Map()).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Grupos musculares
  const muscleGroups = [
    { key: 'all', name: 'Todos' },
    { key: 'favorites', name: '⭐ Favoritos' },
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
  
  // Exercícios filtrados com loading
  const filteredExercises = useMemo(() => {
    setLoading(true);
    
    setTimeout(() => setLoading(false), 300); // Simula loading
    
    let exercises: CatalogExercise[] = [];
    
    if (selectedGroup === 'all') {
      exercises = getAllExercises();
    } else if (selectedGroup === 'favorites') {
      exercises = getAllExercises().filter(exercise => favorites.includes(exercise.id));
    } else {
      exercises = getExercisesByGroup(selectedGroup as ExerciseGroup);
    }
    
    if (searchQuery.trim()) {
      exercises = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return exercises;
  }, [selectedGroup, searchQuery, favorites]);

  // Animação de entrada
  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const isExerciseSelected = (exerciseId: string): boolean => {
    return selectedExercises.includes(exerciseId);
  };

  const isFavorite = (exerciseId: string): boolean => {
    return favorites.includes(exerciseId);
  };

  // Animação de bounce ao selecionar
  const handleExercisePress = (exercise: CatalogExercise) => {
    if (isExerciseSelected(exercise.id)) {
      return;
    }
    
    // Animação de bounce
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onSelectExercise(exercise);
  };

  // Animação dos chips
  const handleGroupPress = (group: ExerciseGroup | 'all' | 'favorites') => {
    if (!chipScaleAnims.has(group)) {
      chipScaleAnims.set(group, new Animated.Value(1));
    }
    
    const scaleAnim = chipScaleAnims.get(group)!;
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedGroup(group);
  };

  // Toggle favorito
  const toggleFavorite = (exerciseId: string) => {
    setFavorites(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  // Preview do exercício
  const handleLongPress = (exercise: CatalogExercise) => {
    setPreviewExercise(exercise);
    setShowPreview(true);
  };

  const renderGroupFilter = ({ item }: { item: typeof muscleGroups[0] }) => {
    if (!chipScaleAnims.has(item.key as any)) {
      chipScaleAnims.set(item.key as any, new Animated.Value(1));
    }
    
    const scaleAnim = chipScaleAnims.get(item.key as any)!;
    
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.filterChip,
            selectedGroup === item.key && styles.filterChipActive
          ]}
          onPress={() => handleGroupPress(item.key as any)}
        >
          <Text style={[
            styles.filterChipText,
            selectedGroup === item.key && styles.filterChipTextActive
          ]}>
            {item.name}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderExerciseItem = ({ item }: { item: CatalogExercise }) => (
    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
      <Pressable
        style={[
          styles.exerciseCard,
          isExerciseSelected(item.id) && styles.exerciseCardSelected
        ]}
        onPress={() => handleExercisePress(item)}
        onLongPress={() => handleLongPress(item)}
        disabled={isExerciseSelected(item.id)}
      >
        <View style={styles.exerciseImageContainer}>
          {item.videoUrl ? (
            <Image 
              source={item.videoUrl} 
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="fitness" size={24} color="#9CA3AF" />
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
        
        <View style={styles.exerciseActions}>
          <Pressable 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFavorite(item.id) ? "star" : "star-outline"} 
              size={18} 
              color={isFavorite(item.id) ? "#FFD700" : "#9CA3AF"} 
            />
          </Pressable>
          
          <View style={styles.exerciseAction}>
            {isExerciseSelected(item.id) ? (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            ) : (
              <Ionicons name="add" size={20} color={themeColor} />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  const renderLoadingItem = () => (
    <View style={styles.loadingCard}>
      <View style={styles.loadingImage} />
      <View style={styles.loadingInfo}>
        <View style={styles.loadingText} />
        <View style={[styles.loadingText, { width: '60%' }]} />
      </View>
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="formSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={themeColor} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header com contador */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Adicionar Exercícios</Text>
              {selectedExercises.length > 0 && (
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>{selectedExercises.length}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Barra de pesquisa */}
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

          {/* Filtros */}
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
                {loading ? 'Carregando...' : `${filteredExercises.length} exercício${filteredExercises.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <View key={item}>{renderLoadingItem()}</View>
                ))}
              </View>
            ) : (
              <FlatList
                data={filteredExercises}
                renderItem={renderExerciseItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.exercisesList}
              />
            )}
          </View>
        </Animated.View>

        {/* Modal de Preview */}
        <Modal
          visible={showPreview}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPreview(false)}
        >
          <Pressable 
            style={styles.previewOverlay}
            onPress={() => setShowPreview(false)}
          >
            <View style={styles.previewContainer}>
              {previewExercise && (
                <>
                  {previewExercise.videoUrl ? (
                    <Image 
                      source={previewExercise.videoUrl} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Ionicons name="fitness" size={48} color="#9CA3AF" />
                    </View>
                  )}
                  <Text style={styles.previewTitle}>{previewExercise.name}</Text>
                  <Text style={styles.previewMuscle}>{previewExercise.muscle}</Text>
                </>
              )}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: themeColor,
  },
  filterChipText: {
    fontSize: 15,
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
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
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
  
  // Loading
  loadingContainer: {
    paddingHorizontal: 20,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  loadingImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  loadingInfo: {
    flex: 1,
  },
  loadingText: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  
  // Preview
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewMuscle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});