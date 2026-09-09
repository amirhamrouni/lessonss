export type ServerReadiness = {
  ready: boolean;
  missing: string[];
  firebaseProjectId: string;
  firebaseAdminConfigured: boolean;
  firebaseAdminCredentialSource: 'service-account-json' | 'split-env' | 'none';
  persistentQuotaConfigured: boolean;
  persistentQuotaRequired: boolean;
  geminiConfigured: boolean;
  liveModelConfigured: boolean;
  tutorModelConfigured: boolean;
  liveModel: string;
  tutorModel: string;
};

const PRODUCTION_PROJECT_ID = 'gen-lang-client-0217548336';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';
export const DEFAULT_GEMINI_LIVE_MODEL = 'gemini-3.1-flash-live-preview';

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function shouldRequirePersistentQuota(env: NodeJS.ProcessEnv = process.env) {
  const value = env.REQUIRE_PERSISTENT_QUOTA?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export function getFirebaseProjectId(env: NodeJS.ProcessEnv = process.env) {
  return env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || PRODUCTION_PROJECT_ID;
}

export function getTutorModel(env: NodeJS.ProcessEnv = process.env) {
  return env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getLiveModel(env: NodeJS.ProcessEnv = process.env) {
  return env.GEMINI_LIVE_MODEL?.trim() || DEFAULT_GEMINI_LIVE_MODEL;
}

export function getFirebaseAdminCredentialSource(env: NodeJS.ProcessEnv = process.env): ServerReadiness['firebaseAdminCredentialSource'] {
  if (hasValue(env.FIREBASE_SERVICE_ACCOUNT_JSON)) return 'service-account-json';
  if (hasValue(env.FIREBASE_CLIENT_EMAIL) && hasValue(env.FIREBASE_PRIVATE_KEY)) return 'split-env';
  return 'none';
}

export function getServerReadiness(env: NodeJS.ProcessEnv = process.env): ServerReadiness {
  const firebaseProjectId = getFirebaseProjectId(env);
  const firebaseAdminCredentialSource = getFirebaseAdminCredentialSource(env);
  const firebaseAdminConfigured = firebaseAdminCredentialSource !== 'none';
  const persistentQuotaRequired = shouldRequirePersistentQuota(env);
  const geminiConfigured = hasValue(env.GEMINI_API_KEY);
  const liveModel = getLiveModel(env);
  const tutorModel = getTutorModel(env);
  const persistentQuotaConfigured = firebaseAdminConfigured;

  const missing: string[] = [];
  if (!firebaseProjectId) missing.push('FIREBASE_PROJECT_ID');
  if (!geminiConfigured) missing.push('GEMINI_API_KEY');
  if (persistentQuotaRequired && !firebaseAdminConfigured) missing.push('FIREBASE_ADMIN_CREDENTIALS');

  return {
    ready: missing.length === 0,
    missing,
    firebaseProjectId,
    firebaseAdminConfigured,
    firebaseAdminCredentialSource,
    persistentQuotaConfigured,
    persistentQuotaRequired,
    geminiConfigured,
    liveModelConfigured: Boolean(liveModel),
    tutorModelConfigured: Boolean(tutorModel),
    liveModel,
    tutorModel,
  };
}
