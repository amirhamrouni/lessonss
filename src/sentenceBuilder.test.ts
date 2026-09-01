import { describe, expect, it } from 'vitest';
import { builderPriority, isBuilderCorrect, rankSentenceItems, sentenceItems } from './sentenceBuilder';

describe('adaptive sentence builder', () => {
  it('derives practice items from rich lesson sentence-build activities', () => {
    expect(sentenceItems.length).toBeGreaterThan(8);
    expect(sentenceItems.every(item => item.sourceLessonId.startsWith('a1-'))).toBe(true);
    expect(sentenceItems.every(item => item.answerText.length > 0 && item.words.length > 1)).toBe(true);
  });

  it('scores mistakes from the same lesson above unrelated mistakes', () => {
    const target = sentenceItems.find(item => item.sourceLessonId === 'a1-u1-l1')!;
    const sameLesson = builderPriority(target, [{ lessonId: 'a1-u1-l1', timesSeen: 2 }]);
    const unrelated = builderPriority(target, [{ lessonId: 'a1-u6-l1', timesSeen: 2 }]);
    expect(sameLesson).toBeGreaterThan(unrelated);
  });

  it('uses corrected/original token overlap to target relevant sentence practice', () => {
    const home = sentenceItems.find(item => item.answerText.toLowerCase().includes('home'))!;
    expect(builderPriority(home, [{ corrected: 'I am at home', original: 'I home am', timesSeen: 2 }])).toBeGreaterThan(0);
  });

  it('ranks the weakest sentence first', () => {
    const target = sentenceItems[2];
    const ranked = rankSentenceItems(sentenceItems, [{ lessonId: target.sourceLessonId, corrected: target.answerText, timesSeen: 5 }]);
    expect(ranked[0].sourceLessonId).toBe(target.sourceLessonId);
  });

  it('checks exact word order deterministically', () => {
    const item = sentenceItems[0];
    expect(isBuilderCorrect(item, item.answer)).toBe(true);
    expect(isBuilderCorrect(item, [...item.answer].reverse())).toBe(item.answer.length === 1);
  });
});
