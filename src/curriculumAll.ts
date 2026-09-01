import { Activity, Lesson, Unit, lessonById as baseLessonById, lessons as a1Lessons, lessonsForUnit as baseLessonsForUnit, units as a1Units } from './curriculum';
import { a2Lessons, a2Units } from './curriculumA2';
import { richBeginnerLesson } from './richLesson';

const typedA2Lessons = a2Lessons as Lesson[];
const typedA2Units = a2Units as Unit[];
const enrichedA1Lessons = a1Lessons.map(lesson => lesson.id === richBeginnerLesson.id ? richBeginnerLesson as unknown as Lesson : lesson);

export type { Activity, Lesson, Unit } from './curriculum';

export const units: Unit[] = [...a1Units, ...typedA2Units];
export const lessons: Lesson[] = [...enrichedA1Lessons, ...typedA2Lessons];
export const a1 = enrichedA1Lessons;
export const a2 = typedA2Lessons;

export const lessonById = (id: string): Lesson => {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
};

export const lessonsForUnit = (unitId: string) => lessons.filter(lesson => lesson.unitId === unitId);

export const levelForLesson = (lesson: Lesson) => lesson.id.startsWith('a2-') ? 'A2' : 'A1';
export const lessonsForLevel = (level: 'A1' | 'A2') => lessons.filter(lesson => levelForLesson(lesson) === level);

void baseLessonById;
void baseLessonsForUnit;
