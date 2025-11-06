// config/firebase.ts

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Substitua pela configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCaMtekCg9bZXpZ7fT9GmqCVutW5MLpd9A",
  authDomain: "gymflow-prod-57ee8.firebaseapp.com",
  projectId: "gymflow-prod-57ee8",
  storageBucket: "gymflow-prod-57ee8.firebasestorage.app",
  messagingSenderId: "231550631555",
  appId: "1:231550631555:web:001fd43d35a9f4e3cf65b6",
  measurementId: "G-DM1DXVGHGS"
};

// Verificar se o Firebase já foi inicializado
// Se sim, usar a instância existente; se não, inicializar uma nova
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Auth
export const auth = getAuth(app);

// Inicializar Storage (para imagens/vídeos se necessário)
export const storage = getStorage(app);

// Para desenvolvimento, você pode usar o emulador do Firestore
// Descomente as linhas abaixo se quiser usar o emulador local
/*
if (__DEV__) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
*/

export default app;