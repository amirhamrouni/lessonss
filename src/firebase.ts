import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const configuredFirebase = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(configuredFirebase).every(Boolean);

// Firebase Auth validates apiKey even when tests only import deterministic learning logic.
// A local placeholder project prevents import-time crashes in CI; real auth remains disabled
// in the UI until every VITE_FIREBASE_* value is supplied.
const bootstrapFirebase = isFirebaseConfigured
  ? configuredFirebase
  : {
      apiKey: 'AIzaSyEnglishTwinLocalBootstrap000000000',
      authDomain: 'english-twin-local.invalid',
      projectId: 'english-twin-local',
      storageBucket: 'english-twin-local.invalid',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:english-twin-local',
    };

const app = getApps().length ? getApps()[0] : initializeApp(bootstrapFirebase);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
