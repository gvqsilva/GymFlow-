// utils/toastUtils.ts

import Toast from 'react-native-toast-message';

export interface ToastOptions {
  type: 'success' | 'error' | 'info';
  text1: string;
  text2?: string;
  visibilityTime?: number;
  position?: 'top' | 'bottom';
  topOffset?: number;
  bottomOffset?: number;
}

/**
 * Mostra um toast com delay para garantir que o componente Toast esteja montado
 */
export const showToast = (options: ToastOptions) => {
  // Pequeno delay para garantir que o layout está renderizado
  setTimeout(() => {
    Toast.show({
      ...options,
      visibilityTime: options.visibilityTime || 2500,
      position: options.position || 'top',
      topOffset: options.topOffset || 60,
    });
  }, 100);
};

/**
 * Toasts pré-configurados para ações comuns
 */
export const ToastPresets = {
  success: (title: string, message: string) => showToast({
    type: 'success',
    text1: title,
    text2: message,
  }),
  
  error: (title: string, message: string) => showToast({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 3000,
  }),
  
  info: (title: string, message: string) => showToast({
    type: 'info',
    text1: title,
    text2: message,
  }),
  
  // Toasts específicos para ações do app
  workoutCreated: (workoutName: string) => showToast({
    type: 'success',
    text1: 'Treino criado!',
    text2: `${workoutName} foi salvo com sucesso.`,
  }),
  
  exerciseAdded: (exerciseName: string) => showToast({
    type: 'success',
    text1: 'Exercício adicionado!',
    text2: `${exerciseName} foi adicionado ao treino.`,
  }),
  
  supplementAdded: (supplementName: string) => showToast({
    type: 'success',
    text1: 'Suplemento adicionado!',
    text2: `${supplementName} foi salvo na sua lista.`,
  }),
  
  sportAdded: (sportName: string) => showToast({
    type: 'success',
    text1: 'Esporte adicionado!',
    text2: `${sportName} foi salvo na sua lista.`,
  }),
  
  configSaved: () => showToast({
    type: 'success',
    text1: 'Configurações salvas!',
    text2: 'Suas preferências foram atualizadas.',
  }),
  
  profileUpdated: () => showToast({
    type: 'success',
    text1: 'Perfil atualizado!',
    text2: 'Suas informações foram salvas.',
  }),
};