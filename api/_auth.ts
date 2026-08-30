import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type HeaderBag = { authorization?: string | string[] };

function ensureAdmin() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    const parsed = JSON.parse(rawServiceAccount);
    initializeApp({ credential: cert(parsed), projectId: projectId || parsed.project_id });
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId });
}

export async function requireFirebaseUser(headers: HeaderBag | undefined) {
  const raw = headers?.authorization;
  const authorization = Array.isArray(raw) ? raw[0] : raw;
  if (!authorization?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) throw new Error('UNAUTHORIZED');

  try {
    ensureAdmin();
    return await getAuth().verifyIdToken(token, true);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') throw error;
    throw new Error('UNAUTHORIZED');
  }
}
