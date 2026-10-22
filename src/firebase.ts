
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDatQgrYQIssv9XYf1RLargzi2i4vx1W2U",
  authDomain: "nexo-menu-digital-pedidos.firebaseapp.com",
  projectId: "nexo-menu-digital-pedidos",
  storageBucket: "nexo-menu-digital-pedidos.firebasestorage.app",
  messagingSenderId: "231146157516",
  appId: "1:231146157516:web:f1d2d8f3d731e6f62dd969"
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);

export const firebaseConfigured = true;
export const firebaseConfigMissing: string[] = [];
