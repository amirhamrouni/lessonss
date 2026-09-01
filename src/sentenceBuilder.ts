import { richA1 } from './curriculumAll';

export type AdaptiveBuilderItem = {
  id: string;
  sourceLessonId: string;
  prompt: string;
  words: string[];
  answer: string[];
  answerText: string;
};

export type MistakeSignal = {
  lessonId?: string;
  corrected?: string;
  original?: string;
  timesSeen?: number;
  status?: string;
};

const slug = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export function buildSentenceItems() : AdaptiveBuilderItem[] {
  const items: AdaptiveBuilderItem[] = [];
  for (const lesson of richA1) {
    lesson.activities.forEach((activity, index) => {
      if (activity.type !== 'sentence_build') return;
      const answerText = activity.answer.trim();
      items.push({
        id: `${lesson.id}-${index}-${slug(answerText)}`,
        sourceLessonId: lesson.id,
        prompt: activity.prompt,
        words: [...activity.words],
        answer: answerText.split(/\s+/),
        answerText,
      });
    });
  }
  return items;
}

export const sentenceItems = buildSentenceItems();

function normalizedTokens(value = '') {
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
}

export function builderPriority(item: AdaptiveBuilderItem, mistakes: MistakeSignal[]) {
  const answerTokens = normalizedTokens(item.answerText);
  return mistakes.reduce((score, mistake) => {
    if (mistake.status === 'resolved') return score;
    const weight = Math.max(1, mistake.timesSeen || 1);
    if (mistake.lessonId === item.sourceLessonId) score += weight * 4;
    const mistakeTokens = normalizedTokens(`${mistake.corrected || ''} ${mistake.original || ''}`);
    const overlap = [...mistakeTokens].filter(token => answerTokens.has(token)).length;
    return score + overlap * weight * 2;
  }, 0);
}

export function rankSentenceItems(items: AdaptiveBuilderItem[], mistakes: MistakeSignal[]) {
  return [...items].sort((a, b) => {
    const priority = builderPriority(b, mistakes) - builderPriority(a, mistakes);
    return priority || a.sourceLessonId.localeCompare(b.sourceLessonId) || a.id.localeCompare(b.id);
  });
}

export function isBuilderCorrect(item: AdaptiveBuilderItem, built: string[]) {
  return item.answer.join(' ') === built.join(' ');
}
