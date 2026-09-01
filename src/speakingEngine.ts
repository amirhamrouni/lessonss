import { richLearningLessons } from './curriculumAll';

export type SpeakingPrompt = {
  id: string;
  lessonId: string;
  prompt: string;
  target: string;
  words: string[];
};

export type SpeakingMistakeSignal = {
  lessonId?: string;
  corrected?: string;
  latestExample?: string;
  timesSeen?: number;
};

export type SpeechScore = {
  accuracy: number;
  matchedWords: string[];
  missingWords: string[];
  extraWords: string[];
  verdict: 'excellent' | 'good' | 'retry';
};

export function normalizeSpeech(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(Boolean);
}

function editDistance(a: string[], b: string[]): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

export function scoreSpokenAttempt(target: string, transcript: string): SpeechScore {
  const expected = normalizeSpeech(target);
  const actual = normalizeSpeech(transcript);
  const distance = editDistance(expected, actual);
  const accuracy = expected.length
    ? Math.max(0, Math.round((1 - distance / Math.max(expected.length, actual.length, 1)) * 100))
    : 100;

  const actualCounts = new Map<string, number>();
  for (const word of actual) actualCounts.set(word, (actualCounts.get(word) || 0) + 1);
  const matchedWords: string[] = [];
  const missingWords: string[] = [];
  for (const word of expected) {
    const left = actualCounts.get(word) || 0;
    if (left > 0) {
      matchedWords.push(word);
      actualCounts.set(word, left - 1);
    } else missingWords.push(word);
  }
  const extraWords: string[] = [];
  for (const [word, count] of actualCounts) for (let i = 0; i < count; i += 1) extraWords.push(word);

  return {
    accuracy,
    matchedWords,
    missingWords,
    extraWords,
    verdict: accuracy >= 90 ? 'excellent' : accuracy >= 70 ? 'good' : 'retry',
  };
}

export function buildSpeakingPrompts(lessons = richLearningLessons): SpeakingPrompt[] {
  const prompts: SpeakingPrompt[] = [];
  for (const lesson of lessons) {
    for (let index = 0; index < lesson.activities.length; index += 1) {
      const activity = lesson.activities[index] as any;
      if (activity?.type !== 'sentence_build' || typeof activity.answer !== 'string') continue;
      prompts.push({
        id: `${lesson.id}-sentence-${index}`,
        lessonId: lesson.id,
        prompt: typeof activity.prompt === 'string' ? activity.prompt : lesson.title,
        target: activity.answer,
        words: normalizeSpeech(activity.answer),
      });
    }
  }
  return prompts;
}

export const speakingPrompts = buildSpeakingPrompts();

export function prioritizeSpeakingPrompts(
  prompts: SpeakingPrompt[],
  mistakes: SpeakingMistakeSignal[],
): SpeakingPrompt[] {
  const lessonBoost = new Map<string, number>();
  for (const mistake of mistakes) {
    if (!mistake.lessonId) continue;
    const boost = Math.max(1, Number(mistake.timesSeen) || 1);
    lessonBoost.set(mistake.lessonId, (lessonBoost.get(mistake.lessonId) || 0) + boost);
  }
  return [...prompts].sort((a, b) => {
    const scoreB = lessonBoost.get(b.lessonId) || 0;
    const scoreA = lessonBoost.get(a.lessonId) || 0;
    return scoreB - scoreA || a.id.localeCompare(b.id);
  });
}
