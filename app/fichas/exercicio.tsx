// app/fichas/exercicio-simple.tsx
// Versão simplificada sem gráfico para debug

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseLoadChart, { LoadPoint } from '../../components/ExerciseLoadChart';
import { catalogToWorkoutExercise, getExerciseById, getExerciseGif } from '../../constants/exercisesData';
import { useWorkouts } from '../../hooks/useWorkouts';

const themeColor = '#5a4fcf';

export default function ExerciseDetailScreen() {
    const params = useLocalSearchParams<{ workoutId: string | string[]; exerciseId: string | string[] }>();
    const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
    const exerciseId = Array.isArray(params.exerciseId) ? params.exerciseId[0] : params.exerciseId;
    const { workouts, isLoading: workoutsLoading } = useWorkouts();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    console.log('🏃‍♂️ [ExerciseDetail] Parâmetros recebidos:', { workoutId, exerciseId });

    useFocusEffect(
        useCallback(() => {
            const loadHistory = async () => {
                try {
                    console.log('📊 [ExerciseDetail] Carregando histórico...');
                    setIsLoading(true);
                    const historyJSON = await AsyncStorage.getItem('workoutHistory');
                    const historyData = historyJSON ? JSON.parse(historyJSON) : [];
                    setHistory(historyData);
                    console.log('✅ [ExerciseDetail] Histórico carregado:', historyData.length, 'entradas');
                } catch (error) {
                    console.error('❌ [ExerciseDetail] Erro ao carregar histórico:', error);
                    setHistory([]);
                } finally {
                    setIsLoading(false);
                }
            };
            loadHistory();
        }, [])
    );
    
    // Buscar exercício com logs detalhados
    const exercise = useMemo(() => {
        try {
            console.log('🔍 [ExerciseDetail] Buscando exercício...');
            console.log('🏋️‍♂️ [ExerciseDetail] Workouts disponíveis:', Object.keys(workouts || {}));
            
            if (!workoutId || !exerciseId) {
                console.warn('⚠️ [ExerciseDetail] IDs faltando:', { workoutId, exerciseId });
                return null;
            }
            
            const workout = workoutId ? workouts?.[workoutId] : undefined;
            if (!workout) {
                console.warn('⚠️ [ExerciseDetail] Workout não encontrado:', workoutId);
                return null;
            }
            
            console.log('🏋️‍♂️ [ExerciseDetail] Workout encontrado:', workout.name);
            console.log('🏋️‍♂️ [ExerciseDetail] Exercícios no workout:', workout.exercises?.length || 0);
            
            const foundExercise = workout.exercises?.find((ex: any) => String(ex.id) === String(exerciseId));
            if (!foundExercise) {
                console.warn('⚠️ [ExerciseDetail] Exercício não encontrado no workout, tentando catálogo:', exerciseId);
                console.log('🔍 [ExerciseDetail] IDs disponíveis:', workout.exercises?.map((ex: any) => ex.id) || []);

                const catalogExercise = exerciseId ? getExerciseById(String(exerciseId)) : null;
                if (!catalogExercise) {
                    console.warn('⚠️ [ExerciseDetail] Exercício também não encontrado no catálogo:', exerciseId);
                    return null;
                }

                const fallback = catalogToWorkoutExercise(catalogExercise);
                console.log('✅ [ExerciseDetail] Exercício reconstruído a partir do catálogo:', fallback.name);
                return fallback;
            }
            
            console.log('✅ [ExerciseDetail] Exercício encontrado:', foundExercise.name);
            console.log('📋 [ExerciseDetail] Estrutura do exercício:', Object.keys(foundExercise));
            
            return foundExercise;
        } catch (error) {
            console.error('❌ [ExerciseDetail] Erro ao buscar exercício:', error);
            return null;
        }
    }, [workouts, workoutId, exerciseId]);

    // Calcular recorde pessoal simples
    const personalRecord = useMemo(() => {
        try {
            if (!exerciseId || history.length === 0) {
                console.log('📊 [ExerciseDetail] Sem dados para calcular PR');
                return null;
            }
            
            const weights = history
                .filter(entry => entry.category === 'Musculação' && entry.details?.performance?.[exerciseId])
                .map(entry => entry.details.performance[exerciseId])
                .filter(weight => weight && !isNaN(parseFloat(weight)))
                .map(weight => parseFloat(weight));
            
            const record = weights.length > 0 ? Math.max(...weights) : null;
            console.log('🏆 [ExerciseDetail] Recorde pessoal calculado:', record, 'kg');
            return record;
        } catch (error) {
            console.error('❌ [ExerciseDetail] Erro ao calcular PR:', error);
            return null;
        }
    }, [history, exerciseId]);

        const handleImageError = (error: any) => {
        console.warn('⚠️ [ExerciseDetail] Erro ao carregar imagem:', error?.nativeEvent?.error || 'Erro desconhecido');
        setImageError(true);
    };

        // Série temporal para o gráfico de progresso
        const seriesData: LoadPoint[] = useMemo(() => {
                try {
                        if (!exerciseId || history.length === 0) return [];
                        // Coleta por data -> maior peso do dia
                        const byDate: Record<string, number> = {};
                        history
                            .filter(entry => entry.category === 'Musculação' && entry.details?.performance?.[exerciseId])
                            .forEach(entry => {
                                const dateStr = String(entry.date);
                                const w = parseFloat(String(entry.details.performance[exerciseId]).replace(',', '.'));
                                if (!isNaN(w)) {
                                        byDate[dateStr] = Math.max(byDate[dateStr] || 0, w);
                                }
                            });
                        return Object.entries(byDate)
                            .map(([date, weight]) => ({ date, weight }))
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                } catch (e) {
                        console.warn('⚠️ [ExerciseDetail] Falha ao montar série do gráfico:', e);
                        return [];
                }
        }, [history, exerciseId]);

    // Loading state para workouts
    if (workoutsLoading) {
        console.log('⏳ [ExerciseDetail] Carregando workouts...');
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={themeColor} />
                <Text style={styles.loadingText}>Carregando treinos... </Text>
            </View>
        );
    }

    // Exercício não encontrado
    if (!exercise) {
        console.error('❌ [ExerciseDetail] Exercício não encontrado para renderização');
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <Stack.Screen options={{ title: 'Exercício não encontrado' }} />
                <Text style={styles.errorText}>
                    ❌ Exercício não encontrado!
                </Text>
                <Text style={styles.errorSubtext}>
                    workout: {workoutId} </Text>
                <Text style={styles.errorSubtext}>
                    exercise: {exerciseId} </Text>
                <Text style={styles.errorSubtext}>
                    Workouts disponíveis: {Object.keys(workouts || {}).join(', ')} </Text>
            </SafeAreaView>
        );
    }

    console.log('✅ [ExerciseDetail] Renderizando exercício:', exercise.name);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: exercise.name }} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* HERO com imagem e overlay */}
                <View style={styles.heroContainer}>
                    <View style={styles.heroMedia}>
                        {(() => {
                            const exerciseGif = getExerciseGif(exercise.id);
                            return !imageError && exerciseGif ? (
                                <Image
                                    source={exerciseGif}
                                    style={styles.heroImage}
                                    resizeMode="contain"
                                    onError={handleImageError}
                                />
                            ) : (
                                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                                    <Text style={styles.heroPlaceholderEmoji}>💪</Text> </View>
                            );
                        })()}
                        {/* Removido overlay para mostrar imagem inteira */}
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle} numberOfLines={2}>{exercise.name} </Text>
                            <View style={styles.chipsRow}>
                                <InfoChip label="Músculo" value={exercise.muscle} />
                                <InfoChip label="Séries" value={String(exercise.series)} />
                                <InfoChip label="Reps" value={exercise.reps} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Observações do exercício */}
                {exercise.obs ? (
                    <SectionCard title="📝 Observações">
                        <Text style={styles.obsText}>{exercise.obs} </Text>
                    </SectionCard>
                ) : null}
                
                

                {/* Gráfico de progressão de carga */}
                <SectionCard title={`📈 Progressão de Carga ${seriesData.length > 30 ? '(últimos 30)' : ''}`}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={themeColor} />
                            <Text style={styles.loadingText}>Carregando histórico... </Text>
                        </View>
                    ) : seriesData.length > 0 ? (
                        <ExerciseLoadChart data={seriesData} />
                    ) : (
                        <View style={styles.noPrContainer}>
                            <Text style={styles.noDataText}>Sem dados suficientes para o gráfico</Text>
                            <Text style={styles.noDataSubtext}>Registre cargas neste exercício para ver a evolução</Text>
                        </View>
                    )}
                </SectionCard>


                {/* Debug e ações removidos conforme pedido */}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f0f2f5' 
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sectionContainer: { 
        margin: 20, 
        padding: 20, 
        backgroundColor: 'white', 
        borderRadius: 15, 
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    sectionTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 20, 
        textAlign: 'center',
    },
    heroContainer: {
        margin: 20,
    },
    heroMedia: {
        width: '100%',
        aspectRatio: 1.1, // leve retângulo para GIFs verticais/quadrados
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroPlaceholderEmoji: {
        fontSize: 42,
    },
    // Overlay removido para mostrar GIF completo
    heroContent: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        backgroundColor: 'rgba(0,0,0,0.35)',
        padding: 12,
        borderRadius: 12,
        backdropFilter: 'blur(4px)', // ignorado em RN, apenas documentação
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderEmoji: {
        fontSize: 48,
        marginBottom: 10,
    },
    noDataText: { 
        color: 'gray', 
        fontStyle: 'italic', 
        textAlign: 'center', 
        paddingVertical: 10,
        fontSize: 14,
    },
    noDataSubtext: {
        color: '#999',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: 'gray',
        fontSize: 14,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff4757',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorSubtext: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
    },
    prContainer: {
        alignItems: 'center',
        padding: 20,
    },
    prText: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: themeColor, 
        textAlign: 'center',
        marginBottom: 5,
    },
    prSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    noPrContainer: {
        alignItems: 'center',
        padding: 20,
    },
    obsText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
    },
});

// Componentes auxiliares
function InfoChip({ label, value }: { label: string; value: string }) {
    return (
        <View style={chipStyles.chipContainer}>
            <Text style={chipStyles.chipLabel}>{label}</Text>
            <Text style={chipStyles.chipValue}>{value}</Text>
        </View>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

const chipStyles = StyleSheet.create({
    chipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)'
    },
    chipLabel: {
        fontSize: 11,
        color: '#666',
        marginRight: 6,
        fontWeight: '600'
    },
    chipValue: {
        fontSize: 12,
        color: '#111',
        fontWeight: '700'
    }
});