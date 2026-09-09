import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Check, ChevronRight, LockKeyhole, Star } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, ProgressBar, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { lessonsForLevel, lessonsForUnit, units } from './curriculumAll';
import { loadLessonProgress, ProgressMap, summarizeProgress } from './learning';
import { directionFor, normalizeLanguage } from './languageSupport';

type Profile = { nativeLanguage?: string; explanationLanguage?: string; interfaceLanguage?: string };
type ActiveLevel = 'A1' | 'A2';

export default function ReferenceLearnJourney() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<ActiveLevel>('A1');

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const [profileSnap, learnerProgress] = await Promise.all([
        getDoc(doc(db, 'users', current.uid)),
        loadLessonProgress(current.uid),
      ]);
      setProfile(profileSnap.exists() ? profileSnap.data() as Profile : {});
      setProgress(learnerProgress);
    } finally { setLoading(false); }
  }), []);

  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const dir = directionFor(language);
  const ar = language === 'Arabic';
  const levelLessons = useMemo(() => lessonsForLevel(level), [level]);
  const summary = useMemo(() => summarizeProgress(progress, levelLessons.length), [progress, levelLessons]);
  const levelUnits = useMemo(() => units.filter(unit => level === 'A2' ? unit.id.startsWith('a2-') : !unit.id.startsWith('a2-')), [level]);

  if (loading) return <LearningShell language={language} dir={dir}><p>{ar ? 'نحمّل مسار تعلّمك…' : 'Loading your learning path…'}</p></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace/>;

  return (
    <LearningShell language={language} dir={dir} className="et-learn-shell">
      <PageTitle title={ar ? 'تعلّم' : 'Learn'} description={ar ? 'مسار واضح من الأساسيات إلى المحادثة.' : 'A clear path from foundations to real conversation.'} />

      <div className="et-cefr-tabs" role="tablist" aria-label="CEFR level">
        <button onClick={() => nav('/start')}>A0</button>
        <button className={level === 'A1' ? 'active' : ''} onClick={() => setLevel('A1')}>A1</button>
        <button className={level === 'A2' ? 'active' : ''} onClick={() => setLevel('A2')}>A2</button>
        <button disabled>B1</button>
        <button disabled>B2</button>
      </div>

      <Surface className="et-level-summary">
        <div className="et-level-summary-head">
          <div><span>{level}</span><h2>{ar ? (level === 'A1' ? 'الأساسيات' : 'الاستقلال اليومي') : (level === 'A1' ? 'Foundations' : 'Real-world independence')}</h2></div>
          <strong>{summary.percent}%</strong>
        </div>
        <ProgressBar value={summary.percent} />
        <small>{ar ? `أكملت ${summary.completed} من ${summary.total} درسًا` : `${summary.completed} of ${summary.total} lessons completed`}</small>
      </Surface>

      <div className="et-learning-path">
        {levelUnits.map((unit, unitIndex) => {
          const unitLessons = lessonsForUnit(unit.id);
          const completeCount = unitLessons.filter(lesson => progress[lesson.id]?.completed).length;
          return (
            <section className="et-unit" key={unit.id}>
              <div className="et-unit-rail" aria-hidden="true"><span>{unitIndex + 1}</span><i /></div>
              <div className="et-unit-content">
                <div className="et-unit-title">
                  <small>{level} · {ar ? 'الوحدة' : 'UNIT'} {String(unitIndex + 1).padStart(2,'0')}</small>
                  <h2>{unit.title.replace(/^A2 · /,'')}</h2>
                  <p>{ar ? `${completeCount} من ${unitLessons.length} دروس مكتملة` : `${completeCount} of ${unitLessons.length} lessons complete`}</p>
                </div>

                <Surface className="et-lesson-list">
                  {unitLessons.map((lesson, lessonIndex) => {
                    const result = progress[lesson.id];
                    const complete = Boolean(result?.completed);
                    const previous = unitLessons[lessonIndex - 1];
                    const unlocked = lessonIndex === 0 || complete || Boolean(previous && progress[previous.id]?.completed);
                    return (
                      <button
                        key={lesson.id}
                        className={`et-lesson-row ${complete ? 'complete' : unlocked ? 'current' : 'locked'}`}
                        onClick={() => unlocked && nav(`/lesson/${lesson.id}`)}
                        disabled={!unlocked}
                      >
                        <span className="et-lesson-node">{complete ? <Check/> : unlocked ? lessonIndex + 1 : <LockKeyhole/>}</span>
                        <div><b>{lesson.title}</b><small>{lesson.skill} · {lesson.minutes} min</small></div>
                        <span className="et-lesson-status">{complete ? `${result?.score ?? 100}%` : unlocked ? (ar ? 'ابدأ' : 'Start') : ''}{unlocked && !complete ? <ChevronRight/> : null}</span>
                      </button>
                    );
                  })}
                </Surface>

                <div className="et-unit-reward"><Star/><div><b>{ar ? `تقدّم في ${level}` : `${level} progress`}</b><small>{ar ? 'كل درس يفتح الخطوة التالية.' : 'Each lesson unlocks the next step.'}</small></div><ETButton variant="ghost" onClick={() => { const firstOpen = unitLessons.find((lesson, index) => index === 0 || !progress[lesson.id]?.completed); if (firstOpen) nav(`/lesson/${firstOpen.id}`); }}><ChevronRight /></ETButton></div>
              </div>
            </section>
          );
        })}
      </div>
    </LearningShell>
  );
}
