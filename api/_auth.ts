import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseProjectId } from './_config.js';

type HeaderBag = { authorization?: string | string[] };

function ensureAdmin() {
  if (getApps().length) return;
  const projectId = getFirebaseProjectId();
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    const parsed = JSON.parse(rawServiceAccount);
    initializeApp({ credential: cert(parsed), projectId: projectId || parsed.project_id });
    return;
  }

  // ID-token verification only needs a trusted project ID plus Google's public
  // signing certificates. Privileged Firestore/Admin operations still require
  // service-account credentials and are handled separately.
  initializeApp({ projectId });
}

export async function requireFirebaseUser(headers: HeaderBag | undefined) {
  const raw = headers?.authorization;
  const authorization = Array.isArray(raw) ? raw[0] : raw;
  if (!authorization?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) throw new Error('UNAUTHORIZED');

  try {
    ensureAdmin();
    return await getAuth().verifyIdToken(token);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') throw error;
    throw new Error('UNAUTHORIZED');
  }
}
