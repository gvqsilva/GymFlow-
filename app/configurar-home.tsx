// app/configurar-home.tsx

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { DEFAULT_USER_GOALS, DEFAULT_VISIBLE_METRICS, UserGoals, useUserConfig, VisibleMetrics } from '../hooks/useUserConfig';

const themeColor = '#5a4fcf';

export default function ConfigurarHomeScreen() {
    const router = useRouter();
    const {
        userConfig,
        updateHomePreferences,
        resetHomePreferences,
        isLoading: isConfigLoading,
    } = useUserConfig();

    const [goals, setGoals] = useState<UserGoals>({ ...DEFAULT_USER_GOALS });
    const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetrics>({ ...DEFAULT_VISIBLE_METRICS });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(isConfigLoading);
    }, [isConfigLoading]);

    useEffect(() => {
        if (isConfigLoading) {
            return;
        }

        const mergedGoals = {
            ...DEFAULT_USER_GOALS,
            ...(userConfig?.userGoals || {}),
        };

        const mergedVisibility = {
            ...DEFAULT_VISIBLE_METRICS,
            ...(userConfig?.visibleMetrics || {}),
        };

        setGoals(mergedGoals);
        setVisibleMetrics(mergedVisibility);
        setIsLoading(false);
    }, [isConfigLoading, userConfig]);

    const updateGoal = async (key: keyof UserGoals, increment: boolean) => {
        const previousGoals = { ...goals };
        const newGoals = { ...goals };
        const step = key === 'dailyCalories' ? 50 : key === 'dailyTime' ? 10 : 1;
        const min = key === 'dailyCalories' ? 50 : key === 'dailyTime' ? 10 : 1;
        const max = key === 'dailyCalories' ? 2000 : key === 'dailyTime' ? 300 : 20;

        newGoals[key] = increment
            ? Math.min(newGoals[key] + step, max)
            : Math.max(newGoals[key] - step, min);

        console.log(`🎯 Alterando ${key} para ${newGoals[key]}`);

        setGoals(newGoals);

        try {
            await updateHomePreferences({ userGoals: newGoals });
        } catch (error) {
            console.error('❌ Erro ao salvar metas:', error);
            setGoals(previousGoals);
            Toast.show({
                type: 'error',
                text1: 'Erro ao salvar metas',
                text2: 'Tente novamente',
            });
        }
    };

    const toggleMetricVisibility = async (metric: keyof VisibleMetrics) => {
        const previousVisibility = { ...visibleMetrics };
        const newValue = !visibleMetrics[metric];
        const newVisibility = { ...visibleMetrics, [metric]: newValue };

        console.log(`� Alterando ${metric} de ${visibleMetrics[metric]} para ${newValue}`);
        console.log('�️ Nova visibilidade:', newVisibility);

        setVisibleMetrics(newVisibility);

        try {
            await updateHomePreferences({ visibleMetrics: newVisibility });
            Toast.show({
                type: 'success',
                text1: `Card ${metric} ${newValue ? 'ativado' : 'desativado'}`,
                text2: 'Configuração salva automaticamente',
            });
        } catch (error) {
            console.error('❌ Erro ao salvar visibilidade:', error);
            setVisibleMetrics(previousVisibility);
            Toast.show({
                type: 'error',
                text1: 'Erro ao atualizar visibilidade',
                text2: 'Tente novamente',
            });
        }
    };

    const resetToDefault = () => {
        Alert.alert(
            'Restaurar Padrão',
            'Tem certeza que deseja restaurar todas as configurações para o padrão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Restaurar',
                    style: 'destructive',
                    onPress: async () => {
                        const previousGoals = { ...goals };
                        const previousVisibility = { ...visibleMetrics };
                        const defaultGoals = { ...DEFAULT_USER_GOALS };
                        const defaultVisibility = { ...DEFAULT_VISIBLE_METRICS };

                        setGoals(defaultGoals);
                        setVisibleMetrics(defaultVisibility);

                        try {
                            await resetHomePreferences();
                            Toast.show({
                                type: 'success',
                                text1: 'Configurações restauradas',
                                text2: 'Padrões aplicados à Home',
                            });
                        } catch (error) {
                            console.error('❌ Erro ao restaurar configurações:', error);
                            setGoals(previousGoals);
                            setVisibleMetrics(previousVisibility);
                            Toast.show({
                                type: 'error',
                                text1: 'Erro ao restaurar',
                                text2: 'Tente novamente',
                            });
                        }
                    },
                },
            ]
        );
    };

    const VisibilityCard = ({ 
        title, 
        subtitle, 
        icon, 
        iconColor,
        value, 
        onValueChange 
    }: {
        title: string;
        subtitle: string;
        icon: string;
        iconColor: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
    }) => (
        <View style={styles.visibilityItem}>
            <View style={styles.visibilityLeft}>
                <Ionicons name={icon as any} size={24} color={iconColor} />
                <View style={styles.visibilityText}>
                    <Text style={styles.visibilityTitle}>{title}</Text>
                    <Text style={styles.visibilitySubtitle}>{subtitle}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#e0e0e0', true: `${themeColor}40` }}
                thumbColor={value ? themeColor : '#f4f3f4'}
            />
        </View>
    );

    const GoalCard = ({ 
        title, 
        subtitle, 
        icon, 
        iconColor,
        value, 
        unit,
        onDecrease,
        onIncrease
    }: {
        title: string;
        subtitle: string;
        icon: string;
        iconColor: string;
        value: number;
        unit: string;
        onDecrease: () => void;
        onIncrease: () => void;
    }) => (
        <View style={styles.goalCard}>
            <View style={styles.goalLeft}>
                <Ionicons name={icon as any} size={24} color={iconColor} />
                <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>{title}</Text>
                    <Text style={styles.goalSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <View style={styles.goalControls}>
                <Pressable style={styles.controlButton} onPress={onDecrease}>
                    <Ionicons name="remove" size={20} color={themeColor} />
                </Pressable>
                <Text style={styles.goalValue}>{value} {unit}</Text>
                <Pressable style={styles.controlButton} onPress={onIncrease}>
                    <Ionicons name="add" size={20} color={themeColor} />
                </Pressable>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loading}>
                    <Text>Carregando...</Text>
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
                
                {/* Seção Visibilidade dos Cards */}
                <Text style={styles.sectionHeader}>Visibilidade dos Cards</Text>
                <Text style={styles.sectionSubtitle}>Escolha quais métricas devem aparecer na tela principal</Text>
                
                <View style={styles.visibilityContainer}>
                    <VisibilityCard
                        title="Calorias"
                        subtitle="Mostra o gasto calórico diário"
                        icon="flame"
                        iconColor="#FF6B6B"
                        value={visibleMetrics.calories}
                        onValueChange={() => toggleMetricVisibility('calories')}
                    />
                    
                    <View style={styles.separator} />
                    
                    <VisibilityCard
                        title="Atividades"
                        subtitle="Contador de atividades semanais"
                        icon="bar-chart"
                        iconColor="#4ECDC4"
                        value={visibleMetrics.activities}
                        onValueChange={() => toggleMetricVisibility('activities')}
                    />
                    
                    <View style={styles.separator} />
                    
                    <VisibilityCard
                        title="Tempo"
                        subtitle="Duração total das atividades"
                        icon="time"
                        iconColor="#45B7D1"
                        value={visibleMetrics.time}
                        onValueChange={() => toggleMetricVisibility('time')}
                    />
                </View>

                {/* Seção Metas Personalizadas */}
                <Text style={styles.sectionHeader}>Metas Personalizadas</Text>
                <Text style={styles.sectionSubtitle}>Ajuste suas metas individuais para melhor acompanhamento</Text>

                <GoalCard
                    title="Meta Diária de Calorias"
                    subtitle="Objetivo de queima calórica por dia"
                    icon="flame"
                    iconColor="#FF6B6B"
                    value={goals.dailyCalories}
                    unit="kcal"
                    onDecrease={() => updateGoal('dailyCalories', false)}
                    onIncrease={() => updateGoal('dailyCalories', true)}
                />

                <GoalCard
                    title="Treinos Semanais"
                    subtitle="Número de treinos por semana"
                    icon="barbell"
                    iconColor="#4ECDC4"
                    value={goals.weeklyWorkouts}
                    unit="treinos"
                    onDecrease={() => updateGoal('weeklyWorkouts', false)}
                    onIncrease={() => updateGoal('weeklyWorkouts', true)}
                />

                <GoalCard
                    title="Atividades Semanais"
                    subtitle="Total de atividades físicas por semana"
                    icon="trending-up"
                    iconColor="#FFA726"
                    value={goals.weeklyActivities}
                    unit="atividades"
                    onDecrease={() => updateGoal('weeklyActivities', false)}
                    onIncrease={() => updateGoal('weeklyActivities', true)}
                />

                <GoalCard
                    title="Tempo Diário"
                    subtitle="Duração total de exercícios por dia"
                    icon="time"
                    iconColor="#45B7D1"
                    value={goals.dailyTime}
                    unit="min"
                    onDecrease={() => updateGoal('dailyTime', false)}
                    onIncrease={() => updateGoal('dailyTime', true)}
                />

                {/* Botão Restaurar */}
                <Pressable style={styles.resetButton} onPress={resetToDefault}>
                    <Ionicons name="refresh-outline" size={20} color="#FF3B30" />
                    <Text style={styles.resetButtonText}>Restaurar Configurações Padrão</Text>
                </Pressable>

                {/* Botão para ver resultado */}
                <Pressable 
                    style={styles.previewButton} 
                    onPress={() => {
                        router.push('/(tabs)');
                        Toast.show({
                            type: 'info',
                            text1: 'Configurações aplicadas',
                            text2: 'Veja os cards atualizados na home',
                        });
                    }}
                >
                    <Ionicons name="eye-outline" size={20} color={themeColor} />
                    <Text style={styles.previewButtonText}>Ver Resultado na Home</Text>
                </Pressable>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        paddingTop: 20,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 20,
        marginBottom: 20,
        lineHeight: 20,
    },
    visibilityContainer: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 16,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    visibilityItem: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    visibilityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    visibilityText: {
        marginLeft: 15,
        flex: 1,
    },
    visibilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    visibilitySubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 20,
    },
    goalCard: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    goalLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    goalText: {
        marginLeft: 15,
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    goalSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    goalControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    controlButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    goalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        minWidth: 80,
        textAlign: 'center',
    },
    resetButton: {
        backgroundColor: '#fff5f5',
        borderColor: '#ffdddd',
        borderWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 30,
        marginBottom: 30,
    },
    resetButtonText: {
        color: '#FF3B30',
        fontWeight: '600',
        fontSize: 16,
    },
    previewButton: {
        backgroundColor: '#f0f8ff',
        borderColor: '#b3d9ff',
        borderWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 30,
    },
    previewButtonText: {
        color: themeColor,
        fontWeight: '600',
        fontSize: 16,
    },
});