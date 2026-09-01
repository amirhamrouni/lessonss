type VercelRequest = { method?: string };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };

const PRODUCTION_PROJECT_ID = 'gen-lang-client-0217548336';

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
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || PRODUCTION_PROJECT_ID;

  return res.status(200).json({
    status: 'ok',
    firebaseClientConfigured: true,
    firebaseClientSource: envFirebaseClientConfigured ? 'environment' : 'production-fallback',
    firebaseProjectId: projectId,
    firebaseAdminConfigured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    firebaseTokenVerificationConfigured: Boolean(projectId),
    quotaMode: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'persistent-firestore' : 'instance-fallback',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    liveModelConfigured: Boolean(process.env.GEMINI_LIVE_MODEL),
    tutorModelConfigured: Boolean(process.env.GEMINI_MODEL),
  });
}
