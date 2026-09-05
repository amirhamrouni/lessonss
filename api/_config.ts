export type ServerReadiness = {
  ready: boolean;
  missing: string[];
  firebaseProjectId: string;
  firebaseAdminConfigured: boolean;
  persistentQuotaConfigured: boolean;
  persistentQuotaRequired: boolean;
  geminiConfigured: boolean;
  liveModelConfigured: boolean;
  tutorModelConfigured: boolean;
};

const PRODUCTION_PROJECT_ID = 'gen-lang-client-0217548336';

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

export function getServerReadiness(env: NodeJS.ProcessEnv = process.env): ServerReadiness {
  const firebaseProjectId = getFirebaseProjectId(env);
  const firebaseAdminConfigured = hasValue(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const persistentQuotaRequired = shouldRequirePersistentQuota(env);
  const geminiConfigured = hasValue(env.GEMINI_API_KEY);
  const liveModelConfigured = hasValue(env.GEMINI_LIVE_MODEL);
  const tutorModelConfigured = hasValue(env.GEMINI_MODEL);
  const persistentQuotaConfigured = firebaseAdminConfigured;

  const missing: string[] = [];
  if (!firebaseProjectId) missing.push('FIREBASE_PROJECT_ID');
  if (!geminiConfigured) missing.push('GEMINI_API_KEY');
  if (persistentQuotaRequired && !firebaseAdminConfigured) missing.push('FIREBASE_SERVICE_ACCOUNT_JSON');

  return {
    ready: missing.length === 0,
    missing,
    firebaseProjectId,
    firebaseAdminConfigured,
    persistentQuotaConfigured,
    persistentQuotaRequired,
    geminiConfigured,
    liveModelConfigured,
    tutorModelConfigured,
  };
}
