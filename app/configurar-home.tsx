// app/configurar-home.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { authService } from '../services/authService';
import { firebaseSyncService } from '../services/firebaseSync';

const themeColor = '#5a4fcf';

interface UserGoals {
    dailyCalories: number;
    weeklyWorkouts: number;
    weeklyActivities: number;
    dailyTime: number;
}

interface VisibleMetrics {
    calories: boolean;
    activities: boolean;
    time: boolean;
}

const defaultGoals: UserGoals = {
    dailyCalories: 600,
    weeklyWorkouts: 4,
    weeklyActivities: 8,
    dailyTime: 120,
};

const defaultVisibility: VisibleMetrics = {
    calories: true,
    activities: true,
    time: true,
};

export default function ConfigurarHomeScreen() {
    const router = useRouter();
    const [goals, setGoals] = useState<UserGoals>(defaultGoals);
    const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetrics>(defaultVisibility);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            console.log('📖 Carregando configurações...');
            
            // Se está autenticado e pode sincronizar com Firebase
            if (authService.shouldSyncWithFirebase() && !authService.isInOfflineMode()) {
                console.log('🔥 Carregando configurações do Firebase...');
                
                // Tentar carregar do Firebase primeiro
                const firebaseConfig = await firebaseSyncService.loadUserConfig();
                if (firebaseConfig) {
                    console.log('🔥 Configurações do Firebase:', firebaseConfig);
                    
                    if (firebaseConfig.userGoals) {
                        setGoals({ ...defaultGoals, ...firebaseConfig.userGoals });
                        console.log('🎯 Metas carregadas do Firebase:', firebaseConfig.userGoals);
                    }
                    if (firebaseConfig.visibleMetrics) {
                        setVisibleMetrics({ ...defaultVisibility, ...firebaseConfig.visibleMetrics });
                        console.log('👁️ Visibilidade carregada do Firebase:', firebaseConfig.visibleMetrics);
                    }
                    
                    // Salvar também localmente para cache
                    await AsyncStorage.setItem('userConfig', JSON.stringify(firebaseConfig));
                    return;
                }
                console.log('🔥 Nenhuma configuração encontrada no Firebase, tentando local...');
            }
            
            // Fallback para AsyncStorage local
            const savedConfig = await AsyncStorage.getItem('userConfig');
            console.log('� Carregando configurações locais:', savedConfig);
            
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                console.log('� Config local parseado:', config);
                
                if (config.userGoals) {
                    setGoals({ ...defaultGoals, ...config.userGoals });
                    console.log('🎯 Metas carregadas localmente:', config.userGoals);
                }
                if (config.visibleMetrics) {
                    setVisibleMetrics({ ...defaultVisibility, ...config.visibleMetrics });
                    console.log('👁️ Visibilidade carregada localmente:', config.visibleMetrics);
                }
            } else {
                console.log('� Nenhuma configuração local encontrada, usando padrões');
            }
        } catch (error) {
            console.warn('❌ Erro ao carregar configurações:', error);
            Toast.show({
                type: 'error',
                text1: 'Erro ao carregar configurações',
                text2: 'Usando configurações padrão',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            console.log('💾 Salvando configurações...');
            
            // Primeiro carregar configuração existente para não sobrescrever outros dados
            let existingConfig = {};
            
            // Se está autenticado e pode sincronizar com Firebase
            if (authService.shouldSyncWithFirebase() && !authService.isInOfflineMode()) {
                console.log('🔥 Carregando configuração existente do Firebase...');
                try {
                    const firebaseConfig = await firebaseSyncService.loadUserConfig();
                    if (firebaseConfig) {
                        existingConfig = firebaseConfig;
                        console.log('🔥 Configuração existente do Firebase:', existingConfig);
                    }
                } catch (firebaseError) {
                    console.warn('🔥 Erro ao carregar do Firebase, usando local:', firebaseError);
                }
            }
            
            // Fallback para AsyncStorage local se não conseguiu do Firebase
            if (Object.keys(existingConfig).length === 0) {
                const existingConfigJSON = await AsyncStorage.getItem('userConfig');
                existingConfig = existingConfigJSON ? JSON.parse(existingConfigJSON) : {};
                console.log('📱 Configuração existente local:', existingConfig);
            }
            
            // Mesclar com as novas configurações
            const config = {
                ...existingConfig,
                userGoals: goals,
                visibleMetrics: visibleMetrics,
                lastModified: new Date().toISOString(),
                version: '1.0'
            };
            
            console.log('💾 Config final a ser salvo:', config);
            
            // Salvar localmente primeiro (para cache)
            await AsyncStorage.setItem('userConfig', JSON.stringify(config));
            console.log('📱 Configurações salvas localmente');
            
            // Se está autenticado e pode sincronizar com Firebase
            if (authService.shouldSyncWithFirebase() && !authService.isInOfflineMode()) {
                console.log('🔥 Sincronizando com Firebase...');
                
                try {
                    await firebaseSyncService.saveUserConfig(config);
                    console.log('🔥 Configurações sincronizadas com Firebase com sucesso');
                    
                    Toast.show({
                        type: 'success',
                        text1: 'Configurações salvas',
                        text2: 'Sincronizadas com a nuvem ☁️',
                    });
                } catch (firebaseError) {
                    console.warn('🔥 Erro ao sincronizar com Firebase:', firebaseError);
                    Toast.show({
                        type: 'info',
                        text1: 'Configurações salvas',
                        text2: 'Apenas localmente (sem conexão)',
                    });
                }
            } else {
                console.log('📱 Salvando apenas localmente (offline ou não autenticado)');
                Toast.show({
                    type: 'success',
                    text1: 'Configurações salvas',
                    text2: 'Volte à home para ver as alterações',
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            Toast.show({
                type: 'error',
                text1: 'Erro ao salvar',
                text2: 'Tente novamente',
            });
        }
    };

    const updateGoal = async (key: keyof UserGoals, increment: boolean) => {
        const newGoals = { ...goals };
        const step = key === 'dailyCalories' ? 50 : key === 'dailyTime' ? 10 : 1;
        const min = key === 'dailyCalories' ? 50 : key === 'dailyTime' ? 10 : 1;
        const max = key === 'dailyCalories' ? 2000 : key === 'dailyTime' ? 300 : 20;

        if (increment) {
            newGoals[key] = Math.min(newGoals[key] + step, max);
        } else {
            newGoals[key] = Math.max(newGoals[key] - step, min);
        }
        
        console.log(`🎯 Alterando ${key} para ${newGoals[key]}`);
        
        setGoals(newGoals);
        
        // Salvar imediatamente
        try {
            const existingConfigJSON = await AsyncStorage.getItem('userConfig');
            const existingConfig = existingConfigJSON ? JSON.parse(existingConfigJSON) : {};
            
            const config = {
                ...existingConfig,
                userGoals: newGoals, // Usar as novas metas
                visibleMetrics: visibleMetrics
            };
            
            await AsyncStorage.setItem('userConfig', JSON.stringify(config));
            console.log('✅ Metas salvas imediatamente:', config.userGoals);
        } catch (error) {
            console.error('❌ Erro ao salvar metas:', error);
        }
    };

    const toggleMetricVisibility = async (metric: keyof VisibleMetrics) => {
        const newValue = !visibleMetrics[metric];
        const newVisibility = { ...visibleMetrics, [metric]: newValue };
        
        console.log(`🔄 Alterando ${metric} de ${visibleMetrics[metric]} para ${newValue}`);
        console.log('👁️ Nova visibilidade:', newVisibility);
        
        setVisibleMetrics(newVisibility);
        
        // Salvar imediatamente
        try {
            const existingConfigJSON = await AsyncStorage.getItem('userConfig');
            const existingConfig = existingConfigJSON ? JSON.parse(existingConfigJSON) : {};
            
            const config = {
                ...existingConfig,
                userGoals: goals,
                visibleMetrics: newVisibility // Usar a nova visibilidade
            };
            
            await AsyncStorage.setItem('userConfig', JSON.stringify(config));
            console.log('✅ Visibilidade salva imediatamente:', config.visibleMetrics);
            
            Toast.show({
                type: 'success',
                text1: `Card ${metric} ${newValue ? 'ativado' : 'desativado'}`,
                text2: 'Configuração salva automaticamente',
            });
        } catch (error) {
            console.error('❌ Erro ao salvar visibilidade:', error);
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
                    onPress: () => {
                        setGoals(defaultGoals);
                        setVisibleMetrics(defaultVisibility);
                        saveSettings();
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