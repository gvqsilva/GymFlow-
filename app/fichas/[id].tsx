// app/fichas/[id].tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Link, Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message'; // Importação do Toast
import { getExerciseGif } from '../../constants/exercisesData';
import { MET_DATA } from '../../constants/metData';
import { useWorkouts } from '../../hooks/useWorkouts';
import { firebaseSyncService } from '../../services/firebaseSync';
import { getNextWorkoutId } from '../../utils/workoutUtils';

const themeColor = '#5a4fcf';
const PROFILE_KEY = 'userProfile';

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function WorkoutDetailScreen() {
    const { id, title, date: dateParam } = useLocalSearchParams<{ id: string, title?: string, date?: string }>();
    const { workouts, refreshWorkouts } = useWorkouts();
    const router = useRouter();
    const [userWeight, setUserWeight] = useState(0);
    const [performance, setPerformance] = useState<{ [key: string]: string }>({});

    useFocusEffect(
        React.useCallback(() => {
            refreshWorkouts();
            const loadProfile = async () => {
                const profileJSON = await AsyncStorage.getItem(PROFILE_KEY);
                if (profileJSON) {
                    const { weight } = JSON.parse(profileJSON);
                    setUserWeight(weight || 0);
                }
            };
            loadProfile();
        }, [refreshWorkouts])
    );

    const workout = id ? workouts[id] : undefined;

    const handleWeightChange = (exerciseId: string, weight: string) => {
        setPerformance(prev => ({ ...prev, [exerciseId]: weight }));
    };

    const handleLogWorkout = async () => {
        if (!id || !workout) {
            Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível identificar o treino.' });
            return;
        }

        const duration = 60;
        const intensity = 'Moderada';
        const metValue = MET_DATA['Musculação']?.[intensity] || 0;
        const calories = userWeight > 0 ? (metValue * userWeight * 3.5) / 200 * duration : 0;
        
        const performanceData: { [key: string]: number } = {};
        Object.entries(performance).forEach(([exerciseId, weight]) => {
            const weightNum = parseFloat(weight.replace(',', '.'));
            if (!isNaN(weightNum) && weightNum > 0) {
                performanceData[exerciseId] = weightNum;
            }
        });

        try {
            const logDate = dateParam || getLocalDateString();
            const workoutEntry = { 
                id: `activity_${Date.now()}_${Math.random()}`,
                date: logDate, 
                category: 'Musculação', 
                details: { 
                    type: id,
                    calories: Math.round(calories),
                    performance: performanceData,
                } 
            };

            const historyJSON = await AsyncStorage.getItem('workoutHistory');
            let history: any[] = historyJSON ? JSON.parse(historyJSON) : [];

            const musculacaoLogIndex = history.findIndex(
                (entry: { date: string, category: string }) => entry.date === logDate && entry.category === 'Musculação'
            );

            const saveWorkout = async (isUpdate: boolean) => {
                // Usar função auxiliar para obter próximo workout ordenado
                const nextWorkoutId = getNextWorkoutId(workouts, id);

                if (!dateParam) {
                    await AsyncStorage.setItem('nextWorkoutId', nextWorkoutId);
                }

                if (isUpdate) {
                    workoutEntry.id = history[musculacaoLogIndex].id;
                    history[musculacaoLogIndex] = workoutEntry;
                } else {
                    history.push(workoutEntry);
                }
                await AsyncStorage.setItem('workoutHistory', JSON.stringify(history));

                // Sincronizar com Firebase
                try {
                    await firebaseSyncService.syncWorkoutHistory(history);
                    console.log('✅ Histórico de treinos sincronizado com Firebase');
                } catch (syncError) {
                    console.warn('⚠️ Falha na sincronização com Firebase:', syncError);
                    // Não mostra erro para o usuário, dados já foram salvos localmente
                }

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                const messageAction = isUpdate ? "atualizado para" : "contabilizado como";
                
                console.log('🍞 Mostrando toast:', `Treino ${messageAction} ${workout.name}.`);
                
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso!',
                  text2: `Treino ${messageAction} ${workout.name}.`,
                  visibilityTime: 3000,
                  topOffset: 60
                });
                
                // Delay maior para garantir que o toast apareça antes de voltar
                setTimeout(() => {
                    console.log('⬅️ Voltando à tela anterior');
                    router.back();
                }, 2000);
            };

            if (musculacaoLogIndex === -1) {
                await saveWorkout(false);
            } else {
                const loggedWorkout = history[musculacaoLogIndex];
                if (loggedWorkout.details.type === id && Object.keys(performanceData).length === 0) {
                     Toast.show({
                         type: 'info',
                         text1: 'Aviso',
                         text2: `O treino ${workout.name} já foi contabilizado para este dia.`
                     });
                     return;
                }
                Alert.alert(
                    "Substituir Registo?",
                    `Você já contabilizou um treino de musculação neste dia. Deseja substituí-lo por este?`,
                    [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Sim, Substituir", style: "default", onPress: () => saveWorkout(true) }
                    ]
                );
            }
        } catch (e) {
            console.error("Failed to log workout.", e);
            Toast.show({
                type: 'error',
                text1: 'Erro de Dados',
                text2: 'Ocorreu um erro ao ler o seu histórico.'
            });
        }
    };

    if (!workout) { 
        return <View style={styles.container}><Text>A carregar ficha...</Text></View>; 
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: title || workout.name }} />
             <View style={styles.header}>
                <Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">{workout.groups}</Text>
            </View>
            
            <FlatList
                data={workout.exercises}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 15 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardBody}>
                            <View style={styles.thumbWrapper}>
                                {(() => {
                                    const gif = getExerciseGif(item.id);
                                    return gif ? (
                                        <Image source={gif} style={styles.exerciseThumb} resizeMode="cover" />
                                    ) : (
                                        <View style={[styles.exerciseThumb, styles.thumbPlaceholder]}>
                                            <Text style={styles.thumbEmoji}>💪 </Text>
                                        </View>
                                    );
                                })()}
                            </View>
                            <Link href={{ pathname: '/fichas/exercicio', params: { workoutId: id, exerciseId: item.id } }} asChild>
                                <Pressable
                                    style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
                                    android_ripple={{ color: '#eaeaea' }}
                                    accessible
                                    accessibilityRole="button"
                                    accessibilityLabel={`Ver detalhes de ${item.name}`}
                                >
                                    <View style={styles.mainInfo}>
                                        <Text style={styles.exerciseName}>{item.name} </Text>
                                        <Text style={styles.muscleLine} numberOfLines={1} ellipsizeMode="tail">{item.muscle}</Text>
                                        <View style={styles.tagsRow}>
                                            <Text style={styles.tag}>Séries: {item.series} </Text>
                                            <Text style={styles.tag}>Reps: {item.reps} </Text>
                                        </View>
                                        {item.obs ? <Text style={styles.obsText}>Obs: {item.obs}</Text> : null}
                                    </View>
                                    <Text style={styles.chevron}>› </Text>
                                </Pressable>
                            </Link>
                        </View>
                        <View style={styles.prSection}>
                            <View style={styles.prBadge}><Text style={styles.prBadgeText}>PR</Text></View>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={performance[item.id] || ''}
                                onChangeText={(text) => handleWeightChange(item.id, text)}
                            />
                            <Text style={styles.unitText}>kg </Text>
                        </View>
                    </View>
                )}
                ListFooterComponent={
                    <Pressable style={styles.logButton} onPress={handleLogWorkout}>
                        <Text style={styles.logButtonText}>Contabilizar Treino </Text>
                    </Pressable>
                }
                ListFooterComponentStyle={{ paddingBottom: 30 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    header: { padding: 15, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'},
    headerText: { fontSize: 16, color: 'gray', fontWeight: '500'},
    logButton: { backgroundColor: themeColor, marginHorizontal: 15, marginTop: 20, padding: 15, borderRadius: 15, alignItems: 'center' },
    logButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    cardBody: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'center' },
    thumbWrapper: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' },
    exerciseThumb: { width: '100%', height: '100%' },
    thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    thumbEmoji: { fontSize: 22 },
    infoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mainInfo: { flex: 1, paddingRight: 8 },
    exerciseName: { fontSize: 16, fontWeight: '800', color: '#222', marginBottom: 6 },
    muscleLine: { fontSize: 13, color: themeColor, fontWeight: '700', marginBottom: 6 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { fontSize: 12, color: '#333', backgroundColor: '#f2f2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    tagMuted: { backgroundColor: '#eef1ff', color: themeColor },
    obsText: { fontSize: 12, color: '#777', marginTop: 8, fontStyle: 'italic' },
    prSection: { backgroundColor: '#fafafa', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    prLabel: { fontSize: 14, fontWeight: '900', color: '#555' },
    prBadge: { backgroundColor: '#eef1ff', borderColor: '#dfe3ff', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    prBadgeText: { color: themeColor, fontWeight: '800', fontSize: 12 },
    input: { backgroundColor: 'white', color: '#111', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, width: 80, textAlign: 'center', marginLeft: 10, borderWidth: 1, borderColor: '#ddd' },
    unitText: { fontSize: 14, color: '#666', marginLeft: 8 },
    chevron: { fontSize: 20, color: '#bbb', marginLeft: 8 },
    pressed: { opacity: 0.85 }
});