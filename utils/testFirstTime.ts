// Teste para limpar AsyncStorage e simular primeira abertura
// Execute este código no console do navegador ou em um componente de teste

import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetFirstTimeFlags = async () => {
  try {
    await AsyncStorage.removeItem('has_seen_welcome');
    await AsyncStorage.removeItem('has_seen_login');
    console.log('✅ Flags de primeira vez removidas - app simulará primeira abertura');
  } catch (error) {
    console.error('❌ Erro ao limpar flags:', error);
  }
};

export const checkFlags = async () => {
  try {
    const welcome = await AsyncStorage.getItem('has_seen_welcome');
    const login = await AsyncStorage.getItem('has_seen_login');
    
    console.log('🏠 has_seen_welcome:', welcome);
    console.log('🔐 has_seen_login:', login);
    
    return { welcome, login };
  } catch (error) {
    console.error('❌ Erro ao verificar flags:', error);
  }
};