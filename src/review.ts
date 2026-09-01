import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { Card, Grade, Rating, State, createEmptyCard, fsrs } from 'ts-fsrs';
import { db } from './firebase';
import { richA1 } from './curriculumAll';
import type { RichVisualWordActivity } from './richLesson';

export type ReviewSeed = {
  id: string;
  sourceLessonId: string;
  term: string;
  meaning: string;
  meanings?: Record<string, string>;
  example: string;
  phonetic?: string;
  visualId?: unknown;
};

export type StoredReviewCard = ReviewSeed & {
  dueAt: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  state: number;
  lastReviewAt: number | null;
  updatedAt?: unknown;
};

const normalizeSeedId = (term: string) => term
  .trim()
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const isVisualWord = (activity: unknown): activity is RichVisualWordActivity => {
  if (!activity || typeof activity !== 'object') return false;
  return (activity as { type?: string }).type === 'visual_word';
};

export function buildReviewSeedsFromRichLessons(lessons = richA1): ReviewSeed[] {
  const seeds: ReviewSeed[] = [];
  const usedIds = new Set<string>();

  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      if (!isVisualWord(activity)) continue;

      const baseId = normalizeSeedId(activity.word) || `${lesson.id}-word`;
      const id = usedIds.has(baseId) ? `${baseId}-${lesson.id}` : baseId;
      usedIds.add(id);

      seeds.push({
        id,
        sourceLessonId: lesson.id,
        term: activity.word,
        meaning: activity.meanings.English || activity.word,
        meanings: activity.meanings,
        example: activity.example,
        phonetic: activity.phonetic,
        visualId: activity.visualId,
      });
    }
  }

  return seeds;
}

export const reviewSeeds: ReviewSeed[] = buildReviewSeedsFromRichLessons();

export function meaningForLanguage(seed: ReviewSeed, language?: string | null): string {
  if (!language) return seed.meaning;
  const direct = seed.meanings?.[language];
  if (direct) return direct;

  const normalized = language.trim().toLowerCase();
  const match = Object.entries(seed.meanings || {}).find(([key]) => key.toLowerCase() === normalized);
  return match?.[1] || seed.meaning;
}

const scheduler = fsrs({ request_retention: 0.9, maximum_interval: 3650, enable_fuzz: true, enable_short_term: true });

function serialize(seed: ReviewSeed, card: Card): StoredReviewCard {
  return {
    ...seed,
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learningSteps: card.learning_steps,
    state: card.state,
    lastReviewAt: card.last_review?.getTime() ?? null,
  };
}

function hydrate(card: StoredReviewCard): Card {
  return {
    due: new Date(card.dueAt),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learningSteps,
    state: card.state as State,
    last_review: card.lastReviewAt ? new Date(card.lastReviewAt) : undefined,
  };
}

export function buildInitialReviewCard(seed: ReviewSeed, now = new Date()): StoredReviewCard {
  return serialize(seed, createEmptyCard(now));
}

export function scheduleReview(card: StoredReviewCard, rating: Rating, now = new Date()): StoredReviewCard {
  const next = scheduler.next(hydrate(card), now, rating as Grade).card;
  return serialize(card, next);
}

export function dueCards(cards: StoredReviewCard[], now = new Date()): StoredReviewCard[] {
  const time = now.getTime();
  return cards.filter(card => card.dueAt <= time).sort((a, b) => a.dueAt - b.dueAt);
}

export function seedsForCompletedLessons(completedLessonIds: string[]): ReviewSeed[] {
  const completed = new Set(completedLessonIds);
  return reviewSeeds.filter(seed => completed.has(seed.sourceLessonId));
}

export async function loadReviewCards(uid: string): Promise<StoredReviewCard[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'reviewCards'));
  return snap.docs.map(item => item.data() as StoredReviewCard);
}

export async function ensureReviewCards(uid: string, completedLessonIds: string[]): Promise<StoredReviewCard[]> {
  const existing = await loadReviewCards(uid);
  const existingIds = new Set(existing.map(card => card.id));
  const missing = seedsForCompletedLessons(completedLessonIds).filter(seed => !existingIds.has(seed.id));
  const created = missing.map(seed => buildInitialReviewCard(seed));
  await Promise.all(created.map(card => setDoc(doc(db, 'users', uid, 'reviewCards', card.id), { ...card, updatedAt: serverTimestamp() })));
  return [...existing, ...created];
}

export async function saveReviewRating(uid: string, card: StoredReviewCard, rating: Rating, now = new Date()) {
  const next = scheduleReview(card, rating, now);
  const cardRef = doc(db, 'users', uid, 'reviewCards', card.id);
  const logRef = doc(collection(db, 'users', uid, 'reviewLogs'));
  await Promise.all([
    setDoc(cardRef, { ...next, updatedAt: serverTimestamp() }, { merge: true }),
    setDoc(logRef, {
      cardId: card.id,
      sourceLessonId: card.sourceLessonId,
      rating,
      reviewedAt: serverTimestamp(),
      previousDueAt: card.dueAt,
      nextDueAt: next.dueAt,
    }),
  ]);
  return next;
}

export { Rating };
