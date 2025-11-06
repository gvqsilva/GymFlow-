// app/perfil.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authService } from '../services/authService';
import { firebaseSyncService } from '../services/firebaseSync';
import { BMRInput, calculateTDEE } from '../utils/calorieCalculator';

const { width } = Dimensions.get('window');
const themeColor = '#5a4fcf';

// --- Funções Auxiliares ---
// Retorna a data no formato YYYY-MM-DD usando componentes de data local (evita usar toISOString que converte para UTC)
const getLocalDateString = (date: Date | string = new Date()) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const calculateAge = (birthDate: string | Date): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age > 0 ? age : 0;
};

const getBmiClassification = (imc: number) => {
    if (imc < 18.5) return { text: 'Abaixo do peso', color: '#3498db' };
    if (imc < 25) return { text: 'Peso ideal', color: '#2ecc71' };
    if (imc < 30) return { text: 'Sobrepeso', color: '#f39c12' };
    return { text: 'Obesidade', color: '#e74c3c' };
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const calculateIMC = (weight: number, height: number) => {
    if (weight > 0 && height > 0) {
        const heightInMeters = height / 100;
        const imc = weight / (heightInMeters * heightInMeters);
        const classification = getBmiClassification(imc);
        return {
            value: imc.toFixed(1),
            text: classification.text,
            color: classification.color,
        };
    }
    return { value: 'N/A', text: '', color: 'gray' };
};
// --- Fim das Funções Auxiliares ---

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [dailyConsumed, setDailyConsumed] = useState(0);
    const [dailySpent, setDailySpent] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [calorieGoal, setCalorieGoal] = useState(0);

    // Função para verificar status do Firebase (DEBUG)
    const checkFirebaseStatus = async () => {
        try {
            let firebaseProfile = null;
            
            // Verificar se a função existe antes de usar
            if (firebaseSyncService && typeof firebaseSyncService.loadProfile === 'function') {
                firebaseProfile = await firebaseSyncService.loadProfile();
            }
            
            const localProfile = await AsyncStorage.getItem('userProfile');
            
            Alert.alert(
                '🔍 Status de Sincronização',
                `Firebase: ${firebaseProfile ? '✅ Encontrado' : '❌ Não encontrado'}\n` +
                `Local: ${localProfile ? '✅ Encontrado' : '❌ Não encontrado'}\n` +
                `Usuário: ${authService.getCurrentUser()?.email || 'Não logado'}\n` +
                `Sync Habilitado: ${authService.shouldSyncWithFirebase() ? '✅ Sim' : '❌ Não'}\n` +
                `Função loadProfile: ${(firebaseSyncService && typeof firebaseSyncService.loadProfile === 'function') ? '✅ Disponível' : '❌ Não disponível'}`,
                [
                    { text: 'OK' },
                    { 
                        text: 'Ver Logs', 
                        onPress: () => {
                            console.log('🔍 DADOS FIREBASE:', firebaseProfile);
                            console.log('🔍 DADOS LOCAL:', localProfile ? JSON.parse(localProfile) : null);
                            console.log('🔍 FIREBASE SERVICE:', firebaseSyncService);
                        }
                    },
                    { 
                        text: '🧹 Reset Completo', 
                        style: 'destructive',
                        onPress: resetCompleteData
                    }
                ]
            );
        } catch (error) {
            Alert.alert('❌ Erro', `Erro ao verificar status: ${error}`);
        }
    };

    // Função para reset completo dos dados
    const resetCompleteData = async () => {
        Alert.alert(
            '⚠️ Reset Completo',
            'Isso vai apagar TODOS os dados locais e fazer logout. Continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: '🧹 Sim, Resetar', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Limpar AsyncStorage
                            await AsyncStorage.multiRemove([
                                'userProfile',
                                'firebase_user_id',
                                'user_email',
                                'user_credentials',
                                'first_login_completed',
                                'sports',
                                'supplements',
                                'workouts',
                                'foodHistory'
                            ]);
                            
                            // Fazer logout
                            await authService.logout();
                            
                            Alert.alert('✅ Reset Completo', 'Dados limpos! Reinicie o app e crie nova conta.');
                        } catch (error) {
                            Alert.alert('❌ Erro', `Erro no reset: ${error}`);
                        }
                    }
                }
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    // Checar se o usuário está autenticado
                    const current = authService.getCurrentUser();
                    setIsAuthenticated(!!current && authService.shouldSyncWithFirebase());

                    let loadedProfile = null;
                    
                    // Tentar carregar do Firebase primeiro se o usuário estiver autenticado
                    if (current && authService.shouldSyncWithFirebase()) {
                        try {
                            // Verificar se a função existe antes de chamá-la
                            if (firebaseSyncService && typeof firebaseSyncService.loadProfile === 'function') {
                                const firebaseProfile = await firebaseSyncService.loadProfile();
                                if (firebaseProfile) {
                                    console.log('✅ Carregando perfil do Firebase na home');
                                    loadedProfile = firebaseProfile;
                                    // Sincronizar com AsyncStorage local
                                    await AsyncStorage.setItem('userProfile', JSON.stringify(firebaseProfile));
                                }
                            } else {
                                console.warn('⚠️ Função loadProfile não está disponível no firebaseSyncService');
                            }
                        } catch (error) {
                            console.warn('⚠️ Erro ao carregar perfil do Firebase na home:', error);
                        }
                    }
                    
                    // Fallback para AsyncStorage se não conseguiu carregar do Firebase
                    if (!loadedProfile) {
                        const profileJSON = await AsyncStorage.getItem('userProfile');
                        loadedProfile = profileJSON ? JSON.parse(profileJSON) : null;
                        console.log('📱 Carregando perfil do AsyncStorage local na home');
                    }
                    
                    setProfile(loadedProfile);

                    const today = getLocalDateString();
                    
                    const foodHistoryJSON = await AsyncStorage.getItem('foodHistory');
                    const foodHistory = foodHistoryJSON ? JSON.parse(foodHistoryJSON) : [];
                    const consumed = foodHistory
                        .filter((entry: any) => entry.date === today)
                        .reduce((sum: number, entry: any) => sum + (entry.data?.calories || 0), 0);
                    setDailyConsumed(Math.round(consumed));
                    
                    const workoutHistoryJSON = await AsyncStorage.getItem('workoutHistory');
                    const workoutHistory = workoutHistoryJSON ? JSON.parse(workoutHistoryJSON) : [];
                    const spent = workoutHistory
                        .filter((entry: any) => entry.date === today)
                        .reduce((sum: number, entry: any) => sum + (entry.details?.calories || 0), 0);
                    setDailySpent(Math.round(spent));

                    if (loadedProfile) {
                        const age = calculateAge(loadedProfile.birthDate);
                        const weightNum = parseFloat(loadedProfile.weight || 0);
                        const heightNum = parseInt(loadedProfile.height || 0, 10);
                        const targetWeightNum = parseFloat(loadedProfile.targetWeight || 0);

                        if (weightNum > 0 && heightNum > 0 && age > 0 && loadedProfile.gender) {
                            const tdee = calculateTDEE({
                                weight: weightNum,
                                height: heightNum,
                                age: age,
                                gender: loadedProfile.gender,
                                activityLevel: loadedProfile.activityLevel || 'moderado',
                                targetWeight: targetWeightNum > 0 ? targetWeightNum : undefined,
                                goalDate: loadedProfile.goalDate,
                            } as BMRInput);
                            setCalorieGoal(tdee);
                        }
                    }
                } catch (e) {
                    console.error("Falha ao carregar dados do perfil:", e);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }, [])
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColor} />
            </SafeAreaView>
        );
    }

    // Se não há perfil salvo, permite ao usuário criar um — evita spinner infinito
    if (!profile) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Meu Perfil',
                        headerStyle: { backgroundColor: themeColor },
                        headerTintColor: '#fff',
                        headerTitleStyle: { fontWeight: 'bold' },
                    }}
                />

                <ScrollView contentContainerStyle={styles.emptyStateContainer}>
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="person-circle-outline" size={120} color={themeColor} />
                        </View>
                        
                        <Text style={styles.emptyTitle}>Bem-vindo ao GymFlow!</Text>
                        <Text style={styles.emptySubtitle}>
                            Para começar sua jornada fitness, vamos criar seu perfil personalizado
                        </Text>
                        
                        <View style={styles.benefitsList}>
                            <View style={styles.benefitItem}>
                                <Ionicons name="fitness" size={24} color={themeColor} />
                                <Text style={styles.benefitText}>Cálculo personalizado de calorias</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="analytics" size={24} color={themeColor} />
                                <Text style={styles.benefitText}>Acompanhamento do seu progresso</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="flag" size={24} color={themeColor} />
                                <Text style={styles.benefitText}>Metas personalizadas para você</Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={() => router.push('/perfil-modal')}
                            style={styles.createProfileButton}
                        >
                            <Ionicons name="add-circle" size={24} color="white" />
                            <Text style={styles.createProfileText}>Criar Meu Perfil</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        );
    }

    const age = calculateAge(profile.birthDate);
    const imcData = calculateIMC(profile.weight, profile.height);
    const netBalance = dailyConsumed - dailySpent;
    const remainingCalories = calorieGoal - dailyConsumed;

    // ✅ Textos dinâmicos
    const netBalanceText = netBalance < 0 ? 'Você gastou mais do que consumiu' : netBalance > 0 ? 'Você consumiu mais do que gastou' : 'Balanço neutro';
    const goalStatusText = remainingCalories < 0 ? 'Você ultrapassou a sua meta' : 'Abaixo da sua meta';
    if (dailyConsumed === calorieGoal && calorieGoal > 0) {
        // Se for exatamente igual, exibe uma mensagem de sucesso
        // goalStatusText = 'Você atingiu sua meta!';
    }


    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Meu Perfil',
                    headerStyle: { backgroundColor: themeColor },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Pressable onPress={checkFirebaseStatus} style={{ marginRight: 15 }}>
                                <Ionicons name="cloud-outline" size={24} color="white" />
                            </Pressable>
                            <Pressable onPress={() => router.push('/perfil-modal')}>
                                <Ionicons name="create" size={24} color="white" style={{ marginRight: 15 }} />
                            </Pressable>
                        </View>
                    ),
                }}
            />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileAvatarContainer}>
                        <View style={[
                            styles.profileAvatar, 
                            { backgroundColor: profile?.avatarColor || themeColor }
                        ]}>
                            <Text style={styles.avatarText}>
                                {profile?.name ? getInitials(profile.name) : 'US'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.profileName}>Olá, {profile.name}!</Text>
                    <Text style={styles.profileInfo}>
                        {age} anos • {profile.height}cm • {profile.gender}
                    </Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStatsContainer}>
                    <View style={styles.quickStatCard}>
                        <Ionicons name="scale" size={24} color={themeColor} />
                        <Text style={styles.quickStatValue}>{profile.weight}kg </Text>
                        <Text style={styles.quickStatLabel}>Peso Atual </Text>
                    </View>
                    
                    <View style={styles.quickStatCard}>
                        <Ionicons name="analytics" size={24} color={imcData.color} />
                        <Text style={[styles.quickStatValue, { color: imcData.color }]}>{imcData.value} </Text>
                        <Text style={styles.quickStatLabel}>IMC </Text>
                        <Text style={[styles.quickStatSubtext, { color: imcData.color }]}>{imcData.text} </Text>
                    </View>
                    
                    <View style={styles.quickStatCard}>
                        <Ionicons name="flame" size={24} color="#ff6b35" />
                        <Text style={[styles.quickStatValue, { color: '#ff6b35' }]}>{calorieGoal}</Text>
                        <Text style={styles.quickStatLabel}>Meta Diária </Text>
                        <Text style={styles.quickStatSubtext}>kcal </Text>
                    </View>
                </View>

                {/* Daily Progress */}
                <View style={styles.progressSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="today" size={20} color={themeColor} />
                        <Text style={styles.sectionTitle}>Progresso de Hoje </Text>
                    </View>
                    
                    <View style={styles.progressCard}>
                        <View style={styles.progressRow}>
                            <View style={styles.progressItem}>
                                <View style={[styles.progressIcon, { backgroundColor: '#e8f5e8' }]}>
                                    <Ionicons name="restaurant" size={20} color="#2ecc71" />
                                </View>
                                <Text style={styles.progressValue}>{dailyConsumed} </Text>
                                <Text style={styles.progressLabel}>Consumidas </Text>
                            </View>
                            
                            <View style={styles.progressDivider} />
                            
                            <View style={styles.progressItem}>
                                <View style={[styles.progressIcon, { backgroundColor: '#ffe8e8' }]}>
                                    <Ionicons name="fitness" size={20} color="#e74c3c" />
                                </View>
                                <Text style={styles.progressValue}>{dailySpent} </Text>
                                <Text style={styles.progressLabel}>Queimadas </Text>
                            </View>
                        </View>
                        
                        <View style={styles.balanceContainer}>
                            <Text style={styles.balanceLabel}>Balanço Energético </Text>
                            <Text style={[
                                styles.balanceValue, 
                                { color: netBalance > 0 ? '#f39c12' : netBalance < 0 ? '#2ecc71' : '#666' }
                            ]}>
                                {netBalance > 0 ? '+' : ''}{netBalance} kcal </Text>
                            <Text style={styles.balanceDescription}>{netBalanceText} </Text>
                        </View>
                    </View>
                </View>

                {/* Goal Progress */}
                <View style={styles.progressSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="trophy" size={20} color={themeColor} />
                        <Text style={styles.sectionTitle}>Meta Calórica </Text>
                    </View>
                    
                    <View style={styles.goalCard}>
                        <View style={styles.goalProgress}>
                            <View style={styles.goalProgressBar}>
                                <View 
                                    style={[
                                        styles.goalProgressFill,
                                        { 
                                            width: `${Math.min((dailyConsumed / calorieGoal) * 100, 100)}%`,
                                            backgroundColor: remainingCalories < 0 ? '#e74c3c' : '#2ecc71'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.goalPercentage}>
                                {Math.round((dailyConsumed / calorieGoal) * 100)}% </Text>
                        </View>
                        
                        <View style={styles.goalDetails}>
                            <View style={styles.goalDetailItem}>
                                <Text style={styles.goalDetailValue}>{dailyConsumed} </Text>
                                <Text style={styles.goalDetailLabel}>Consumidas </Text>
                            </View>
                            <View style={styles.goalDetailItem}>
                                <Text style={styles.goalDetailValue}>{calorieGoal} </Text>
                                <Text style={styles.goalDetailLabel}>Meta </Text>
                            </View>
                            <View style={styles.goalDetailItem}>
                                <Text style={[
                                    styles.goalDetailValue,
                                    { color: remainingCalories < 0 ? '#e74c3c' : '#2ecc71' }
                                ]}>
                                    {Math.abs(remainingCalories)} </Text>
                                <Text style={styles.goalDetailLabel}>
                                    {remainingCalories < 0 ? 'Excesso' : 'Restante'} </Text>
                            </View>
                        </View>
                        <Text style={styles.goalStatus}>{goalStatusText} </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings" size={20} color={themeColor} />
                        <Text style={styles.sectionTitle}>Ações Rápidas </Text>
                    </View>
                    
                    <View style={styles.actionsGrid}>
                        <Pressable 
                            style={styles.actionButton}
                            onPress={() => router.push('/perfil-modal')}
                        >
                            <Ionicons name="create" size={24} color={themeColor} />
                            <Text style={styles.actionButtonText}>Editar Perfil </Text>
                        </Pressable>
                        
                        <Pressable 
                            style={styles.actionButton}
                            onPress={() => router.push('/(tabs)')}
                        >
                            <Ionicons name="home" size={24} color={themeColor} />
                            <Text style={styles.actionButtonText}>Ir para Home </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    
    // Empty State
    emptyStateContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        marginVertical: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    benefitsList: {
        width: '100%',
        marginBottom: 30,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#f8f9fa',
        marginBottom: 12,
        borderRadius: 12,
    },
    benefitText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
        fontWeight: '500',
    },
    createProfileButton: {
        backgroundColor: themeColor,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: themeColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    createProfileText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    
    // Profile Header
    profileHeader: {
        backgroundColor: 'white',
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    profileAvatarContainer: {
        marginBottom: 15,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    profileName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    profileInfo: {
        fontSize: 16,
        color: '#666',
    },
    
    // Quick Stats
    quickStatsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 15,
    },
    quickStatCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    quickStatValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 8,
    },
    quickStatLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    quickStatSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    
    // Progress Section
    progressSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    progressCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressItem: {
        flex: 1,
        alignItems: 'center',
    },
    progressIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    progressValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
    },
    progressDivider: {
        width: 1,
        height: 50,
        backgroundColor: '#e9ecef',
        marginHorizontal: 20,
    },
    balanceContainer: {
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    balanceDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    
    // Goal Progress
    goalCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    goalProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    goalProgressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        marginRight: 15,
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    goalPercentage: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 50,
        textAlign: 'right',
    },
    goalDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    goalDetailItem: {
        alignItems: 'center',
    },
    goalDetailValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    goalDetailLabel: {
        fontSize: 14,
        color: '#666',
    },
    goalStatus: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    
    // Actions Section
    actionsSection: {
        marginBottom: 30,
    },
    actionsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 15,
    },
    actionButton: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#333',
        marginTop: 8,
        fontWeight: '600',
        textAlign: 'center',
    },
    
    // Legacy styles (manter compatibilidade)
    header: { marginBottom: 30, alignItems: 'center', paddingTop: 20 },
    greeting: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    subHeader: { fontSize: 16, color: 'gray', marginTop: 5 },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        marginHorizontal: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    cardContent: { flexDirection: 'row', justifyContent: 'space-around' },
    infoBox: { alignItems: 'center', flex: 1 },
    infoValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
    infoLabel: { fontSize: 14, color: 'gray', textAlign: 'center', marginTop: 5 },
    infoClassification: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
    netBalanceContainer: {
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    netBalanceValue: { fontSize: 32, fontWeight: 'bold', color: themeColor },
    cardSubtext: {
        fontSize: 14,
        color: 'gray',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    accessCard: {
        backgroundColor: '#fff7f0',
        borderColor: '#ffcc99',
        borderWidth: 1,
    },
});