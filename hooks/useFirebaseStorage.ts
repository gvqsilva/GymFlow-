// hooks/useFirebaseStorage.ts
// Hook para integração com Firebase Firestore

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { authService } from '../services/authService';

interface UseFirebaseStorageOptions {
  enableRealtime?: boolean;
  syncOnMount?: boolean;
}

interface UseFirebaseStorageReturn<T> {
  data: T;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  isAuthenticated: boolean;
  saveData: (data: T) => Promise<void>;
  forcSync: () => Promise<void>;
}

export function useFirebaseStorage<T>(
  storageKey: string,
  firestoreCollection: string,
  initialData: T,
  options: UseFirebaseStorageOptions = {}
): UseFirebaseStorageReturn<T> {
  const { enableRealtime = false, syncOnMount = false } = options;
  
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação real do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('Usuário autenticado:', currentUser.uid);
        setIsAuthenticated(true);
      } else {
        console.log('Nenhum usuário autenticado');
        setIsAuthenticated(false);
      }
    });

    return unsubscribe;
  }, []);

  // Carregar dados locais primeiro
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        setIsLoading(true);
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalData();
  }, [storageKey]);

  // Sincronizar com Firebase
  const syncWithFirebase = useCallback(async () => {
  if (!isAuthenticated || !auth.currentUser || !authService.shouldSyncWithFirebase()) return;

    try {
      setIsSyncing(true);
  const userId = auth.currentUser.uid;
  const docRef = doc(db, 'users', userId, 'data', firestoreCollection);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const firebaseData = docSnap.data();
        if (firebaseData && firebaseData.data) {
          setData(firebaseData.data);
          await AsyncStorage.setItem(storageKey, JSON.stringify(firebaseData.data));
          setLastSyncTime(new Date());
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Firebase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, firestoreCollection, storageKey]);

  // Salvar dados no Firebase e localmente
  const saveData = useCallback(async (newData: T) => {
    try {
      setIsSyncing(true);

      await AsyncStorage.setItem(storageKey, JSON.stringify(newData));
      setData(newData);

      if (isAuthenticated && auth.currentUser && authService.shouldSyncWithFirebase()) {
        const userId = auth.currentUser.uid;
        const docRef = doc(db, 'users', userId, 'data', firestoreCollection);
        await setDoc(docRef, {
          data: newData,
          lastUpdated: serverTimestamp()
        }, { merge: true });
        setLastSyncTime(new Date());
        console.log(`Dados salvos no Firebase: users/${userId}/data/${firestoreCollection}`);
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [storageKey, isAuthenticated, firestoreCollection]);

  // Sync inicial se habilitado
  useEffect(() => {
    if (syncOnMount && isAuthenticated) {
      syncWithFirebase();
    }
  }, [syncOnMount, isAuthenticated, syncWithFirebase]);

  // Listener de tempo real se habilitado
  useEffect(() => {
  if (!enableRealtime || !isAuthenticated || !auth.currentUser || !authService.shouldSyncWithFirebase()) return;

  const userId = auth.currentUser.uid;
  const docRef = doc(db, 'users', userId, 'data', firestoreCollection);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const firebaseData = doc.data();
        if (firebaseData && firebaseData.data) {
          setData(firebaseData.data);
          AsyncStorage.setItem(storageKey, JSON.stringify(firebaseData.data));
          setLastSyncTime(new Date());
        }
      }
    }, (error: any) => {
      console.error('Erro no listener do Firebase:', error);
    });

    return () => unsubscribe();
  }, [enableRealtime, isAuthenticated, firestoreCollection, storageKey]);

  return {
    data,
    isLoading,
    isSyncing,
    lastSyncTime,
    isAuthenticated,
    saveData,
    forcSync: syncWithFirebase
  };
}
