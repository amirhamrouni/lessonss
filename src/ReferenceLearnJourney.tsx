import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Check, ChevronRight, LockKeyhole, Star } from 'lucide-react';
import AppDock from './AppDock';
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

  if (loading) return <div className="app-shell" dir={dir}><div className="phone"><main className="page reference-learn"><p>{ar ? 'نحمّل مسار تعلّمك…' : 'Loading your learning path…'}</p></main><AppDock language={language}/></div></div>;
  if (!user) return <Navigate to="/welcome" replace/>;

  return <div className="app-shell" dir={dir}><div className="phone"><main className="page reference-learn">
    <header className="reference-page-title"><div><h1>{ar ? 'تعلّم' : 'Learn'}</h1><p>{ar ? 'رحلتك في تعلّم الإنجليزية' : 'Your structured English journey'}</p></div></header>

    <div className="cefr-tabs" role="tablist" aria-label="CEFR level">
      <button onClick={() => nav('/start')}>A0</button>
      <button className={level === 'A1' ? 'active' : ''} onClick={() => setLevel('A1')}>A1</button>
      <button className={level === 'A2' ? 'active' : ''} onClick={() => setLevel('A2')}>A2</button>
      <button disabled>B1</button><button disabled>B2</button>
    </div>

    <section className="learn-summary-card">
      <div className="learn-summary-head"><div><span>{level}</span><h2>{ar ? (level === 'A1' ? 'الأساسيات' : 'الاستقلال اليومي') : (level === 'A1' ? 'Foundations' : 'Real-world independence')}</h2></div><strong>{summary.percent}%</strong></div>
      <div className="reference-progress"><i style={{width:`${summary.percent}%`}}/></div>
      <small>{ar ? `أكملت ${summary.completed} من ${summary.total} درسًا` : `${summary.completed} of ${summary.total} lessons completed`}</small>
    </section>

    <div className="reference-learning-path">
      {levelUnits.map((unit, unitIndex) => {
        const unitLessons = lessonsForUnit(unit.id);
        return <section className="reference-unit" key={unit.id}>
          <div className="unit-number">{unitIndex + 1}</div>
          <div className="unit-body">
            <div className="unit-title"><small>{level} · {ar ? 'الوحدة' : 'UNIT'} {String(unitIndex + 1).padStart(2,'0')}</small><h2>{unit.title.replace(/^A2 · /,'')}</h2></div>
            <div className="reference-lesson-list">
              {unitLessons.map((lesson, lessonIndex) => {
                const result = progress[lesson.id];
                const complete = Boolean(result?.completed);
                const previous = unitLessons[lessonIndex - 1];
                const unlocked = lessonIndex === 0 || complete || Boolean(previous && progress[previous.id]?.completed);
                return <button key={lesson.id} className={complete ? 'complete' : unlocked ? 'current' : 'locked'} onClick={() => unlocked && nav(`/lesson/${lesson.id}`)} disabled={!unlocked}>
                  <span className="lesson-node">{complete ? <Check/> : unlocked ? lessonIndex + 1 : <LockKeyhole/>}</span>
                  <div><b>{lesson.title}</b><small>{lesson.skill} · {lesson.minutes} min</small></div>
                  <span className="lesson-status">{complete ? `${result?.score ?? 100}%` : unlocked ? (ar ? 'ابدأ' : 'Start') : ''}{unlocked && !complete ? <ChevronRight/> : null}</span>
                </button>;
              })}
            </div>
            <div className="unit-reward"><Star/><div><b>{ar ? `أكمل ${level}` : `Complete ${level}`}</b><small>{ar ? 'واصل بناء مهاراتك خطوة بخطوة' : 'Keep building your skills step by step'}</small></div></div>
          </div>
        </section>;
      })}
    </div>
  </main><AppDock language={language}/></div></div>;
}
