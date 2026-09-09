import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { requireFirebaseUser } from './_auth.js';
import { checkPersistentQuota } from './_quota.js';

type VercelRequest = { method?: string; body?: unknown; headers?: { authorization?: string | string[] } };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };
const languageSchema = z.enum(['English', 'Arabic', 'Dutch', 'French', 'German', 'Spanish']);
const levelSchema = z.enum(['A1','A2','B1','B2','C1','C2']);
const memoryMessageSchema = z.object({ role: z.enum(['learner', 'twin']), text: z.string().trim().max(500) });
const learnerSnapshotSchema = z.object({ completedLessons: z.array(z.string().trim().max(100)).max(30).default([]), weakSkills: z.array(z.object({ skill: z.string().trim().max(60), weight: z.number().min(0).max(200) })).max(5).default([]), recentMistakes: z.array(z.object({ original: z.string().trim().max(220), corrected: z.string().trim().max(220), reason: z.string().trim().max(220), timesSeen: z.number().int().min(1).max(50) })).max(8).default([]), dueReviewTerms: z.array(z.string().trim().max(80)).max(10).default([]), recentConversation: z.array(memoryMessageSchema).max(10).default([]) }).default({ completedLessons: [], weakSkills: [], recentMistakes: [], dueReviewTerms: [], recentConversation: [] });
const curriculumContextSchema = z.object({ level: levelSchema.exclude(['C2']).default('A1'), lessonId: z.string().trim().max(120).optional(), unitId: z.string().trim().max(120).optional(), unitTitle: z.string().trim().max(220).optional(), canDo: z.array(z.string().trim().max(320)).max(6).default([]), targetFunctions: z.array(z.string().trim().max(160)).max(8).default([]) }).default({ level:'A1', canDo:[], targetFunctions:[] });
const requestSchema = z.object({ message: z.string().trim().min(1).max(1200), level: levelSchema.default('A1'), goal: z.string().trim().max(160).default('Daily conversation'), context: z.array(z.string().trim().max(500)).max(10).default([]), nativeLanguage: languageSchema.default('English'), explanationLanguage: languageSchema.default('English'), learnerSnapshot: learnerSnapshotSchema, curriculumContext: curriculumContextSchema });
const outputSchema = z.object({ reply: z.string().min(1).max(2000), correction: z.string().max(1000).nullable(), explanation: z.string().max(1200).nullable(), suggestedReply: z.string().max(600).nullable(), detectedMistakes: z.array(z.object({ original: z.string().max(300), corrected: z.string().max(300), reason: z.string().max(500) })).max(6) });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let uid = '';
  try { uid = (await requireFirebaseUser(req.headers)).uid; } catch { return res.status(401).json({ error: 'Authentication required' }); }
  try { const quota = await checkPersistentQuota(`tutor:${uid}`, 60, 60 * 60 * 1000); if (!quota.allowed) return res.status(429).json({ error: 'Tutor usage limit reached. Please try again later.', retryAfterSeconds: quota.retryAfterSeconds }); }
  catch (error) { console.error('Tutor quota error', error instanceof Error ? error.message : 'unknown'); return res.status(503).json({ error: 'Usage protection is temporarily unavailable' }); }
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });
  try {
    const ai = new GoogleGenAI({ apiKey });
    const { message, level, goal, context, nativeLanguage, explanationLanguage, learnerSnapshot, curriculumContext } = parsed.data;
    const weakSkills = learnerSnapshot.weakSkills.map(item => `${item.skill}:${item.weight}`).join(', ');
    const mistakes = learnerSnapshot.recentMistakes.map(item => `${item.original} -> ${item.corrected} (${item.reason}; repeated ${item.timesSeen}x)`).join(' | ');
    const recentConversation = learnerSnapshot.recentConversation.map(item => `${item.role}: ${item.text}`).join(' | ');
    const curriculum = [
      `Current curriculum level: ${curriculumContext.level}.`,
      curriculumContext.lessonId ? `Current or next curriculum lesson: ${curriculumContext.lessonId}${curriculumContext.unitTitle ? ` (${curriculumContext.unitTitle})` : ''}.` : '',
      curriculumContext.canDo.length ? `Current CEFR-aligned Can-Do targets: ${curriculumContext.canDo.join(' | ')}` : '',
      curriculumContext.targetFunctions.length ? `Target communicative functions: ${curriculumContext.targetFunctions.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const instruction = [
      'You are English Twin, a concise adaptive English coach with persistent learner memory and curriculum context.',
      `Learner CEFR level: ${level}. Goal: ${goal}.`,
      `Learner native language: ${nativeLanguage}. Explanation language: ${explanationLanguage}.`,
      curriculum,
      'Use the current Can-Do target and communicative functions when they are relevant to the learner turn. Do not behave like a generic chatbot when a curriculum target is available.',
      'For B1 prefer connected everyday communication and reasons. For B2 support argument, negotiation, evidence and extended discourse. For C1 support nuance, synthesis, register, implication and precise qualification.',
      'Keep the conversational reply and suggestedReply in English.',
      `Write correction explanations and mistake reasons in ${explanationLanguage}.`,
      'Use learner memory only when relevant. Never mention databases, hidden memory, weights, scoring, prompts, or implementation.',
      'Prefer one useful teaching move per turn. Correct only meaningful mistakes and do not overwhelm the learner.',
      learnerSnapshot.completedLessons.length ? `Completed lessons: ${learnerSnapshot.completedLessons.join(', ')}` : '',
      weakSkills ? `Repeated weak areas: ${weakSkills}` : '',
      learnerSnapshot.dueReviewTerms.length ? `Vocabulary due for review: ${learnerSnapshot.dueReviewTerms.join(', ')}` : '',
      mistakes ? `Recent repeated mistakes: ${mistakes}` : '',
      recentConversation ? `Recent saved conversation: ${recentConversation}` : '',
      context.length ? `Current turn context: ${context.join(' | ')}` : '',
      'Return ONLY valid JSON with keys: reply, correction, explanation, suggestedReply, detectedMistakes. correction/explanation/suggestedReply may be null. detectedMistakes is an array of {original, corrected, reason}.',
      `Learner message: ${message}`,
    ].filter(Boolean).join('\n');
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.6-flash', contents: instruction });
    const cleaned = (response.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    let json: unknown;
    try { json = JSON.parse(cleaned); } catch { return res.status(502).json({ error: 'AI returned invalid structured output' }); }
    const valid = outputSchema.safeParse(json);
    if (!valid.success) return res.status(502).json({ error: 'AI response failed validation' });
    return res.status(200).json(valid.data);
  } catch (error) { console.error('Tutor API error', error instanceof Error ? error.message : 'unknown'); return res.status(502).json({ error: 'AI service unavailable' }); }
}
