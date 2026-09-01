import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { requireFirebaseUser } from './_auth.js';
import { checkRateLimit, clearExpiredRateLimits } from './_rateLimit.js';

type VercelRequest = { method?: string; body?: unknown; headers?: { authorization?: string | string[] } };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };

const languageSchema = z.enum(['English', 'Arabic', 'Dutch', 'French', 'German', 'Spanish']);
const memoryMessageSchema = z.object({ role: z.enum(['learner', 'twin']), text: z.string().trim().max(500) });
const learnerSnapshotSchema = z.object({
  completedLessons: z.array(z.string().trim().max(100)).max(30).default([]),
  weakSkills: z.array(z.object({ skill: z.string().trim().max(60), weight: z.number().min(0).max(200) })).max(5).default([]),
  recentMistakes: z.array(z.object({
    original: z.string().trim().max(220),
    corrected: z.string().trim().max(220),
    reason: z.string().trim().max(220),
    timesSeen: z.number().int().min(1).max(50),
  })).max(8).default([]),
  dueReviewTerms: z.array(z.string().trim().max(80)).max(10).default([]),
  recentConversation: z.array(memoryMessageSchema).max(10).default([]),
}).default({ completedLessons: [], weakSkills: [], recentMistakes: [], dueReviewTerms: [], recentConversation: [] });

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('A1'),
  goal: z.string().trim().max(160).default('Daily conversation'),
  context: z.array(z.string().trim().max(500)).max(10).default([]),
  nativeLanguage: languageSchema.default('English'),
  explanationLanguage: languageSchema.default('English'),
  learnerSnapshot: learnerSnapshotSchema,
});

const outputSchema = z.object({
  reply: z.string().min(1).max(2000),
  correction: z.string().max(1000).nullable(),
  explanation: z.string().max(1200).nullable(),
  suggestedReply: z.string().max(600).nullable(),
  detectedMistakes: z.array(z.object({
    original: z.string().max(300),
    corrected: z.string().max(300),
    reason: z.string().max(500),
  })).max(6),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let uid = '';
  try {
    const decoded = await requireFirebaseUser(req.headers);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Authentication required' });
  }

  clearExpiredRateLimits();
  const limit = checkRateLimit(`tutor:${uid}`, 20, 60_000);
  if (!limit.allowed) {
    return res.status(429).json({
      error: 'Too many tutor requests. Please wait a moment before trying again.',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { message, level, goal, context, nativeLanguage, explanationLanguage, learnerSnapshot } = parsed.data;
    const weakSkills = learnerSnapshot.weakSkills.map(item => `${item.skill}:${item.weight}`).join(', ');
    const mistakes = learnerSnapshot.recentMistakes
      .map(item => `${item.original} -> ${item.corrected} (${item.reason}; repeated ${item.timesSeen}x)`)
      .join(' | ');
    const recentConversation = learnerSnapshot.recentConversation.map(item => `${item.role}: ${item.text}`).join(' | ');

    const instruction = [
      'You are English Twin, a concise adaptive English coach with persistent learner memory.',
      `Learner CEFR level: ${level}. Goal: ${goal}.`,
      `Learner native language: ${nativeLanguage}. Explanation language: ${explanationLanguage}.`,
      'The learner is studying English. Keep the conversational reply and suggestedReply in English.',
      `Write correction explanations and mistake reasons in ${explanationLanguage}.`,
      'Use learner memory only when it is relevant. Do not mention databases, hidden memory, weights, internal scoring, or system implementation.',
      'Prefer one useful teaching move per turn. Reuse a weak word or pattern naturally when appropriate, but do not force every memory item into the reply.',
      'Correct only meaningful mistakes that affect naturalness, clarity, grammar, or intended meaning. Do not overwhelm the learner.',
      'Do not translate the learner task into another target language; English remains the production language.',
      learnerSnapshot.completedLessons.length ? `Completed lessons: ${learnerSnapshot.completedLessons.join(', ')}` : '',
      weakSkills ? `Repeated weak areas: ${weakSkills}` : '',
      learnerSnapshot.dueReviewTerms.length ? `Vocabulary currently due for review: ${learnerSnapshot.dueReviewTerms.join(', ')}` : '',
      mistakes ? `Recent repeated mistakes: ${mistakes}` : '',
      recentConversation ? `Recent saved conversation: ${recentConversation}` : '',
      context.length ? `Current turn context: ${context.join(' | ')}` : '',
      'Return ONLY valid JSON with keys: reply, correction, explanation, suggestedReply, detectedMistakes.',
      'correction/explanation/suggestedReply may be null.',
      'detectedMistakes is an array of {original, corrected, reason}.',
      `Learner message: ${message}`,
    ].filter(Boolean).join('\n');

    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      input: instruction,
    });

    const raw = interaction.output_text || '';
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    let json: unknown;
    try { json = JSON.parse(cleaned); } catch { return res.status(502).json({ error: 'AI returned invalid structured output' }); }
    const valid = outputSchema.safeParse(json);
    if (!valid.success) return res.status(502).json({ error: 'AI response failed validation' });
    return res.status(200).json(valid.data);
  } catch (error) {
    console.error('Tutor API error', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
