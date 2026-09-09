import {
  Activity as LegacyActivity,
  Lesson as LegacyLesson,
  Unit as LegacyUnit,
  lessonById as baseLessonById,
  lessons as a1Lessons,
  lessonsForUnit as baseLessonsForUnit,
  units as a1Units,
} from './curriculum';
import { a2Lessons, a2Units } from './curriculumA2';
import { b1Lessons, b1Units } from './curriculumB1';
import { b2Lessons, b2Units } from './curriculumB2';
import { c1Lessons, c1Units } from './curriculumC1';
import type { CEFRLevel, LessonV2, Skill } from './curriculumV2';
import { isLessonV2 } from './curriculumV2';
import { richA1Lessons } from './richLesson';
import { richA1ExtraLessons } from './richLessonExtra';
import { richA1GrammarLessons } from './richLessonGrammar';
import { richA2Lessons } from './richLessonA2';

const typedA2Lessons = a2Lessons as LegacyLesson[];
const typedA2Units = a2Units as LegacyUnit[];
const richA1LessonsAll = [...richA1Lessons, ...richA1ExtraLessons, ...richA1GrammarLessons];
const richA1ById = new Map(richA1LessonsAll.map(lesson => [lesson.id, lesson]));
const richA2ById = new Map(richA2Lessons.map(lesson => [lesson.id, lesson]));
const enrichedA1Lessons = a1Lessons.map(lesson => (richA1ById.get(lesson.id) || lesson) as unknown as LegacyLesson);
const enrichedA2Lessons = typedA2Lessons.map(lesson => (richA2ById.get(lesson.id) || lesson) as unknown as LegacyLesson);

export type Activity = LegacyActivity;
export type DisplaySkill = LegacyLesson['skill'] | 'Writing' | 'Mediation';
export type AdvancedLesson = LessonV2 & { skill: DisplaySkill };
export type Lesson = LegacyLesson | AdvancedLesson;
export type Unit = LegacyUnit | { id: string; title: string; icon: string; lessons: string[] };
export type LearningLevel = Exclude<CEFRLevel, 'A0'>;

function displaySkill(skill: Skill): DisplaySkill {
  if (skill === 'grammar') return 'Grammar';
  if (skill === 'reading') return 'Reading';
  if (skill === 'listening') return 'Listening';
  if (skill === 'writing') return 'Writing';
  if (skill === 'mediation') return 'Mediation';
  if (skill === 'spoken_interaction' || skill === 'spoken_production' || skill === 'pronunciation') return 'Speaking';
  return 'Vocabulary';
}

function compatibleAdvancedLesson(lesson: LessonV2): AdvancedLesson {
  return { ...lesson, skill: displaySkill(lesson.primarySkill) };
}

export const advancedLessonsV2: LessonV2[] = [...b1Lessons, ...b2Lessons, ...c1Lessons];
const compatibleAdvancedLessons: AdvancedLesson[] = advancedLessonsV2.map(compatibleAdvancedLesson);

export const units: Unit[] = [...a1Units, ...typedA2Units, ...b1Units, ...b2Units, ...c1Units];
export const lessons: Lesson[] = [...enrichedA1Lessons, ...enrichedA2Lessons, ...compatibleAdvancedLessons];
export const a1 = enrichedA1Lessons;
export const a2 = enrichedA2Lessons;
export const b1 = compatibleAdvancedLessons.filter(lesson => lesson.level === 'B1');
export const b2 = compatibleAdvancedLessons.filter(lesson => lesson.level === 'B2');
export const c1 = compatibleAdvancedLessons.filter(lesson => lesson.level === 'C1');
export const richA1 = richA1LessonsAll;
export const richA2 = richA2Lessons;

// Keep this legacy export limited to the existing rich A1/A2 lesson shape.
// Advanced vocabulary/review seeds are read from advancedLessonsV2 explicitly.
export const richLearningLessons = [...richA1LessonsAll, ...richA2Lessons];

export const lessonById = (id: string): Lesson => {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
};

export const lessonsForUnit = (unitId: string) => lessons.filter(lesson => lesson.unitId === unitId);

export const levelForLesson = (lesson: Lesson): LearningLevel => {
  if (isLessonV2(lesson)) return lesson.level as LearningLevel;
  if (lesson.id.startsWith('a2-')) return 'A2';
  return 'A1';
};

export const lessonsForLevel = (level: LearningLevel) => lessons.filter(lesson => levelForLesson(lesson) === level);

export const unitsForLevel = (level: LearningLevel) => units.filter(unit => {
  if (level === 'A1') return !unit.id.startsWith('a2-') && !/^b1-|^b2-|^c1-/.test(unit.id);
  return unit.id.startsWith(`${level.toLowerCase()}-`);
});

void baseLessonById;
void baseLessonsForUnit;
