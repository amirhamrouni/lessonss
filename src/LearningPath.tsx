import AutoLessonPlayer from './AutoLessonPlayer';
import ReferenceLearnJourney from './ReferenceLearnJourney';

// Compatibility facade for historical imports. The active application routes use
// ReferenceLearnJourney and LessonRouter directly, but keeping these named exports
// avoids breaking older modules/tests that still import LearningPath.tsx.
export function LearnJourney() {
  return <ReferenceLearnJourney />;
}

export function UnifiedLessonPlayer() {
  return <AutoLessonPlayer />;
}
