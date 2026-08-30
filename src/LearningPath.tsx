import { useEffect, useState } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Gauge, Home, Mic, UserRound, XCircle } from 'lucide-react';
import { auth } from './firebase';
import { Activity, Lesson, lessonById, lessonsForLevel, lessonsForUnit, units } from './curriculumAll';
import { loadLessonProgress, ProgressMap, saveLessonCompletion, summarizeProgress } from './learning';

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><div className="phone"><main className="page">{children}</main><Dock /></div></div>;
}

function usePathLearner() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setProgress({}); setLoading(false); return; }
    try { setProgress(await loadLessonProgress(current.uid)); } finally { setLoading(false); }
  }), []);
  return { user, progress, setProgress, loading };
}

export function LearnJourney() {
  const { user, progress, loading } = usePathLearner();
  const nav = useNavigate();
  if (loading) return <Frame><p>Loading your learning path…</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;

  const levels: Array<'A1' | 'A2'> = ['A1', 'A2'];
  return <Frame>
    <header><div><span className="eyebrow">CEFR ROADMAP</span><h1>Learn</h1><p>Structured progression from survival English to real-world independence.</p></div></header>
    {levels.map(level => {
      const levelLessons = lessonsForLevel(level);
      const scopedProgress = Object.fromEntries(levelLessons.map(lesson => [lesson.id, progress[lesson.id]]).filter(([, value]) => Boolean(value))) as ProgressMap;
      const summary = summarizeProgress(scopedProgress, levelLessons.length);
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

function renderActivity(activity: Activity, selected: string, setSelected: (value: string) => void, fill: string, setFill: (value: string) => void) {
  if (activity.type === 'explain') return <div className="explain"><span className="eyebrow">LEARN</span><h2>{activity.title}</h2><p>{activity.body}</p><div className="examples">{activity.examples.map(example => <div key={example}>{example}</div>)}</div></div>;
  if (activity.type === 'choice') return <div><span className="eyebrow">CHOOSE THE BEST ANSWER</span><h2>{activity.prompt}</h2><div className="answer-list">{activity.options.map(option => <button className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>{option}</button>)}</div></div>;
  return <div><span className="eyebrow">COMPLETE THE SENTENCE</span><h2>{activity.prompt}</h2><input className="lesson-input" value={fill} onChange={event => setFill(event.target.value)} placeholder={activity.hint || 'Type your answer'} /></div>;
}

export function UnifiedLessonPlayer() {
  const { lessonId = '' } = useParams();
  const nav = useNavigate();
  const { user, progress, setProgress, loading } = usePathLearner();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [fill, setFill] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return <Frame><p>Loading lesson…</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;
  const currentUser: User = user;
  let lesson: Lesson;
  try { lesson = lessonById(lessonId); } catch { return <Frame><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><h2>Lesson not found</h2></Frame>; }
  const activity = lesson.activities[index];
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / lesson.activities.length) * 100);

  async function finish(nextCorrect = correct, nextTotal = total) {
    setSaving(true);
    try {
      const saved = await saveLessonCompletion(currentUser.uid, lesson.id, nextCorrect, nextTotal);
      setProgress({ ...progress, [lesson.id]: saved });
      setFinished(true);
    } finally { setSaving(false); }
  }

  function advance() {
    setFeedback(null); setSelected(''); setFill('');
    if (index >= lesson.activities.length - 1) void finish(); else setIndex(index + 1);
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
    if (index >= lesson.activities.length - 1) setTimeout(() => void finish(nextCorrect, nextTotal), 250);
  }

  if (finished) {
    const score = total ? Math.round((correct / total) * 100) : 100;
    return <Frame><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><section className="lesson-complete"><CheckCircle2 /><span className="eyebrow">LESSON COMPLETE</span><h1>{lesson.title}</h1><strong>{score}%</strong><p>{correct} correct out of {total} scored activities.</p><button className="primary" onClick={() => nav('/learn')}>Continue roadmap</button></section></Frame>;
  }

  return <Frame>
    <button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Exit lesson</button>
    <div className="lesson-top"><div><span className="eyebrow">{lesson.id.startsWith('a2-') ? 'A2' : 'A1'} · {lesson.skill.toUpperCase()} · {lesson.minutes} MIN</span><h1>{lesson.title}</h1><p>{lesson.objective}</p></div><span>{index + 1}/{lesson.activities.length}</span></div>
    <div className="progress-track"><i style={{ width: `${progressPercent}%` }} /></div>
    <section className="activity-card">
      {renderActivity(activity, selected, setSelected, fill, setFill)}
      {feedback && <div className={`feedback ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.ok ? <CheckCircle2 /> : <XCircle />}<div><b>{feedback.ok ? 'Correct' : 'Not quite'}</b><p>{feedback.text}</p></div></div>}
      <button className="primary activity-action" disabled={saving || Boolean(feedback && index >= lesson.activities.length - 1)} onClick={feedback ? advance : check}>{saving ? 'Saving…' : feedback ? 'Continue' : activity.type === 'explain' ? 'Continue' : 'Check answer'}</button>
    </section>
  </Frame>;
}
