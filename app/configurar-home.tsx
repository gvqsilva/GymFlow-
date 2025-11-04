// app/configurar-home.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const themeColor = '#5a4fcf';

interface VisibleMetrics {
    calories: boolean;
    activities: boolean;
    time: boolean;
}

interface UserGoals {
    dailyCalories: number;
    weeklyWorkouts: number;
    weeklyActivities: number;
    dailyTime: number;
}

export default function ConfigurarHomeScreen() {
    const router = useRouter();
    const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetrics>({
        calories: true,
        activities: true,
        time: true
    });
    const [userGoals, setUserGoals] = useState<UserGoals>({
        dailyCalories: 500,
        weeklyWorkouts: 4,
        weeklyActivities: 5,
        dailyTime: 120
    });
    const [loading, setLoading] = useState(true);

    // Carregar configurações existentes
    useEffect(() => {
        loadUserConfig();
    }, []);

    const loadUserConfig = async () => {
        try {
            const configJSON = await AsyncStorage.getItem('userConfig');
            if (configJSON) {
                const config = JSON.parse(configJSON);
                setVisibleMetrics(config.visibleMetrics || { calories: true, activities: true, time: true });
                setUserGoals(config.userGoals || { dailyCalories: 500, weeklyWorkouts: 4, weeklyActivities: 5, dailyTime: 120 });
            }
        } catch (e) {
            console.error("Failed to load user config.", e);
        } finally {
            setLoading(false);
        }
    };

    const saveUserConfig = async () => {
        try {
            const config = {
                visibleMetrics,
                userGoals
            };
            await AsyncStorage.setItem('userConfig', JSON.stringify(config));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            console.error("Failed to save user config.", e);
            Alert.alert('Erro', 'Não foi possível salvar as configurações.');
        }
    };

    const toggleMetric = (metric: keyof VisibleMetrics) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newVisibleMetrics = {
            ...visibleMetrics,
            [metric]: !visibleMetrics[metric]
        };
        setVisibleMetrics(newVisibleMetrics);
    };

    const updateGoal = (goalType: keyof UserGoals, increment: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const currentValue = userGoals[goalType];
        let newValue: number;
        
        switch (goalType) {
            case 'dailyCalories':
                newValue = increment ? currentValue + 50 : Math.max(50, currentValue - 50);
                break;
            case 'weeklyWorkouts':
                newValue = increment ? currentValue + 1 : Math.max(1, currentValue - 1);
                break;
            case 'weeklyActivities':
                newValue = increment ? currentValue + 1 : Math.max(1, currentValue - 1);
                break;
            case 'dailyTime':
                newValue = increment ? currentValue + 15 : Math.max(15, currentValue - 15);
                break;
            default:
                return;
        }
        
        setUserGoals({
            ...userGoals,
            [goalType]: newValue
        });
    };

    const resetToDefaults = () => {
        Alert.alert(
            'Restaurar Padrões',
            'Deseja restaurar todas as configurações para os valores padrão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Restaurar',
                    style: 'destructive',
                    onPress: () => {
                        setVisibleMetrics({ calories: true, activities: true, time: true });
                        setUserGoals({ dailyCalories: 500, weeklyWorkouts: 4, weeklyActivities: 5, dailyTime: 120 });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                }
            ]
        );
    };

    // Salvar automaticamente quando houver mudanças
    useEffect(() => {
        if (!loading) {
            saveUserConfig();
        }
    }, [visibleMetrics, userGoals, loading]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando configurações...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen 
                options={{ 
                    headerShown: true, 
                    title: "Configurar Tela Home",
                    headerStyle: { backgroundColor: themeColor },
                    headerTintColor: '#fff',
                }} 
            />
            <ScrollView style={styles.container}>
                
                {/* Seção de Visibilidade dos Cards */}
                <Text style={styles.sectionHeader}>Visibilidade dos Cards</Text>
                <Text style={styles.sectionDescription}>
                    Escolha quais métricas devem aparecer na tela principal
                </Text>

                <View style={styles.card}>
                    <View style={styles.metricRow}>
                        <View style={styles.metricInfo}>
                            <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
                            <View style={styles.metricTextContainer}>
                                <Text style={styles.metricTitle}>Calorias</Text>
                                <Text style={styles.metricSubtitle}>Mostra o gasto calórico diário</Text>
                            </View>
                        </View>
                        <Switch
                            value={visibleMetrics.calories}
                            onValueChange={() => toggleMetric('calories')}
                            trackColor={{ false: '#E0E0E0', true: themeColor + '40' }}
                            thumbColor={visibleMetrics.calories ? themeColor : '#fff'}
                        />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.metricRow}>
                        <View style={styles.metricInfo}>
                            <Ionicons name="bar-chart-outline" size={24} color="#4ECDC4" />
                            <View style={styles.metricTextContainer}>
                                <Text style={styles.metricTitle}>Atividades</Text>
                                <Text style={styles.metricSubtitle}>Contador de atividades semanais</Text>
                            </View>
                        </View>
                        <Switch
                            value={visibleMetrics.activities}
                            onValueChange={() => toggleMetric('activities')}
                            trackColor={{ false: '#E0E0E0', true: themeColor + '40' }}
                            thumbColor={visibleMetrics.activities ? themeColor : '#fff'}
                        />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.metricRow}>
                        <View style={styles.metricInfo}>
                            <Ionicons name="time-outline" size={24} color="#45B7D1" />
                            <View style={styles.metricTextContainer}>
                                <Text style={styles.metricTitle}>Tempo</Text>
                                <Text style={styles.metricSubtitle}>Duração total das atividades</Text>
                            </View>
                        </View>
                        <Switch
                            value={visibleMetrics.time}
                            onValueChange={() => toggleMetric('time')}
                            trackColor={{ false: '#E0E0E0', true: themeColor + '40' }}
                            thumbColor={visibleMetrics.time ? themeColor : '#fff'}
                        />
                    </View>
                </View>

                {/* Seção de Metas Personalizadas */}
                <Text style={styles.sectionHeader}>Metas Personalizadas</Text>
                <Text style={styles.sectionDescription}>
                    Ajuste suas metas individuais para melhor acompanhamento
                </Text>

                <View style={styles.card}>
                    <View style={styles.goalRow}>
                        <View style={styles.goalInfo}>
                            <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
                            <View style={styles.goalTextContainer}>
                                <Text style={styles.goalTitle}>Meta Diária de Calorias</Text>
                                <Text style={styles.goalSubtitle}>Objetivo de queima calórica por dia</Text>
                            </View>
                        </View>
                        <View style={styles.goalControls}>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('dailyCalories', false)}
                            >
                                <Ionicons name="remove" size={20} color={themeColor} />
                            </TouchableOpacity>
                            <Text style={styles.goalValue}>{userGoals.dailyCalories} kcal</Text>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('dailyCalories', true)}
                            >
                                <Ionicons name="add" size={20} color={themeColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.goalRow}>
                        <View style={styles.goalInfo}>
                            <Ionicons name="barbell-outline" size={24} color="#4ECDC4" />
                            <View style={styles.goalTextContainer}>
                                <Text style={styles.goalTitle}>Treinos Semanais</Text>
                                <Text style={styles.goalSubtitle}>Número de treinos por semana</Text>
                            </View>
                        </View>
                        <View style={styles.goalControls}>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('weeklyWorkouts', false)}
                            >
                                <Ionicons name="remove" size={20} color={themeColor} />
                            </TouchableOpacity>
                            <Text style={styles.goalValue}>{userGoals.weeklyWorkouts} treinos</Text>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('weeklyWorkouts', true)}
                            >
                                <Ionicons name="add" size={20} color={themeColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.goalRow}>
                        <View style={styles.goalInfo}>
                            <Ionicons name="trending-up-outline" size={24} color="#FF9500" />
                            <View style={styles.goalTextContainer}>
                                <Text style={styles.goalTitle}>Atividades Semanais</Text>
                                <Text style={styles.goalSubtitle}>Total de atividades físicas por semana</Text>
                            </View>
                        </View>
                        <View style={styles.goalControls}>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('weeklyActivities', false)}
                            >
                                <Ionicons name="remove" size={20} color={themeColor} />
                            </TouchableOpacity>
                            <Text style={styles.goalValue}>{userGoals.weeklyActivities} atividades</Text>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('weeklyActivities', true)}
                            >
                                <Ionicons name="add" size={20} color={themeColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.goalRow}>
                        <View style={styles.goalInfo}>
                            <Ionicons name="time-outline" size={24} color="#45B7D1" />
                            <View style={styles.goalTextContainer}>
                                <Text style={styles.goalTitle}>Tempo Diário</Text>
                                <Text style={styles.goalSubtitle}>Duração total de atividades por dia</Text>
                            </View>
                        </View>
                        <View style={styles.goalControls}>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('dailyTime', false)}
                            >
                                <Ionicons name="remove" size={20} color={themeColor} />
                            </TouchableOpacity>
                            <Text style={styles.goalValue}>{userGoals.dailyTime} min</Text>
                            <TouchableOpacity 
                                style={styles.goalButton}
                                onPress={() => updateGoal('dailyTime', true)}
                            >
                                <Ionicons name="add" size={20} color={themeColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Botão de Reset */}
                <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
                    <Ionicons name="refresh-outline" size={20} color="#FF6B6B" />
                    <Text style={styles.resetButtonText}>Restaurar Padrões</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f0f2f5' 
    },
    container: { 
        flex: 1, 
        paddingTop: 10 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    sectionHeader: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#333', 
        paddingHorizontal: 20, 
        marginTop: 20, 
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 20,
        marginBottom: 15,
        lineHeight: 20,
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    metricInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    metricTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    metricTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    metricSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 4,
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    goalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    goalTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    goalSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    goalControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: themeColor + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 16,
        minWidth: 80,
        textAlign: 'center',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
        marginLeft: 8,
    },
    bottomSpacing: {
        height: 30,
    },
});