import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const productionFallback = {
  apiKey: 'AIzaSyAEhnv2ZhP1EU5SYAtR3C_D4j-R5zbuXWg',
  authDomain: 'gen-lang-client-0217548336.firebaseapp.com',
  projectId: 'gen-lang-client-0217548336',
  storageBucket: 'gen-lang-client-0217548336.firebasestorage.app',
  messagingSenderId: '391040417078',
  appId: '1:391040417078:web:9e80a3a907190e51c10797',
};

const envFirebase = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const envConfigured = Object.values(envFirebase).every(Boolean);
const configuredFirebase = envConfigured ? envFirebase : productionFallback;

export const isFirebaseConfigured = true;

const app = getApps().length ? getApps()[0] : initializeApp(configuredFirebase);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
