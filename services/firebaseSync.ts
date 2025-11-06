// services/firebaseSync.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logFirebaseError } from '../utils/firebaseUtils';
import { authService } from './authService';

export class FirebaseSyncService {
  private userId: string | null = null;
  private listeners: Map<string, () => void> = new Map();

  setUserId(userId: string) {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  // Salvar dados no Firebase
  async saveToFirebase(collection: string, data: any): Promise<void> {
    // TRIPLA VERIFICAÇÃO: Garantir que NENHUM usuário anônimo acesse Firebase
    if (!this.userId) {
      console.warn('❌ Usuário não autenticado - Firebase bloqueado');
      return;
    }

    // Verificar se deve sincronizar com Firebase (primeira camada de proteção)
    if (!authService.shouldSyncWithFirebase()) {
      console.warn(`❌ BLOQUEADO: Sincronização Firebase negada para ${collection}`);
      return;
    }

    // Verificar se está em modo offline (segunda camada de proteção)
    if (authService.isInOfflineMode()) {
      console.warn(`❌ BLOQUEADO: Modo offline ativo - ${collection} não enviado para Firebase`);
      return;
    }

    try {
      const docRef = doc(db, 'users', this.userId, 'data', collection);
      await setDoc(docRef, {
        data: data,
        lastUpdated: Timestamp.now(),
        version: Date.now()
      }, { merge: true });
      
      console.log(`✅ Dados de ${collection} salvos no Firebase`);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn(`⚠️ Permissão negada para salvar ${collection}. Continuando offline.`);
      } else {
        logFirebaseError(`Erro ao salvar ${collection} no Firebase`, error);
      }
      // Não lançar erro para não quebrar a funcionalidade
    }
  }

  // Carregar dados do Firebase
  async loadFromFirebase(collection: string): Promise<any | null> {
    // TRIPLA VERIFICAÇÃO: Garantir que NENHUM usuário anônimo acesse Firebase
    if (!this.userId) {
      console.warn('❌ Usuário não autenticado - Firebase bloqueado');
      return null;
    }

    // Verificar se deve sincronizar com Firebase (primeira camada de proteção)
    if (!authService.shouldSyncWithFirebase()) {
      console.warn(`❌ BLOQUEADO: Carregamento Firebase negado para ${collection}`);
      return null;
    }

    // Verificar se está em modo offline (segunda camada de proteção)
    if (authService.isInOfflineMode()) {
      console.warn(`❌ BLOQUEADO: Modo offline ativo - ${collection} não carregado do Firebase`);
      return null;
    }

    try {
      const docRef = doc(db, 'users', this.userId, 'data', collection);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firebaseData = docSnap.data();
        console.log(`✅ Dados de ${collection} carregados do Firebase`);
        return firebaseData.data;
      } else {
        console.log(`📭 Nenhum dado de ${collection} encontrado no Firebase`);
        return null;
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn(`⚠️ Permissão negada para carregar ${collection}. Usando dados locais.`);
      } else {
        logFirebaseError(`Erro ao carregar ${collection} do Firebase`, error);
      }
      return null;
    }
  }

  // Sincronizar dados (AsyncStorage ↔ Firebase)
  async syncData(storageKey: string, collectionName: string): Promise<any> {
    try {
      // PROTEÇÃO: Se usuário offline ou sem permissão, carregar apenas do AsyncStorage
      if (authService.isInOfflineMode() || !authService.shouldSyncWithFirebase()) {
        console.log(`👤 Usuário offline - carregando ${collectionName} apenas do AsyncStorage`);
        const localDataString = await AsyncStorage.getItem(storageKey);
        return localDataString ? JSON.parse(localDataString) : null;
      }

      // 1. Carregar dados locais
      const localDataString = await AsyncStorage.getItem(storageKey);
      const localData = localDataString ? JSON.parse(localDataString) : null;

      // 2. Carregar dados do Firebase
      const firebaseData = await this.loadFromFirebase(collectionName);

      // 3. Se não há dados em nenhum lugar, retornar null
      if (!localData && !firebaseData) {
        return null;
      }

      // 4. Se só há dados locais, enviar para Firebase
      if (localData && !firebaseData) {
        await this.saveToFirebase(collectionName, localData);
        return localData;
      }

      // 5. Se só há dados no Firebase, salvar localmente
      if (!localData && firebaseData) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(firebaseData));
        return firebaseData;
      }

      // 6. Se há dados em ambos, usar o mais recente (versão simples)
      // Em uma implementação mais robusta, você poderia comparar timestamps
      if (localData && firebaseData) {
        // Por simplicidade, vamos sempre preferir dados locais se existirem
        // e sincronizar com Firebase
        await this.saveToFirebase(collectionName, localData);
        return localData;
      }

    } catch (error) {
      logFirebaseError(`Erro na sincronização de ${collectionName}`, error);
      // Em caso de erro, retornar dados locais se existirem
      const localDataString = await AsyncStorage.getItem(storageKey);
      return localDataString ? JSON.parse(localDataString) : null;
    }
  }

  // Configurar listener em tempo real para um documento
  setupRealtimeListener(collectionName: string, callback: (data: any) => void): void {
    // DUPLA VERIFICAÇÃO: Garantir que apenas usuários autenticados configurem listeners
    if (!this.userId) {
      console.warn('❌ Usuário não autenticado - Listener Firebase bloqueado');
      return;
    }

    // Verificar se deve sincronizar com Firebase (primeira camada de proteção)
    if (!authService.shouldSyncWithFirebase()) {
      console.warn(`❌ BLOQUEADO: Listener Firebase negado para ${collectionName}`);
      return;
    }

    // Verificar se está em modo offline (segunda camada de proteção)
    if (authService.isInOfflineMode()) {
      console.warn(`❌ BLOQUEADO: Modo offline ativo - Listener ${collectionName} não configurado`);
      return;
    }

    // Primeiro tentar acessar o documento para verificar permissões
    const docRef = doc(db, 'users', this.userId, 'data', collectionName);
    
    // Teste inicial para verificar permissões
    getDoc(docRef).then(() => {
      // Se conseguiu acessar, configurar o listener
      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback(data.data);
        }
      }, (error) => {
        // Se for erro de permissão, não logar como erro crítico
        if (error.code === 'permission-denied') {
          console.warn(`⚠️ Permissão negada para acessar ${collectionName}. Usuário pode não ter autenticação adequada.`);
          // Tentar remover o listener para evitar loops de erro
          this.removeListener(collectionName);
        } else {
          logFirebaseError(`Erro no listener de ${collectionName}`, error);
        }
      });

      // Armazenar o unsubscribe para limpeza posterior
      this.listeners.set(collectionName, unsubscribe);
    }).catch((error) => {
      if (error.code === 'permission-denied') {
        console.warn(`⚠️ Não é possível configurar listener para ${collectionName} - permissão negada`);
      } else {
        logFirebaseError(`Erro ao verificar permissões para ${collectionName}`, error);
      }
    });
  }

  // Remover listener
  removeListener(collectionName: string): void {
    const unsubscribe = this.listeners.get(collectionName);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(collectionName);
    }
  }

  // Limpar todos os listeners
  removeAllListeners(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Função específica para sincronizar perfil do usuário
  async syncProfile(profileData: any): Promise<void> {
    console.log('🔄 Sincronizando perfil com Firebase...');
    await this.saveToFirebase('userProfile', profileData);
  }

  // Função para carregar perfil do Firebase
  async loadProfile(): Promise<any | null> {
    if (!this.userId) {
      console.warn('❌ Usuário não autenticado - não é possível carregar perfil');
      return null;
    }

    if (!authService.shouldSyncWithFirebase()) {
      console.warn('❌ Sincronização Firebase desabilitada');
      return null;
    }

    try {
      const docRef = doc(db, 'users', this.userId, 'data', 'userProfile');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firebaseData = docSnap.data();
        console.log('✅ Perfil carregado do Firebase');
        return firebaseData.data;
      } else {
        console.log('ℹ️ Nenhum perfil encontrado no Firebase');
        return null;
      }
    } catch (error) {
      logFirebaseError('Erro ao carregar perfil do Firebase', error);
      return null;
    }
  }

  // Função para sincronizar histórico de treinos
  async syncWorkoutHistory(historyData: any[]): Promise<void> {
    console.log('🔄 Sincronizando histórico de treinos com Firebase...');
    await this.saveToFirebase('workoutHistory', historyData);
  }

  // Função para sincronizar histórico de alimentação
  async syncFoodHistory(historyData: any[]): Promise<void> {
    console.log('🔄 Sincronizando histórico de alimentação com Firebase...');
    await this.saveToFirebase('foodHistory', historyData);
  }

  // Função para sincronizar histórico de suplementos
  async syncSupplementsHistory(historyData: any): Promise<void> {
    console.log('🔄 Sincronizando histórico de suplementos com Firebase...');
    await this.saveToFirebase('supplementsHistory', historyData);
  }

  // Função para carregar histórico de treinos do Firebase
  async loadWorkoutHistory(): Promise<any[] | null> {
    return await this.loadFromFirebase('workoutHistory');
  }

  // Função para carregar histórico de alimentação do Firebase
  async loadFoodHistory(): Promise<any[] | null> {
    return await this.loadFromFirebase('foodHistory');
  }

  // Função para carregar histórico de suplementos do Firebase
  async loadSupplementsHistory(): Promise<any | null> {
    return await this.loadFromFirebase('supplementsHistory');
  }

  // ✅ NOVO: Funções para configurações de metas e visibilidade
  async saveUserConfig(configData: any): Promise<void> {
    await this.saveToFirebase('userConfig', configData);
  }

  async loadUserConfig(): Promise<any | null> {
    return await this.loadFromFirebase('userConfig');
  }

  async syncUserConfig(): Promise<any> {
    return await this.syncData('userConfig', 'userConfig');
  }
}

// Instância singleton
export const firebaseSyncService = new FirebaseSyncService();