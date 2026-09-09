import { Navigate, useParams } from 'react-router-dom';
import AutoLessonPlayer from './AutoLessonPlayer';
import AdvancedLessonPlayer from './AdvancedLessonPlayer';
import { lessonById } from './curriculumAll';
import { isLessonV2 } from './curriculumV2';
import { isLearningLevelEnabled } from './featureFlags';

export default function LessonRouter() {
  const { lessonId = '' } = useParams();
  let lesson;
  try { lesson = lessonById(lessonId); } catch { return <Navigate to="/learn" replace />; }
  if (isLessonV2(lesson)) {
    if (lesson.level === 'A0' || !isLearningLevelEnabled(lesson.level)) return <Navigate to="/learn" replace />;
    return <AdvancedLessonPlayer lesson={lesson} />;
  }
  return <AutoLessonPlayer />;
}
