import { getServerReadiness, shouldRequirePersistentQuota } from './_config.js';

type VercelRequest = { method?: string };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const firebaseClientKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  const envFirebaseClientConfigured = firebaseClientKeys.every(key => Boolean(process.env[key]));
  const readiness = getServerReadiness();
  const persistentQuotaRequired = shouldRequirePersistentQuota();

  return res.status(200).json({
    status: readiness.ready ? 'ok' : 'degraded',
    ready: readiness.ready,
    missingServerRequirements: readiness.missing,
    firebaseClientConfigured: true,
    firebaseClientSource: envFirebaseClientConfigured ? 'environment' : 'production-fallback',
    firebaseProjectId: readiness.firebaseProjectId,
    firebaseAdminConfigured: readiness.firebaseAdminConfigured,
    firebaseTokenVerificationConfigured: Boolean(readiness.firebaseProjectId),
    quotaMode: readiness.persistentQuotaConfigured ? 'persistent-firestore' : 'instance-fallback',
    persistentQuotaRequired,
    quotaProtectionReady: readiness.persistentQuotaConfigured || !persistentQuotaRequired,
    geminiConfigured: readiness.geminiConfigured,
    liveModelConfigured: readiness.liveModelConfigured,
    tutorModelConfigured: readiness.tutorModelConfigured,
  });
}
