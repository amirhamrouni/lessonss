import { GoogleGenAI } from '@google/genai';
import { requireFirebaseUser } from './_auth.js';
import { checkPersistentQuota } from './_quota.js';

type VercelRequest = { method?: string; headers?: { authorization?: string | string[] } };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let uid = '';
  try {
    const decoded = await requireFirebaseUser(req.headers);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const quota = await checkPersistentQuota(`live-token:${uid}`, 8, 60 * 60 * 1000);
    if (!quota.allowed) {
      return res.status(429).json({
        error: 'Live speaking session limit reached. Please try again later.',
        retryAfterSeconds: quota.retryAfterSeconds,
      });
    }
  } catch (error) {
    console.error('Live quota error', error instanceof Error ? error.message : 'unknown');
    return res.status(503).json({ error: 'Usage protection is temporarily unavailable' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Live AI is not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const expireTime = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview',
        },
      },
    });

    return res.status(200).json({ token: token.name, expiresAt: expireTime });
  } catch (error) {
    console.error('Live token error', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'Could not create live session token' });
  }
}
