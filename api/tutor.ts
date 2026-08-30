import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void };

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('A1'),
  goal: z.string().trim().max(160).default('Daily conversation'),
  context: z.array(z.string().trim().max(500)).max(8).default([]),
});

const outputSchema = z.object({
  reply: z.string().min(1),
  correction: z.string().nullable(),
  explanation: z.string().nullable(),
  suggestedReply: z.string().nullable(),
  detectedMistakes: z.array(z.object({
    original: z.string(),
    corrected: z.string(),
    reason: z.string(),
  })).max(6),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { message, level, goal, context } = parsed.data;
    const instruction = [
      'You are English Twin, a concise supportive English coach.',
      `Learner CEFR level: ${level}. Goal: ${goal}.`,
      'Reply in natural English appropriate to the learner level.',
      'Correct only meaningful mistakes. Do not overwhelm the learner.',
      'Return ONLY valid JSON with keys: reply, correction, explanation, suggestedReply, detectedMistakes.',
      'correction/explanation/suggestedReply may be null.',
      'detectedMistakes is an array of {original, corrected, reason}.',
      context.length ? `Relevant learning context: ${context.join(' | ')}` : '',
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
