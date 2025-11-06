// app/(tabs)/config.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authService } from '../../services/authService';

const themeColor = '#5a4fcf';

export default function SettingsScreen() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [storageStats, setStorageStats] = useState<{
        workoutEntries: number;
        foodEntries: number;
        supplementEntries: number;
    }>({ workoutEntries: 0, foodEntries: 0, supplementEntries: 0 });

    useEffect(() => {
        // Verificar se o usuário está autenticado
        const checkUserStatus = async () => {
            const currentUser = authService.getCurrentUser();
            setIsAuthenticated(!!currentUser && authService.shouldSyncWithFirebase());
            setIsOfflineMode(authService.isInOfflineMode());
            setUserEmail(currentUser?.email || null);

            // Verificar status de sincronização
            if (currentUser) {
                // Status verificado apenas para autenticação
            } else {
                // Usuário não conectado
            }

            // Carregar estatísticas de armazenamento
            await loadStorageStats();
        };

        checkUserStatus();
        
        // Verificar novamente quando a tela ganhar foco (caso o usuário faça login)
        const interval = setInterval(checkUserStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadStorageStats = async () => {
        try {
            // Carregar dados de treinos
            const workoutHistoryJSON = await AsyncStorage.getItem('workoutHistory');
            const workoutHistory = workoutHistoryJSON ? JSON.parse(workoutHistoryJSON) : [];
            
            // Carregar dados de alimentação
            const foodHistoryJSON = await AsyncStorage.getItem('foodHistory');
            const foodHistory = foodHistoryJSON ? JSON.parse(foodHistoryJSON) : [];
            
            // Carregar dados de suplementos
            const supplementsHistoryJSON = await AsyncStorage.getItem('supplements_history');
            const supplementsHistory = supplementsHistoryJSON ? JSON.parse(supplementsHistoryJSON) : {};
            
            // Contar entradas de suplementos
            const supplementEntries = Object.keys(supplementsHistory).reduce((total, date) => {
                return total + Object.keys(supplementsHistory[date]).length;
            }, 0);

            setStorageStats({
                workoutEntries: workoutHistory.length,
                foodEntries: foodHistory.length,
                supplementEntries: supplementEntries,
            });
        } catch (error) {
            console.warn('Erro ao carregar estatísticas de armazenamento:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair? Seus dados ficarão salvos apenas no dispositivo até fazer login novamente.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.logout();
                            Alert.alert('Logout realizado', 'Agora você está no modo offline. Seus dados estão salvos apenas neste dispositivo.');
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao fazer logout');
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen 
                options={{ 
                    headerShown: true, 
                    title: "Configurações",
                    headerStyle: { backgroundColor: themeColor },
                    headerTintColor: '#fff',
                }} 
            />
            <ScrollView style={styles.container}>
                {/* Seção de Conta */}
                <Text style={styles.sectionHeader}>Conta</Text>
                
                {isOfflineMode ? (
                    /* Modo Offline */
                    <View style={[styles.linkCard, styles.accessCard]}>
                        <Ionicons name="cloud-offline-outline" size={32} color="#FF3B30" />
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Modo Offline</Text>
                            <Text style={styles.cardSubtitle}>Dados salvos apenas neste dispositivo</Text>
                        </View>
                        <Pressable 
                            style={styles.actionButton} 
                            onPress={() => router.push('/login')}
                        >
                            <Text style={styles.actionButtonText}>Entrar</Text>
                        </Pressable>
                    </View>
                ) : (
                    /* Usuário Autenticado - Card Simples */
                    <View style={[styles.linkCard, styles.accountCard]}>
                        <Ionicons name="person-circle" size={32} color="#34C759" />
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Conta Conectada</Text>
                            <Text style={styles.cardSubtitle}>{userEmail || 'Usuário autenticado'}</Text>
                        </View>
                        <Pressable 
                            style={styles.logoutButton} 
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutButtonText}>Sair</Text>
                        </Pressable>
                    </View>
                )}

                <Text style={styles.sectionHeader}>Armazenamento</Text>

                {/* Card sobre Nuvem - Clicável para tela dedicada */}
                <Pressable style={[styles.linkCard, styles.cloudCard]} onPress={() => router.push('/cloud-info')}>
                    <Ionicons name="cloud" size={28} color="#007AFF" />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>☁️ Backup na Nuvem</Text>
                        <Text style={styles.cardSubtitle}>
                            {isAuthenticated 
                                ? `${storageStats.workoutEntries + storageStats.foodEntries + storageStats.supplementEntries} registros protegidos`
                                : 'Proteja seus dados na nuvem'
                            }
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                </Pressable>

                <Text style={styles.sectionHeader}>Dados e Progresso</Text>

                <Pressable style={styles.linkCard} onPress={() => router.push('/perfil')}>
                    <Ionicons name="person-circle-outline" size={28} color={themeColor} />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Meu Perfil</Text>
                        <Text style={styles.cardSubtitle}>Consulte e edite os seus dados e metas </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="gray" />
                </Pressable>

                <Pressable style={styles.linkCard} onPress={() => router.push('/gestao-dados')}>
                    <Ionicons name="calendar-outline" size={28} color={themeColor} />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Gestão de Dados</Text>
                        <Text style={styles.cardSubtitle}>Histórico mensal de atividades, suplementos e Kcal </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="gray" />
                </Pressable>
                
                <Text style={styles.sectionHeader}>Personalização</Text>

                <Pressable style={styles.linkCard} onPress={() => router.push('/gerir-suplementos')}>
                    <Ionicons name="flask-outline" size={28} color={themeColor} />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Gerir Suplementos</Text>
                        <Text style={styles.cardSubtitle}>Adicione, remova e configure lembretes </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="gray" />
                </Pressable>

                <Pressable style={styles.linkCard} onPress={() => router.push('/gerir-fichas')}>
                    <Ionicons name="document-text-outline" size={28} color={themeColor} />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Gerir Fichas de Treino</Text>
                        <Text style={styles.cardSubtitle}>Crie e personalize as suas fichas </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="gray" />
                </Pressable>

                <Pressable style={styles.linkCard} onPress={() => router.push('/gerir-esportes')}>
                    <Ionicons name="football-outline" size={28} color={themeColor} />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Gerir Esportes</Text>
                        <Text style={styles.cardSubtitle}>Adicione ou remova outras modalidades </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="gray" />
                </Pressable>

                <Pressable style={styles.linkCard} onPress={() => router.push('/configurar-home')}>
                    <Ionicons name="trophy-outline" size={28} color={themeColor} />
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Configurar Metas</Text>
                        <Text style={styles.cardSubtitle}>Defina as metas que aparecem na home </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="gray" />
                </Pressable>

                

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1, paddingTop: 10 },
    sectionHeader: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: 'gray', 
        paddingHorizontal: 20, 
        marginTop: 20, 
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    linkCard: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginHorizontal: 20,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 1 },
    },
    cardTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'gray',
        marginTop: 2,
    },
    accessCard: {
        backgroundColor: '#fff7f0',
        borderColor: '#ffcc99',
        borderWidth: 1,
    },
    offlineCard: {
        backgroundColor: '#fff0f0',
        borderColor: '#ffcccc',
        borderWidth: 1,
    },
    authenticatedCard: {
        backgroundColor: '#f0fff4',
        borderColor: '#ccffdd',
        borderWidth: 1,
    },
    logoutCard: {
        backgroundColor: '#fff5f5',
        borderColor: '#ffdddd',
        borderWidth: 1,
    },
    logoutText: {
        color: '#ff3b30',
    },
    syncCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    infoCard: {
        backgroundColor: '#f8f9ff',
        borderColor: '#e1e5ff',
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    infoCardContent: {
        flex: 1,
    },
    infoCardDescription: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
        marginTop: 4,
    },
    infoTextBold: {
        fontWeight: '600',
        color: '#333',
    },
    infoTextWarning: {
        fontWeight: '600',
        color: '#FF9500',
    },
    cloudCard: {
        backgroundColor: '#f0f8ff',
        borderColor: '#b3d9ff',
        borderWidth: 1,
        borderLeftWidth: 5,
        borderLeftColor: '#007AFF',
        minHeight: 120,
    },
    cloudCardContent: {
        flex: 1,
    },
    cloudCardDescription: {
        fontSize: 12,
        color: '#444',
        lineHeight: 16,
        marginTop: 4,
    },
    cloudTextBold: {
        fontWeight: '700',
        color: '#333',
        fontSize: 12,
    },
    cloudTextSuccess: {
        fontWeight: '700',
        color: '#34C759',
        fontSize: 13,
    },
    cloudTextWarning: {
        fontWeight: '700',
        color: '#FF9500',
        fontSize: 13,
    },
    accountCard: {
        backgroundColor: '#f0fff4',
        borderColor: '#ccffdd',
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: '#34C759',
    },
    logoutButton: {
        backgroundColor: '#ff3b30',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    actionButton: {
        backgroundColor: themeColor,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
});