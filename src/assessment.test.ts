import { describe, expect, it } from 'vitest';
import { placementQuestions, scorePlacement } from './assessment';
import { Rating, buildInitialReviewCard, dueCards, reviewSeeds, scheduleReview, seedsForCompletedLessons } from './review';

describe('placement engine', () => {
  it('returns A1 when only beginner questions are answered correctly', () => {
    const answers: Record<string, string> = {};
    for (const q of placementQuestions) if (q.level === 'A1') answers[q.id] = q.answer;
    const result = scorePlacement(answers);
    expect(result.level).toBe('A1');
    expect(result.correct).toBe(2);
  });

  it('can reach C2 when every deterministic answer is correct', () => {
    const answers = Object.fromEntries(placementQuestions.map(q => [q.id, q.answer]));
    const result = scorePlacement(answers);
    expect(result.level).toBe('C2');
    expect(result.percent).toBe(100);
    expect(result.skillScores.Grammar).toBe(100);
  });
});

describe('FSRS review engine', () => {
  it('creates cards only for completed vocabulary source lessons', () => {
    const seeds = seedsForCompletedLessons(['a1-u1-l1']);
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds.every(seed => seed.sourceLessonId === 'a1-u1-l1')).toBe(true);
  });

  it('schedules a reviewed card into the future for Good', () => {
    const now = new Date('2026-08-30T10:00:00Z');
    const card = buildInitialReviewCard(reviewSeeds[0], now);
    const next = scheduleReview(card, Rating.Good, now);
    expect(next.reps).toBeGreaterThan(card.reps);
    expect(next.dueAt).toBeGreaterThan(now.getTime());
  });

  it('filters due cards deterministically', () => {
    const now = new Date('2026-08-30T10:00:00Z');
    const first = buildInitialReviewCard(reviewSeeds[0], now);
    const later = { ...buildInitialReviewCard(reviewSeeds[1], now), dueAt: now.getTime() + 60_000 };
    expect(dueCards([later, first], now).map(card => card.id)).toEqual([first.id]);
  });
});
