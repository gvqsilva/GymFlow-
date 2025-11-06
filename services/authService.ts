// services/authService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { logFirebaseError } from '../utils/firebaseUtils';
import { firebaseSyncService } from './firebaseSync';

const USER_ID_STORAGE_KEY = 'firebase_user_id';
const USER_EMAIL_STORAGE_KEY = 'user_email';
const USER_CREDENTIALS_STORAGE_KEY = 'user_credentials';
const FIRST_LOGIN_STORAGE_KEY = 'first_login_completed';

class AuthService {
  private currentUser: User | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<User | null> | null = null;
  private isExplicitLogout = false; // Flag para controlar logout explícito

  // Inicializar autenticação
  async initialize(): Promise<User | null> {
    // Se já está sendo inicializado, retornar a promise existente
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Se já foi inicializado, retornar o usuário atual
    if (this.isInitialized) {
      return this.currentUser;
    }

    // Criar nova promise de inicialização
    this.initializationPromise = new Promise(async (resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        
        if (user) {
          // Usuário autenticado
          console.log('✅ Usuário autenticado:', user.uid);
          firebaseSyncService.setUserId(user.uid);
          await AsyncStorage.setItem(USER_ID_STORAGE_KEY, user.uid);
          await AsyncStorage.setItem(USER_EMAIL_STORAGE_KEY, user.email || '');
          this.isExplicitLogout = false; // Reset logout flag
        } else if (!this.isExplicitLogout) {
          // Usuário não autenticado - tentar login automático com credenciais salvas
          console.log('👤 Tentando login automático...');
          const autoLoginSuccess = await this.tryAutoLogin();
          if (!autoLoginSuccess) {
            console.log('❌ Login automático falhou - aguardando login manual');
            firebaseSyncService.setUserId('');
          }
        } else {
          // Foi logout explícito
          console.log('🚪 Logout explícito - não tentando login automático');
          firebaseSyncService.setUserId('');
        }

        if (!this.isInitialized) {
          this.isInitialized = true;
          resolve(this.currentUser);
          unsubscribe(); // Remove o listener após a inicialização
        }
      });
    });

    return this.initializationPromise;
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Obter ID do usuário atual
  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // Obter email salvo (para pré-preencher formulários)
  async getSavedEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_EMAIL_STORAGE_KEY);
    } catch (error) {
      console.warn('Erro ao obter email salvo:', error);
      return null;
    }
  }

  // Verificar se há credenciais salvas
  async hasSavedCredentials(): Promise<boolean> {
    try {
      const savedCredentials = await AsyncStorage.getItem(USER_CREDENTIALS_STORAGE_KEY);
      return !!savedCredentials;
    } catch (error) {
      return false;
    }
  }

  // Verificar se usuário completou o primeiro login (perfil criado)
  async isFirstLoginCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(FIRST_LOGIN_STORAGE_KEY);
      return completed === 'true';
    } catch (error) {
      return false;
    }
  }

  // Marcar primeiro login como completo
  async markFirstLoginCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(FIRST_LOGIN_STORAGE_KEY, 'true');
      console.log('✅ Primeiro login marcado como completo');
    } catch (error) {
      console.error('❌ Erro ao marcar primeiro login como completo:', error);
    }
  }

  // Verificar se usuário está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Tentar login automático com credenciais salvas
  private async tryAutoLogin(): Promise<boolean> {
    try {
      const savedCredentials = await AsyncStorage.getItem(USER_CREDENTIALS_STORAGE_KEY);
      if (!savedCredentials) {
        console.log('📭 Nenhuma credencial salva encontrada');
        return false;
      }

      const { email, password } = JSON.parse(savedCredentials);
      if (!email || !password) {
        console.log('❌ Credenciais salvas inválidas');
        return false;
      }

      console.log('🔄 Tentando login automático para:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user.emailVerified) {
        console.log('❌ Login automático falhou: email não verificado');
        return false;
      }

      console.log('✅ Login automático bem-sucedido');
      this.currentUser = result.user;
      firebaseSyncService.setUserId(result.user.uid);
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, result.user.uid);
      await AsyncStorage.setItem(USER_EMAIL_STORAGE_KEY, result.user.email || '');
      this.isExplicitLogout = false;
      return true;

    } catch (error) {
      console.log('❌ Erro no login automático:', error);
      // Se as credenciais salvas são inválidas, remove-las
      await AsyncStorage.removeItem(USER_CREDENTIALS_STORAGE_KEY);
      return false;
    }
  }

  // Salvar credenciais para login automático (opcional - apenas se usuário quiser)
  private async saveCredentials(email: string, password: string): Promise<void> {
    try {
      const credentials = JSON.stringify({ email, password });
      await AsyncStorage.setItem(USER_CREDENTIALS_STORAGE_KEY, credentials);
      console.log('💾 Credenciais salvas para login automático');
    } catch (error) {
      console.warn('⚠️ Erro ao salvar credenciais:', error);
    }
  }

  // Limpar credenciais salvas
  private async clearSavedCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_CREDENTIALS_STORAGE_KEY);
      console.log('🗑️ Credenciais salvas removidas');
    } catch (error) {
      console.warn('⚠️ Erro ao remover credenciais:', error);
    }
  }

  // Verificar se deve sincronizar com Firebase (APENAS usuários logados com email verificado)
  shouldSyncWithFirebase(): boolean {
    // Deve estar autenticado
    if (!this.isAuthenticated()) return false;
    
    // NÃO deve estar em modo offline
    if (this.isInOfflineMode()) return false;
    
    // DEVE ter email verificado (segurança extra)
    if (this.currentUser && !this.currentUser.emailVerified) {
      console.warn('❌ BLOQUEADO: Email não verificado - Firebase bloqueado');
      return false;
    }
    
    return true;
  }

  // Verificar se o usuário está em estado de logout (offline)
  isInOfflineMode(): boolean {
    return this.isExplicitLogout || !this.isAuthenticated();
  }

  // Log de segurança: detectar tentativas de acesso Firebase não autorizadas
  logSecurityViolation(action: string, userId?: string): void {
    const user = this.getCurrentUser();
    console.error(`🚨 VIOLAÇÃO DE SEGURANÇA: ${action}`);
    console.error(`   → Usuário ID: ${userId || user?.uid || 'null'}`);
    console.error(`   → Email verificado: ${user?.emailVerified || false}`);
    console.error(`   → Modo offline: ${this.isInOfflineMode()}`);
    console.error(`   → Deve sincronizar: ${this.shouldSyncWithFirebase()}`);
  }

  // Verificar se o Firebase está configurado adequadamente
  async checkFirebaseConnection(): Promise<boolean> {
    try {
      if (!this.currentUser) return false;
      
      // Tentar uma operação simples no Firestore para verificar permissões
      const testDoc = doc(db, 'users', this.currentUser.uid, 'data', 'test');
      await getDoc(testDoc);
      return true;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firebase Firestore não configurado adequadamente. Consulte FIRESTORE_RULES.md');
        return false;
      }
      return true; // Outros erros não são de configuração
    }
  }

  // Login com email/senha
  async signInWithEmail(email: string, password: string): Promise<User | null> {
    try {
      this.isExplicitLogout = false; // Reset logout flag
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar se o email foi verificado
      if (!result.user.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      
      this.currentUser = result.user;
      firebaseSyncService.setUserId(result.user.uid);
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, result.user.uid);
      await AsyncStorage.setItem(USER_EMAIL_STORAGE_KEY, result.user.email || '');

      // Salvar credenciais para login automático
      await this.saveCredentials(email, password);

      // Após login, tentar enviar dados locais para o novo usuário
      try {
        const sportsLocal = await AsyncStorage.getItem('user_sports_list');
        if (sportsLocal) await firebaseSyncService.saveToFirebase('sports', JSON.parse(sportsLocal));
        const workoutsLocal = await AsyncStorage.getItem('user_workouts_storage');
        if (workoutsLocal) await firebaseSyncService.saveToFirebase('workouts', JSON.parse(workoutsLocal));
        const supplementsLocal = await AsyncStorage.getItem('user_supplements_list');
        if (supplementsLocal) await firebaseSyncService.saveToFirebase('supplements', JSON.parse(supplementsLocal));
      } catch (e) {
        // Não falhar o login se o push falhar
        console.warn('Aviso: falha ao enviar dados locais após login:', e);
      }

      return this.currentUser;
    } catch (error) {
      logFirebaseError('Erro no login com email', error);
      throw error;
    }
  }

  // Registrar (criar) uma conta com email/senha
  async registerWithEmail(email: string, password: string): Promise<User | null> {
    try {
      this.isExplicitLogout = false; // Reset logout flag
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Enviar email de verificação para nova conta
      await sendEmailVerification(result.user);
      
      this.currentUser = result.user;
      firebaseSyncService.setUserId(result.user.uid);
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, result.user.uid);
      return this.currentUser;
    } catch (error) {
      logFirebaseError('Erro no registro com email', error);
      throw error;
    }
  }

  // Reenviar email de verificação
  async resendVerificationEmail(): Promise<void> {
    try {
      if (this.currentUser && !this.currentUser.emailVerified) {
        await sendEmailVerification(this.currentUser);
      } else {
        throw new Error('Usuário não encontrado ou email já verificado');
      }
    } catch (error) {
      logFirebaseError('Erro ao reenviar email de verificação', error);
      throw error;
    }
  }

  // Verificar se o email foi verificado (recarregar dados do usuário)
  async checkEmailVerification(): Promise<boolean> {
    try {
      if (this.currentUser) {
        await this.currentUser.reload();
        return this.currentUser.emailVerified;
      }
      return false;
    } catch (error) {
      logFirebaseError('Erro ao verificar status do email', error);
      return false;
    }
  }

  // Enviar email de redefinição de senha
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      logFirebaseError('Erro ao enviar email de redefinição de senha', error);
      throw error;
    }
  }

  // Logout (remove dados locais e evita login automático)
  async logout(): Promise<void> {
    try {
      this.isExplicitLogout = true; // Marcar como logout explícito
      await auth.signOut();
      await AsyncStorage.removeItem(USER_ID_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_EMAIL_STORAGE_KEY);
      await AsyncStorage.removeItem(FIRST_LOGIN_STORAGE_KEY); // Limpar flag de primeiro login
      await this.clearSavedCredentials(); // Limpar credenciais salvas
      firebaseSyncService.removeAllListeners();
      this.currentUser = null;
      console.log('✅ Logout realizado - credenciais removidas');
    } catch (error) {
      logFirebaseError('Erro no logout', error);
    }
  }
}

export const authService = new AuthService();