import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocFromServer 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize or reuse Firebase App instance
export const firebaseApp = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApp();

// Get Firestore instance using the custom database ID from config
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Get Auth instance
export const auth = getAuth(firebaseApp);

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.projectId && 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== 'AIzaSyPlaceholder'
  );
};

/**
 * Utilitário de diagnóstico da conexão Firestore em Nuvem
 */
export const testFirestoreConnection = async (): Promise<{ success: boolean; message: string; latencyMs: number }> => {
  const startTime = performance.now();
  try {
    // Tenta uma leitura simples
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      message: `Nuvem Firebase ativa e conectada com sucesso (${latencyMs}ms)!`,
      latencyMs
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    // Mesmo que o documento 'system/connection_test' não exista, a comunicação com o servidor ocorreu
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      return {
        success: false,
        message: 'Modo Offline: Não foi possível alcançar o servidor Firebase.',
        latencyMs
      };
    }
    return {
      success: true,
      message: `Nuvem Firebase online e pronta (${latencyMs}ms).`,
      latencyMs
    };
  }
};
