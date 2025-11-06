// components/SyncStatus.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSportsContext } from '../context/SportsProvider';
import { useSupplements } from '../hooks/useSupplements';
import { useWorkouts } from '../hooks/useWorkouts';
import { authService } from '../services/authService';

interface SyncStatusProps {
  compact?: boolean; // Para mostrar versão compacta
}

export function SyncStatus({ compact = false }: SyncStatusProps) {
  const sports = useSportsContext();
  const workouts = useWorkouts();
  const supplements = useSupplements();

  // Verificar estado do usuário
  const shouldSync = authService.shouldSyncWithFirebase();
  const isOfflineMode = authService.isInOfflineMode();

  // Determinar se algum serviço está sincronizando
  const isSyncing = sports.isSyncing || workouts.isSyncing || supplements.isSyncing;
  
  // Determinar se todos os serviços estão autenticados
  const isAuthenticated = shouldSync && (sports.isAuthenticated && workouts.isAuthenticated && supplements.isAuthenticated);

  // Obter a data da última sincronização mais recente
  const lastSyncTimes = [sports.lastSyncTime, workouts.lastSyncTime, supplements.lastSyncTime].filter(Boolean);
  const lastSyncTime = lastSyncTimes.length > 0 ? new Date(Math.max(...lastSyncTimes.map(d => d!.getTime()))) : null;

  const handleForceSync = async () => {
    if (!shouldSync || isOfflineMode) {
      console.log('Não é possível sincronizar no modo atual');
      return;
    }
    
    try {
      await Promise.all([
        sports.forceSync(),
        workouts.forceSync(),
        supplements.forceSync()
      ]);
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  };

  const getStatusIcon = () => {
    if (isOfflineMode) return 'cloud-offline-outline';
    if (isSyncing) return 'sync-outline';
    if (!isAuthenticated) return 'cloud-offline-outline';
    if (lastSyncTime) return 'cloud-done-outline';
    return 'cloud-outline';
  };

  const getStatusColor = () => {
    if (isOfflineMode) return '#FF3B30';
    if (isSyncing) return '#FF9500';
    if (!isAuthenticated) return '#FF3B30';
    if (lastSyncTime) return '#34C759';
    return '#8E8E93';
  };

  const getStatusText = () => {
    if (isOfflineMode) return 'Modo offline (dados locais + protegidos)';
    if (isSyncing) return 'Sincronizando...';
    if (!isAuthenticated) return 'Offline';
    if (lastSyncTime) {
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSyncTime.getTime()) / (1000 * 60));
      if (diffMinutes === 0) return 'Nuvem sincronizada ✓';
      if (diffMinutes < 60) return `Sincronizado há ${diffMinutes}min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Sincronizado há ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Sincronizado há ${diffDays}d`;
    }
    return 'Não sincronizado';
  };

  if (compact) {
    return (
      <TouchableOpacity 
        onPress={shouldSync ? handleForceSync : undefined} 
        style={[styles.compactContainer, !shouldSync && styles.disabled]}
        disabled={!shouldSync}
      >
        <Ionicons 
          name={getStatusIcon()} 
          size={16} 
          color={getStatusColor()} 
          style={isSyncing ? styles.rotating : undefined}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={getStatusColor()} 
          style={isSyncing ? styles.rotating : undefined}
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {isAuthenticated && (
        <TouchableOpacity onPress={handleForceSync} style={styles.syncButton} disabled={isSyncing}>
          <Text style={styles.syncButtonText}>Sincronizar</Text>
        </TouchableOpacity>
      )}
      
      {!isAuthenticated && (
        <Text style={styles.offlineText}>
          Dados salvos apenas localmente
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginVertical: 8,
  },
  compactContainer: {
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  disabled: {
    opacity: 0.5,
  },
  rotating: {
    // Animação de rotação seria implementada aqui com Animated
  },
});