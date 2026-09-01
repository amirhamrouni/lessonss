import { describe, expect, it } from 'vitest';
import { buildSpeakingPrompts, prioritizeSpeakingPrompts, scoreSpokenAttempt, speakingPrompts } from './speakingEngine';
import { richA1 } from './curriculumAll';

describe('speaking accuracy engine', () => {
  it('derives speaking drills from sentence-build activities', () => {
    const expected = richA1.reduce(
      (count, lesson) => count + lesson.activities.filter(activity => activity.type === 'sentence_build').length,
      0,
    );
    expect(speakingPrompts).toHaveLength(expected);
    expect(expected).toBeGreaterThan(5);
  });

  it('scores an exact spoken transcript as excellent', () => {
    const score = scoreSpokenAttempt("I'd like a coffee, please.", "I'd like a coffee please");
    expect(score.accuracy).toBe(100);
    expect(score.verdict).toBe('excellent');
    expect(score.missingWords).toEqual([]);
  });

  it('identifies missing target words', () => {
    const score = scoreSpokenAttempt('Where is the station', 'Where station');
    expect(score.accuracy).toBeLessThan(100);
    expect(score.missingWords).toContain('is');
    expect(score.missingWords).toContain('the');
  });

  it('prioritizes drills from lessons with repeated mistakes', () => {
    const prompts = buildSpeakingPrompts(richA1);
    const target = prompts.find(prompt => prompt.lessonId === 'a1-u1-l1') || prompts[0];
    const ranked = prioritizeSpeakingPrompts(prompts, [
      { lessonId: target.lessonId, timesSeen: 4 },
    ]);
    expect(ranked[0].lessonId).toBe(target.lessonId);
  });
});
