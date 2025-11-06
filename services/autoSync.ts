// services/autoSync.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { firebaseSyncService } from './firebaseSync';

class AutoSyncService {
  private syncInterval: any = null;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private readonly LAST_SYNC_KEY = 'lastSyncTimestamp';

  // Inicia sincronização automática em background
  startAutoSync() {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    // Sincroniza imediatamente ao iniciar
    this.performBackgroundSync();

    // Configura sincronização periódica
    this.syncInterval = setInterval(() => {
      this.performBackgroundSync();
    }, this.SYNC_INTERVAL);

    console.log('🔄 Sincronização automática iniciada (a cada 5 minutos)');
  }

  // Para sincronização automática
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Sincronização automática parada');
    }
  }

  // Executa sincronização em background
  private async performBackgroundSync() {
    try {
      console.log('🔄 Iniciando sincronização automática...');
      
      // Verifica se o usuário está autenticado
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ Usuário não autenticado, pulando sincronização');
        return;
      }

      // Sincroniza todos os dados locais para o Firebase
      await this.syncAllDataToFirebase();

      // Atualiza timestamp da última sincronização
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
      
      console.log('✅ Sincronização automática concluída com sucesso');
    } catch (error) {
      console.warn('⚠️ Falha na sincronização automática:', error);
    }
  }

  // Sincroniza todos os dados locais para o Firebase
  private async syncAllDataToFirebase() {
    try {
      // Sincroniza histórico de alimentação
      const foodHistoryJSON = await AsyncStorage.getItem('foodHistory');
      if (foodHistoryJSON) {
        const foodHistory = JSON.parse(foodHistoryJSON);
        await firebaseSyncService.syncFoodHistory(foodHistory);
      }

      // Sincroniza histórico de treinos
      const workoutHistoryJSON = await AsyncStorage.getItem('workoutHistory');
      if (workoutHistoryJSON) {
        const workoutHistory = JSON.parse(workoutHistoryJSON);
        await firebaseSyncService.syncWorkoutHistory(workoutHistory);
      }

      // Sincroniza histórico de suplementos
      const supplementsHistoryJSON = await AsyncStorage.getItem('supplements_history');
      if (supplementsHistoryJSON) {
        const supplementsHistory = JSON.parse(supplementsHistoryJSON);
        await firebaseSyncService.syncSupplementsHistory(supplementsHistory);
      }

      console.log('📤 Todos os dados sincronizados para o Firebase');
    } catch (error) {
      console.warn('⚠️ Erro ao sincronizar dados:', error);
      throw error;
    }
  }

  // Força sincronização manual
  async forceSyncNow(): Promise<boolean> {
    try {
      console.log('🔄 Sincronização manual iniciada...');
      await this.performBackgroundSync();
      return true;
    } catch (error) {
      console.error('❌ Falha na sincronização manual:', error);
      return false;
    }
  }

  // Retorna timestamp da última sincronização
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.warn('Erro ao obter timestamp da última sincronização:', error);
      return null;
    }
  }

  // Verifica se os dados estão sincronizados
  async getSyncStatus(): Promise<{
    lastSync: Date | null;
    timeSinceLastSync: string;
    isAutoSyncActive: boolean;
  }> {
    const lastSync = await this.getLastSyncTime();
    let timeSinceLastSync = 'Nunca';

    if (lastSync) {
      const now = new Date();
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) {
        timeSinceLastSync = 'Agora mesmo';
      } else if (diffMinutes < 60) {
        timeSinceLastSync = `${diffMinutes} min atrás`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        timeSinceLastSync = `${diffHours}h atrás`;
      }
    }

    return {
      lastSync,
      timeSinceLastSync,
      isAutoSyncActive: this.syncInterval !== null,
    };
  }
}

// Instância singleton
export const autoSyncService = new AutoSyncService();