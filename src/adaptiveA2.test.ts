import { describe, expect, it } from 'vitest';
import { richA2 } from './curriculumAll';
import { buildSentenceItems, sentenceItems } from './sentenceBuilder';
import { buildSpeakingPrompts, speakingPrompts } from './speakingEngine';

describe('A2 adaptive practice coverage', () => {
  it('generates sentence-builder items from A2 rich lessons', () => {
    const a2Items = sentenceItems.filter(item => item.sourceLessonId.startsWith('a2-'));
    expect(a2Items.length).toBeGreaterThan(0);

    const lessonsWithBuilders = richA2.filter(lesson => lesson.activities.some(activity => activity.type === 'sentence_build'));
    const covered = new Set(a2Items.map(item => item.sourceLessonId));
    for (const lesson of lessonsWithBuilders) expect(covered.has(lesson.id)).toBe(true);
  });

  it('generates guided speaking prompts from A2 sentence-build activities', () => {
    const a2Prompts = speakingPrompts.filter(prompt => prompt.lessonId.startsWith('a2-'));
    expect(a2Prompts.length).toBeGreaterThan(0);

    const lessonsWithBuilders = richA2.filter(lesson => lesson.activities.some(activity => activity.type === 'sentence_build'));
    const covered = new Set(a2Prompts.map(prompt => prompt.lessonId));
    for (const lesson of lessonsWithBuilders) expect(covered.has(lesson.id)).toBe(true);
  });

  it('keeps sentence and speaking generators deterministic from the unified curriculum', () => {
    expect(buildSentenceItems()).toEqual(sentenceItems);
    expect(buildSpeakingPrompts()).toEqual(speakingPrompts);
  });
});
