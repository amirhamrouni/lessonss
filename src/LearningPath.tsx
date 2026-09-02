import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, ChevronRight, Languages, XCircle } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { Activity, Lesson, lessonById, lessonsForLevel, lessonsForUnit, units } from './curriculumAll';
import { loadLessonProgress, ProgressMap, saveLessonCompletion, summarizeProgress } from './learning';
import { directionFor, immersionSupportPercent, normalizeLanguage, t } from './languageSupport';

type LearnerProfile = {
  nativeLanguage?: string;
  explanationLanguage?: string;
  interfaceLanguage?: string;
  cefrLevel?: string;
  learningGoal?: string;
};

function Frame({ children, language }: { children: React.ReactNode; language?: string }) {
  return <div className="app-shell"><div className="phone"><main className="page">{children}</main><AppDock language={language} /></div></div>;
}

function usePathLearner() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearnerProfile>({});
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setProfile({}); setProgress({}); setLoading(false); return; }
    try {
      const [learnerProgress, profileSnap] = await Promise.all([
        loadLessonProgress(current.uid),
        getDoc(doc(db, 'users', current.uid)),
      ]);
      setProgress(learnerProgress);
      setProfile(profileSnap.exists() ? profileSnap.data() as LearnerProfile : {});
    } finally { setLoading(false); }
  }), []);
  return { user, profile, progress, setProgress, loading };
}

function supportLanguageFor(profile: LearnerProfile) {
  return normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
}

export function LearnJourney() {
  const { user, profile, progress, loading } = usePathLearner();
  const nav = useNavigate();
  const supportLanguage = supportLanguageFor(profile);
  if (loading) return <Frame language={supportLanguage}><p>Loading your learning path…</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;

  const levels: Array<'A1' | 'A2'> = ['A1', 'A2'];
  return <Frame language={supportLanguage}>
    <header><div><span className="eyebrow">CEFR ROADMAP</span><h1>Learn</h1><p>Structured English, supported in {supportLanguage} when you need it.</p></div></header>
    <div className="language-support-banner" dir={directionFor(supportLanguage)}><Languages /><div><b>{t(supportLanguage, 'support')}: {supportLanguage}</b><small>{immersionSupportPercent(profile.cefrLevel)}% native-language support at your current level · answers stay in English</small></div></div>
    {levels.map(level => {
      const levelLessons = lessonsForLevel(level);
      const summary = summarizeProgress(progress, levelLessons.length);
      const levelUnits = units.filter(unit => level === 'A2' ? unit.id.startsWith('a2-') : !unit.id.startsWith('a2-'));
      return <section key={level} className="level-section">
        <div className="learn-overview">
          <div><span>{level} · {level === 'A1' ? 'Foundations' : 'Real-world independence'}</span><strong>{summary.percent}%</strong></div>
          <div className="thin-progress"><i style={{ width: `${summary.percent}%` }} /></div>
          <small>{summary.completed} of {summary.total} lessons completed</small>
        </div>
        <div className="journey">
          {levelUnits.map((unit, unitIndex) => <section className="journey-unit" key={unit.id}>
            <div className="journey-marker"><span>{unitIndex + 1}</span></div>
            <div className="journey-content">
              <div className="unit-label"><small>{level} · UNIT {String(unitIndex + 1).padStart(2, '0')}</small><h3>{unit.title.replace(/^A2 · /, '')}</h3></div>
              <div className="lesson-rows">
                {lessonsForUnit(unit.id).map(lesson => {
                  const result = progress[lesson.id];
                  return <button key={lesson.id} onClick={() => nav(`/lesson/${lesson.id}`)}>
                    <div><b>{lesson.title}</b><small>{lesson.skill} · {lesson.minutes} min</small></div>
                    <span className={result?.completed ? 'done' : ''}>{result?.completed ? `${result.score}%` : 'Start'} <ChevronRight /></span>
                  </button>;
                })}
              </div>
            </div>
          </section>)}
        </div>
      </section>;
    })}
  </Frame>;
}

function renderActivity(activity: Activity, selected: string, setSelected: (value: string) => void, fill: string, setFill: (value: string) => void, supportLanguage: string) {
  const dir = directionFor(supportLanguage);
  if (activity.type === 'explain') return <div className="explain"><span className="eyebrow" dir={dir}>{t(supportLanguage, 'learn')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'nativeQuestion')}</div><h2>{activity.title}</h2><p>{activity.body}</p><div className="examples">{activity.examples.map(example => <div key={example}>{example}</div>)}</div></div>;
  if (activity.type === 'choice') return <div><span className="eyebrow" dir={dir}>{t(supportLanguage, 'choose')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div><h2>{activity.prompt}</h2><div className="answer-list">{activity.options.map(option => <button className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>{option}</button>)}</div></div>;
  return <div><span className="eyebrow" dir={dir}>{t(supportLanguage, 'fill')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div><h2>{activity.prompt}</h2><input className="lesson-input" value={fill} onChange={event => setFill(event.target.value)} placeholder={activity.hint || t(supportLanguage, 'hint')} /></div>;
}

export function UnifiedLessonPlayer() {
  const { lessonId = '' } = useParams();
  const nav = useNavigate();
  const { user, profile, progress, setProgress, loading } = usePathLearner();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [fill, setFill] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  let lesson: Lesson | null = null;
  try { lesson = lessonById(lessonId); } catch { lesson = null; }

  const supportLanguage = supportLanguageFor(profile);
  if (loading) return <Frame language={supportLanguage}><p>Loading lesson…</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!lesson) return <Frame language={supportLanguage}><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><h2>Lesson not found</h2></Frame>;

  const uid = user.uid;
  const currentLesson = lesson;
  const activity = currentLesson.activities[index];
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / currentLesson.activities.length) * 100);

  async function finish(nextCorrect = correct, nextTotal = total) {
    setSaving(true);
    try {
      const saved = await saveLessonCompletion(uid, currentLesson.id, nextCorrect, nextTotal);
      setProgress({ ...progress, [currentLesson.id]: saved });
      setFinished(true);
    } finally { setSaving(false); }
  }

  function advance() {
    setFeedback(null); setSelected(''); setFill('');
    if (index >= currentLesson.activities.length - 1) void finish(); else setIndex(index + 1);
  }

  function check() {
    if (activity.type === 'explain') return advance();
    const answer = activity.type === 'choice' ? selected : fill.trim();
    if (!answer) return;
    const ok = answer.toLocaleLowerCase() === activity.answer.toLocaleLowerCase();
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextTotal = total + 1;
    setCorrect(nextCorrect); setTotal(nextTotal);
    setFeedback({ ok, text: activity.explanation });
    if (index >= currentLesson.activities.length - 1) setTimeout(() => void finish(nextCorrect, nextTotal), 250);
  }

  if (finished) {
    const score = total ? Math.round((correct / total) * 100) : 100;
    return <Frame language={supportLanguage}><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><section className="lesson-complete"><CheckCircle2 /><span className="eyebrow">LESSON COMPLETE</span><h1>{currentLesson.title}</h1><strong>{score}%</strong><p>{correct} correct out of {total} scored activities.</p><button className="primary" onClick={() => nav('/learn')}>Continue roadmap</button></section></Frame>;
  }

  return <Frame language={supportLanguage}>
    <button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Exit lesson</button>
    <div className="lesson-top"><div><span className="eyebrow">{currentLesson.id.startsWith('a2-') ? 'A2' : 'A1'} · {currentLesson.skill.toUpperCase()} · {currentLesson.minutes} MIN</span><h1>{currentLesson.title}</h1><p>{currentLesson.objective}</p></div><span>{index + 1}/{currentLesson.activities.length}</span></div>
    <div className="lesson-language-chip" dir={directionFor(supportLanguage)}><Languages /> {supportLanguage} support · English target</div>
    <div className="progress-track"><i style={{ width: `${progressPercent}%` }} /></div>
    <section className="activity-card">
      {renderActivity(activity, selected, setSelected, fill, setFill, supportLanguage)}
      {feedback && <div className={`feedback ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.ok ? <CheckCircle2 /> : <XCircle />}<div dir={directionFor(supportLanguage)}><b>{feedback.ok ? t(supportLanguage, 'correct') : t(supportLanguage, 'retry')}</b><small className="feedback-label">{t(supportLanguage, 'explanation')}</small><p>{feedback.text}</p></div></div>}
      <button className="primary activity-action" disabled={saving || Boolean(feedback && index >= currentLesson.activities.length - 1)} onClick={feedback ? advance : check}>{saving ? 'Saving…' : feedback ? t(supportLanguage, 'continue') : activity.type === 'explain' ? t(supportLanguage, 'continue') : t(supportLanguage, 'check')}</button>
    </section>
  </Frame>;
}
