// hooks/useFirebaseStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { firebaseSyncService } from '../services/firebaseSync';

interface UseFirebaseStorageOptions {
  enableRealtime?: boolean; // Habilitar atualizações em tempo real
  syncOnMount?: boolean;    // Sincronizar ao montar o componente
}

export function useFirebaseStorage<T>(
  storageKey: string,
  collectionName: string,
  initialData: T,
  options: UseFirebaseStorageOptions = {
    enableRealtime: false,
    syncOnMount: true
  }
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Carregar dados (AsyncStorage + Firebase)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Esperar autenticação ser inicializada
      await authService.initialize();

      let loadedData: T;

      if (authService.shouldSyncWithFirebase() && !authService.isInOfflineMode() && options.syncOnMount) {
        // Sincronizar com Firebase se autenticado e não anônimo e não em modo offline
        const syncedData = await firebaseSyncService.syncData(storageKey, collectionName);
        loadedData = syncedData || initialData;
      } else {
        // Carregar apenas do AsyncStorage (usuário anônimo, não autenticado ou em modo offline)
        const storedData = await AsyncStorage.getItem(storageKey);
        loadedData = storedData ? JSON.parse(storedData) : initialData;
      }

      setData(loadedData);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error(`❌ Erro ao carregar dados de ${collectionName}:`, error);
      // Em caso de erro, usar dados iniciais
      setData(initialData);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, collectionName, initialData, options.syncOnMount]);

  // Salvar dados (AsyncStorage + Firebase)
  const saveData = useCallback(async (newData: T) => {
    setIsSyncing(true);
    try {
      // Salvar localmente primeiro
      await AsyncStorage.setItem(storageKey, JSON.stringify(newData));
      setData(newData);

      // Salvar no Firebase se autenticado e não anônimo e não em modo offline
      if (authService.shouldSyncWithFirebase() && !authService.isInOfflineMode()) {
        await firebaseSyncService.saveToFirebase(collectionName, newData);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar dados de ${collectionName}:`, error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [storageKey, collectionName]);

  // Forçar sincronização
  const forcSync = useCallback(async () => {
    if (!authService.shouldSyncWithFirebase() || authService.isInOfflineMode()) {
      console.log('Sincronização não disponível no modo atual');
      return;
    }

    setIsSyncing(true);
    try {
      const syncedData = await firebaseSyncService.syncData(storageKey, collectionName);
      if (syncedData) {
        setData(syncedData);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error(`❌ Erro na sincronização forçada de ${collectionName}:`, error);
    } finally {
      setIsSyncing(false);
    }
  }, [storageKey, collectionName]);

  // Configurar listener em tempo real
  useEffect(() => {
    if (options.enableRealtime && authService.shouldSyncWithFirebase()) {
      // Adicionar um delay para garantir que a autenticação esteja estabilizada
      const timer = setTimeout(() => {
        if (authService.shouldSyncWithFirebase()) {
          firebaseSyncService.setupRealtimeListener(collectionName, (newData) => {
            setData(newData);
            setLastSyncTime(new Date());
            // Atualizar AsyncStorage também
            AsyncStorage.setItem(storageKey, JSON.stringify(newData));
          });
        }
      }, 1000); // Aguardar 1 segundo

      return () => {
        clearTimeout(timer);
        firebaseSyncService.removeListener(collectionName);
      };
    }
  }, [collectionName, storageKey, options.enableRealtime]);

  // Carregar dados na inicialização
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    isSyncing,
    lastSyncTime,
    saveData,
    forcSync,
    reloadData: loadData,
    isAuthenticated: authService.shouldSyncWithFirebase()
  };
}