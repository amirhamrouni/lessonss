import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { Card, Grade, Rating, State, createEmptyCard, fsrs } from 'ts-fsrs';
import { db } from './firebase';

export type ReviewSeed = {
  id: string;
  sourceLessonId: string;
  term: string;
  meaning: string;
  example: string;
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

export const reviewSeeds: ReviewSeed[] = [
  { id: 'hello', sourceLessonId: 'a1-u1-l1', term: 'hello', meaning: 'a greeting', example: 'Hello, nice to meet you.' },
  { id: 'goodbye', sourceLessonId: 'a1-u1-l1', term: 'goodbye', meaning: 'a phrase used when leaving', example: 'Goodbye! See you tomorrow.' },
  { id: 'meet', sourceLessonId: 'a1-u1-l1', term: 'meet', meaning: 'to see someone for the first time or by arrangement', example: 'Nice to meet you.' },
  { id: 'name', sourceLessonId: 'a1-u1-l2', term: 'name', meaning: 'the word used to identify a person', example: 'My name is Lina.' },
  { id: 'wake-up', sourceLessonId: 'a1-u2-l1', term: 'wake up', meaning: 'to stop sleeping', example: 'I wake up at seven.' },
  { id: 'breakfast', sourceLessonId: 'a1-u2-l1', term: 'breakfast', meaning: 'the first meal of the day', example: 'I eat breakfast at eight.' },
  { id: 'parents', sourceLessonId: 'a1-u3-l1', term: 'parents', meaning: 'your mother and father', example: 'My parents live nearby.' },
  { id: 'brother', sourceLessonId: 'a1-u3-l1', term: 'brother', meaning: 'a male sibling', example: 'I have one brother.' },
  { id: 'coffee', sourceLessonId: 'a1-u4-l1', term: 'coffee', meaning: 'a common hot drink', example: 'I would like a coffee, please.' },
  { id: 'water', sourceLessonId: 'a1-u4-l1', term: 'water', meaning: 'a clear drink', example: 'Can I have some water?' },
  { id: 'pharmacy', sourceLessonId: 'a1-u5-l1', term: 'pharmacy', meaning: 'a place where medicine is sold', example: 'The pharmacy is next to the bank.' },
  { id: 'station', sourceLessonId: 'a1-u5-l1', term: 'station', meaning: 'a place where trains or buses arrive and leave', example: 'Where is the station?' },
  { id: 'student', sourceLessonId: 'a1-u6-l1', term: 'student', meaning: 'a person who studies', example: 'I am a student.' },
  { id: 'teacher', sourceLessonId: 'a1-u6-l1', term: 'teacher', meaning: 'a person who teaches', example: 'She is an English teacher.' },
];

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
