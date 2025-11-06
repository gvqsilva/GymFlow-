// app/cloud-info.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authService } from '../services/authService';
import { autoSyncService } from '../services/autoSync';

const themeColor = '#5a4fcf';

export default function CloudInfoScreen() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<string>('Carregando...');
    const [storageStats, setStorageStats] = useState<{
        workoutEntries: number;
        foodEntries: number;
        supplementEntries: number;
    }>({ workoutEntries: 0, foodEntries: 0, supplementEntries: 0 });
    const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

    useEffect(() => {
        loadCloudInfo();
    }, []);

    const loadCloudInfo = async () => {
        // Verificar autenticação
        const currentUser = authService.getCurrentUser();
        setIsAuthenticated(!!currentUser && authService.shouldSyncWithFirebase());
        setUserEmail(currentUser?.email || null);

        // Carregar status de sincronização
        const status = await autoSyncService.getSyncStatus();
        setSyncStatus(status.timeSinceLastSync);
        setLastSyncDate(status.lastSync);

        // Carregar estatísticas de dados
        await loadStorageStats();
    };

    const loadStorageStats = async () => {
        try {
            const workoutHistoryJSON = await AsyncStorage.getItem('workoutHistory');
            const workoutHistory = workoutHistoryJSON ? JSON.parse(workoutHistoryJSON) : [];
            
            const foodHistoryJSON = await AsyncStorage.getItem('foodHistory');
            const foodHistory = foodHistoryJSON ? JSON.parse(foodHistoryJSON) : [];
            
            const supplementsHistoryJSON = await AsyncStorage.getItem('supplements_history');
            const supplementsHistory = supplementsHistoryJSON ? JSON.parse(supplementsHistoryJSON) : {};
            
            const supplementEntries = Object.keys(supplementsHistory).reduce((total, date) => {
                return total + Object.keys(supplementsHistory[date]).length;
            }, 0);

            setStorageStats({
                workoutEntries: workoutHistory.length,
                foodEntries: foodHistory.length,
                supplementEntries: supplementEntries,
            });
        } catch (error) {
            console.warn('Erro ao carregar estatísticas:', error);
        }
    };

    const handleForceSyncNow = async () => {
        if (!isAuthenticated) {
            Alert.alert('Erro', 'É necessário estar conectado para sincronizar dados');
            return;
        }

        Alert.alert(
            'Sincronizar Agora',
            'Deseja sincronizar todos os dados com a nuvem agora?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sincronizar',
                    onPress: async () => {
                        try {
                            setSyncStatus('Sincronizando...');
                            const success = await autoSyncService.forceSyncNow();
                            if (success) {
                                setSyncStatus('Agora mesmo');
                                setLastSyncDate(new Date());
                                Alert.alert('Sucesso', 'Dados sincronizados com sucesso!');
                            } else {
                                setSyncStatus('Erro na sincronização');
                                Alert.alert('Erro', 'Falha ao sincronizar dados');
                            }
                        } catch (error) {
                            setSyncStatus('Erro na sincronização');
                            Alert.alert('Erro', 'Falha ao sincronizar dados');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Nunca';
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalEntries = storageStats.workoutEntries + storageStats.foodEntries + storageStats.supplementEntries;

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen 
                options={{ 
                    headerShown: true, 
                    title: "Backup na Nuvem",
                    headerStyle: { backgroundColor: themeColor },
                    headerTintColor: '#fff',
                }} 
            />
            <ScrollView style={styles.container}>
                {isAuthenticated ? (
                    /* Usuário Logado - Card Unificado */
                    <View style={[styles.card, styles.accountCard]}>
                        <View style={styles.accountHeader}>
                            <Ionicons name="shield-checkmark" size={40} color="#10b981" />
                            <View style={styles.accountContent}>
                                <Text style={styles.accountTitle}>✅ Backup na Nuvem Ativo</Text>
                                <Text style={styles.accountEmail}>{userEmail}</Text>
                                
                                {/* Informações consolidadas */}
                                <View style={styles.accountInfoContainer}>
                                    <View style={styles.accountInfoRow}>
                                        <Ionicons name="sync" size={18} color="#3b82f6" />
                                        <Text style={styles.accountInfoText}>Última sync: {syncStatus}</Text>
                                    </View>
                                    
                                    <View style={styles.accountInfoRow}>
                                        <Ionicons name="time" size={18} color="#6b7280" />
                                        <Text style={styles.accountInfoText}>Data: {formatDate(lastSyncDate)}</Text>
                                    </View>

                                    <View style={styles.accountInfoRow}>
                                        <Ionicons name="refresh" size={18} color="#10b981" />
                                        <Text style={styles.accountInfoText}>Auto-sync a cada 5 minutos</Text>
                                    </View>
                                </View>
                                
                                {/* Botões de ação */}
                                <View style={styles.accountActionsContainer}>
                                    <Pressable 
                                        style={[styles.accountActionButton, styles.syncButton]} 
                                        onPress={handleForceSyncNow}
                                    >
                                        <Ionicons name="sync" size={18} color="#ffffff" />
                                        <Text style={styles.logoutButtonText}>Sincronizar</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    /* Usuário Não Logado */
                    <View style={[styles.card, styles.localCard]}>
                        <View style={styles.statusHeader}>
                            <Ionicons name="warning" size={40} color="#f59e0b" />
                            <View style={styles.statusInfo}>
                                <Text style={styles.statusTitle}>⚠️ Backup Local Apenas</Text>
                                <Text style={styles.statusSubtitle}>Faça login para proteger seus dados na nuvem</Text>
                            </View>
                        </View>
                        
                        <Pressable style={[styles.loginButton, { marginTop: 16 }]} onPress={() => router.push('/login')}>
                            <Ionicons name="log-in" size={20} color="#fff" />
                            <Text style={styles.loginButtonText}>Fazer Login</Text>
                        </Pressable>
                    </View>
                )}

                {/* Estatísticas de Dados */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📊 Seus Dados Armazenados</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Ionicons name="fitness" size={20} color={themeColor} />
                            <Text style={styles.statLabel}>Treinos registrados</Text>
                            <Text style={styles.statValue}>{storageStats.workoutEntries}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Ionicons name="restaurant" size={20} color={themeColor} />
                            <Text style={styles.statLabel}>Refeições registradas</Text>
                            <Text style={styles.statValue}>{storageStats.foodEntries}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Ionicons name="flask" size={20} color={themeColor} />
                            <Text style={styles.statLabel}>Registros de suplementos</Text>
                            <Text style={styles.statValue}>{storageStats.supplementEntries}</Text>
                        </View>
                        <View style={[styles.statRow, styles.totalRow]}>
                            <Ionicons name="analytics" size={22} color="#10b981" />
                            <Text style={[styles.statLabel, styles.totalLabel]}>Total de registros</Text>
                            <Text style={[styles.statValue, styles.totalValue]}>{totalEntries}</Text>
                        </View>
                    </View>
                </View>

                {isAuthenticated ? (
                    /* Seção para usuários logados */
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>✨ Benefícios do Backup na Nuvem</Text>
                        <View style={styles.benefitsList}>
                            <View style={styles.benefitItem}>
                                <Ionicons name="shield-checkmark" size={22} color="#10b981" />
                                <Text style={styles.benefitText}>Dados protegidos e criptografados</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="sync" size={22} color="#3b82f6" />
                                <Text style={styles.benefitText}>Sincronização automática em background</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="phone-portrait" size={22} color="#f59e0b" />
                                <Text style={styles.benefitText}>Acesso de qualquer dispositivo</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="cloud-done" size={22} color="#10b981" />
                                <Text style={styles.benefitText}>Backup automático sem intervenção</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="time" size={22} color="#6b7280" />
                                <Text style={styles.benefitText}>Histórico preservado indefinidamente</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    /* Seção para usuários não logados */
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>💡 Por que fazer backup na nuvem?</Text>
                        <View style={styles.reasonsList}>
                            <View style={styles.reasonItem}>
                                <Ionicons name="warning" size={22} color="#f59e0b" />
                                <View style={styles.reasonContent}>
                                    <Text style={styles.reasonTitle}>Proteção contra perda</Text>
                                    <Text style={styles.reasonText}>Evite perder seus dados se o dispositivo for danificado ou perdido</Text>
                                </View>
                            </View>
                            <View style={styles.reasonItem}>
                                <Ionicons name="phone-portrait" size={22} color="#3b82f6" />
                                <View style={styles.reasonContent}>
                                    <Text style={styles.reasonTitle}>Acesso multi-dispositivo</Text>
                                    <Text style={styles.reasonText}>Use o app em diferentes dispositivos com os mesmos dados</Text>
                                </View>
                            </View>
                            <View style={styles.reasonItem}>
                                <Ionicons name="sync" size={22} color="#10b981" />
                                <View style={styles.reasonContent}>
                                    <Text style={styles.reasonTitle}>Sincronização automática</Text>
                                    <Text style={styles.reasonText}>Dados salvos automaticamente sem precisar lembrar</Text>
                                </View>
                            </View>
                            <View style={styles.reasonItem}>
                                <Ionicons name="shield" size={22} color="#8b5cf6" />
                                <View style={styles.reasonContent}>
                                    <Text style={styles.reasonTitle}>Segurança e privacidade</Text>
                                    <Text style={styles.reasonText}>Dados criptografados e seguros em servidores confiáveis</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    protectedCard: {
        borderLeftWidth: 6,
        borderLeftColor: '#10b981',
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
        borderWidth: 2,
    },
    localCard: {
        borderLeftWidth: 6,
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7',
        borderWidth: 2,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusInfo: {
        marginLeft: 16,
        flex: 1,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 15,
        color: '#6b7280',
        lineHeight: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    statsContainer: {
        gap: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    totalRow: {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
        borderWidth: 2,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statLabel: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    totalLabel: {
        fontWeight: '700',
        color: '#1f2937',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: themeColor,
        minWidth: 40,
        textAlign: 'right',
    },
    totalValue: {
        color: '#10b981',
        fontSize: 22,
        fontWeight: '800',
    },
    syncInfo: {
        marginBottom: 16,
    },
    syncRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    syncLabel: {
        fontSize: 14,
        color: '#666',
    },
    syncValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    syncButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    syncButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    benefitsList: {
        gap: 16,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    benefitText: {
        fontSize: 15,
        color: '#374151',
        flex: 1,
        fontWeight: '500',
        lineHeight: 22,
    },
    reasonsList: {
        gap: 16,
        marginBottom: 24,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reasonContent: {
        flex: 1,
    },
    reasonTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 6,
    },
    reasonText: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        fontWeight: '400',
    },
    loginButton: {
        backgroundColor: themeColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: themeColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 8,
    },
    loginButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    // Estilos para o Card da Conta
    accountCard: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        borderWidth: 2,
        borderLeftWidth: 6,
        borderLeftColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 4,
    },
    accountContent: {
        flex: 1,
    },
    accountTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    accountEmail: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 16,
        fontWeight: '500',
    },
    accountInfoContainer: {
        marginBottom: 20,
        gap: 10,
    },
    accountInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1fae5',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    accountInfoText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 10,
        flex: 1,
        fontWeight: '500',
    },
    accountActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    accountActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        gap: 8,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
        minWidth: 150,
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    logoutButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
    },
});