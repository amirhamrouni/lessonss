import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { richA1 } from './curriculumAll';
import {
  buildInitialReviewCard,
  buildReviewSeedsFromRichLessons,
  dueCards,
  meaningForLanguage,
  reviewSeeds,
  scheduleReview,
  seedsForCompletedLessons,
  seedsForMistake,
} from './review';

describe('smart review engine', () => {
  it('derives review seeds from rich visual-word activities instead of a hand-maintained list', () => {
    const expected = richA1.reduce(
      (count, lesson) => count + lesson.activities.filter(activity => activity.type === 'visual_word').length,
      0,
    );
    expect(reviewSeeds).toHaveLength(expected);
    expect(expected).toBeGreaterThan(15);
  });

  it('keeps generated review ids unique while preserving familiar legacy ids', () => {
    const ids = reviewSeeds.map(seed => seed.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('hello');
    expect(ids).toContain('water');
    expect(ids).toContain('coffee');
    expect(ids).toContain('station');
  });

  it('includes every visual-word lesson automatically', () => {
    const generated = buildReviewSeedsFromRichLessons(richA1);
    const sourceLessons = new Set(generated.map(seed => seed.sourceLessonId));
    const lessonsWithWords = richA1.filter(lesson => lesson.activities.some(activity => activity.type === 'visual_word'));
    for (const lesson of lessonsWithWords) expect(sourceLessons.has(lesson.id)).toBe(true);
  });

  it('only unlocks cards from completed lessons', () => {
    const seeds = seedsForCompletedLessons(['a1-u1-l1']);
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds.every(seed => seed.sourceLessonId === 'a1-u1-l1')).toBe(true);
    expect(seeds.some(seed => seed.term === 'Hello')).toBe(true);
  });

  it('returns the learner support-language meaning with a safe fallback', () => {
    const hello = reviewSeeds.find(seed => seed.id === 'hello');
    expect(hello).toBeTruthy();
    expect(meaningForLanguage(hello!, 'Arabic')).toBe('مرحبا');
    expect(meaningForLanguage(hello!, 'dutch')).toBe('Hallo');
    expect(meaningForLanguage(hello!, 'Unknown')).toBe(hello!.meaning);
  });

  it('targets the review word that appears in a real lesson mistake context', () => {
    const targeted = seedsForMistake('a1-u1-l1', 'I wrote: I am home. Target: I am at home.');
    expect(targeted.map(seed => seed.id)).toEqual(['home']);
  });

  it('falls back to the lesson vocabulary when a mistake has no direct vocabulary match', () => {
    const lessonSeeds = reviewSeeds.filter(seed => seed.sourceLessonId === 'a1-u1-l1');
    const targeted = seedsForMistake('a1-u1-l1', 'The word order was incorrect.');
    expect(targeted.map(seed => seed.id).sort()).toEqual(lessonSeeds.map(seed => seed.id).sort());
  });

  it('puts mistake-boosted due cards before otherwise equivalent review cards', () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    const first = buildInitialReviewCard(reviewSeeds[0], now);
    const second = { ...buildInitialReviewCard(reviewSeeds[1], now), mistakeBoosts: 3 };
    expect(dueCards([first, second], now)[0].id).toBe(second.id);
  });

  it('uses FSRS to move a reviewed card into the future', () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    const seed = reviewSeeds[0];
    const initial = buildInitialReviewCard(seed, now);
    expect(dueCards([initial], now)).toHaveLength(1);

    const next = scheduleReview(initial, Rating.Good, now);
    expect(next.reps).toBeGreaterThan(initial.reps);
    expect(next.dueAt).toBeGreaterThan(now.getTime());
    expect(dueCards([next], now)).toHaveLength(0);
  });
});
