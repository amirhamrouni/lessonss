import { describe, expect, it } from 'vitest';
import { buildTwinSnapshot, rankWeakSkills, trimTwinConversation } from './twinMemory';

describe('AI Twin memory', () => {
  it('keeps only the most recent real conversation turns', () => {
    const turns = Array.from({ length: 14 }, (_, index) => ({ role: index % 2 ? 'twin' as const : 'learner' as const, text: ` turn ${index} ` }));
    const trimmed = trimTwinConversation(turns, 6);
    expect(trimmed).toHaveLength(6);
    expect(trimmed[0].text).toBe('turn 8');
    expect(trimmed[5].text).toBe('turn 13');
  });

  it('ranks repeated learner weaknesses instead of treating mistakes equally', () => {
    const weak = rankWeakSkills([
      { skill: 'speaking', timesSeen: 4 },
      { skill: 'grammar', timesSeen: 2 },
      { skill: 'speaking', timesSeen: 3 },
    ]);
    expect(weak[0]).toEqual({ skill: 'speaking', weight: 7 });
    expect(weak[1]).toEqual({ skill: 'grammar', weight: 2 });
  });

  it('builds a bounded snapshot from progress, mistakes, review cards and conversation', () => {
    const snapshot = buildTwinSnapshot({
      now: new Date('2026-09-01T12:00:00.000Z'),
      progress: [
        { lessonId: 'a1-u1-l1', completed: true },
        { lessonId: 'a1-u1-l2', completed: false },
        { lessonId: 'a1-u2-l1', completed: true },
      ],
      mistakes: [
        { original: 'I is home', corrected: 'I am home', reason: 'Use am with I', skill: 'grammar', timesSeen: 3 },
        { original: 'station', corrected: 'station', reason: 'Speech mismatch', skill: 'speaking', timesSeen: 5 },
      ],
      reviewCards: [
        { term: 'station', dueAt: new Date('2026-09-01T11:00:00.000Z').getTime(), mistakeBoosts: 2 },
        { term: 'coffee', dueAt: new Date('2026-09-02T11:00:00.000Z').getTime() },
      ],
      conversation: [{ role: 'learner', text: 'How do I ask for the station?' }, { role: 'twin', text: 'Say: Where is the station?' }],
    });

    expect(snapshot.completedLessons).toEqual(['a1-u1-l1', 'a1-u2-l1']);
    expect(snapshot.weakSkills[0]).toEqual({ skill: 'speaking', weight: 5 });
    expect(snapshot.recentMistakes[0].original).toBe('station');
    expect(snapshot.dueReviewTerms).toEqual(['station']);
    expect(snapshot.recentConversation).toHaveLength(2);
  });
});
