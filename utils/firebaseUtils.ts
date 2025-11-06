// utils/firebaseUtils.ts

import { FirebaseError } from 'firebase/app';

export const handleFirebaseError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'app/duplicate-app':
        return 'Firebase já foi inicializado. Reinicie o aplicativo.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      case 'auth/email-already-in-use':
        return 'Este email já está sendo usado por outra conta.';
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/user-not-found':
        return 'Usuário não encontrado.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'auth/user-disabled':
        return 'Esta conta foi desabilitada.';
      case 'auth/invalid-credential':
        return 'Credenciais inválidas.';
      case 'firestore/permission-denied':
        return 'Sem permissão para acessar dados.';
      case 'firestore/unavailable':
        return 'Firestore temporariamente indisponível.';
      case 'auth/anonymous-provider-disabled':
        return 'Login anônimo não habilitado.';
      default:
        console.warn('Firebase Error:', error.code, error.message);
        return `Erro do Firebase: ${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    // Tratar erros customizados
    if (error.message === 'EMAIL_NOT_VERIFIED') {
      return 'Email não verificado. Verifique sua caixa de entrada.';
    }
    return error.message;
  }
  
  return 'Erro desconhecido';
};

export const isFirebaseError = (error: unknown): error is FirebaseError => {
  return error instanceof FirebaseError;
};

export const logFirebaseError = (context: string, error: unknown) => {
  const errorMessage = handleFirebaseError(error);
  console.error(`🔥 ${context}:`, errorMessage);
  
  if (isFirebaseError(error)) {
    console.error('  Código:', error.code);
    console.error('  Mensagem:', error.message);
  }
};