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

  return res.status(200).json({
    status: 'ok',
    firebaseClientConfigured: firebaseClientKeys.every(key => Boolean(process.env[key])),
    firebaseAdminConfigured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    liveModelConfigured: Boolean(process.env.GEMINI_LIVE_MODEL),
    tutorModelConfigured: Boolean(process.env.GEMINI_MODEL),
  });
}
