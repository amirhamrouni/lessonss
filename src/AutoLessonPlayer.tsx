import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, CheckCircle2, Gauge, Home, Languages, Mic, UserRound, XCircle } from 'lucide-react';
import { auth, db } from './firebase';
import { Activity, Lesson, lessonById } from './curriculumAll';
import { loadLessonProgress, ProgressMap, saveLessonCompletion } from './learning';
import { directionFor, normalizeLanguage, t } from './languageSupport';

type LearnerProfile = { nativeLanguage?: string; explanationLanguage?: string };
type Feedback = { ok: boolean; text: string };

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><div className="phone"><main className="page">{children}</main><Dock /></div></div>;
}

function renderActivity(activity: Activity, selected: string, setSelected: (value: string) => void, fill: string, setFill: (value: string) => void, supportLanguage: string, locked: boolean) {
  const dir = directionFor(supportLanguage);
  if (activity.type === 'explain') return <div className="explain"><span className="eyebrow" dir={dir}>{t(supportLanguage, 'learn')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'nativeQuestion')}</div><h2>{activity.title}</h2><p>{activity.body}</p><div className="examples">{activity.examples.map(example => <div key={example}>{example}</div>)}</div></div>;
  if (activity.type === 'choice') return <div><span className="eyebrow" dir={dir}>{t(supportLanguage, 'choose')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div><h2>{activity.prompt}</h2><div className="answer-list">{activity.options.map(option => <button disabled={locked} className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>{option}</button>)}</div></div>;
  return <div><span className="eyebrow" dir={dir}>{t(supportLanguage, 'fill')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div><h2>{activity.prompt}</h2><input disabled={locked} className="lesson-input" value={fill} onChange={event => setFill(event.target.value)} placeholder={activity.hint || t(supportLanguage, 'hint')} /></div>;
}

export default function AutoLessonPlayer() {
  const { lessonId = '' } = useParams();
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearnerProfile>({});
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [fill, setFill] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let lesson: Lesson | null = null;
  try { lesson = lessonById(lessonId); } catch { lesson = null; }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async current => {
      setUser(current);
      if (!current) { setLoading(false); return; }
      try {
        const [profileSnap, learnerProgress] = await Promise.all([getDoc(doc(db, 'users', current.uid)), loadLessonProgress(current.uid)]);
        setProfile(profileSnap.exists() ? profileSnap.data() as LearnerProfile : {});
        setProgress(learnerProgress);
      } finally { setLoading(false); }
    });
    return () => { unsubscribe(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (loading) return <Frame><p>Loading lesson…</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!lesson) return <Frame><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><h2>Lesson not found</h2></Frame>;

  const uid = user.uid;
  const currentLesson = lesson;
  const supportLanguage = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage);
  const activity = currentLesson.activities[index];
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / currentLesson.activities.length) * 100);

  async function rememberObjectiveMistake(given: string, expected: string, explanation: string) {
    const id = `${currentLesson.id}-activity-${index}`;
    await setDoc(doc(db, 'users', uid, 'mistakes', id), {
      lessonId: currentLesson.id,
      activityIndex: index,
      skill: currentLesson.skill,
      original: given,
      corrected: expected,
      reason: explanation,
      latestExample: activity.type === 'choice' || activity.type === 'fill' ? activity.prompt : currentLesson.title,
      timesSeen: increment(1),
      lastSeenAt: serverTimestamp(),
      source: 'lesson',
      status: 'active',
    }, { merge: true });
  }

  async function finish(nextCorrect = correct, nextTotal = total) {
    if (saving || finished) return;
    setSaving(true);
    try {
      const saved = await saveLessonCompletion(uid, currentLesson.id, nextCorrect, nextTotal);
      setProgress(current => ({ ...current, [currentLesson.id]: saved }));
      setFinished(true);
    } finally { setSaving(false); setTransitioning(false); }
  }

  function goNext() {
    setFeedback(null); setSelected(''); setFill(''); setTransitioning(false);
    setIndex(current => Math.min(current + 1, currentLesson.activities.length - 1));
  }

  function continueExplanation() {
    if (index >= currentLesson.activities.length - 1) { void finish(correct, total); return; }
    goNext();
  }

  function check() {
    if (transitioning || saving || feedback) return;
    if (activity.type === 'explain') { continueExplanation(); return; }
    const answer = activity.type === 'choice' ? selected : fill.trim();
    if (!answer) return;

    const ok = answer.toLocaleLowerCase() === activity.answer.toLocaleLowerCase();
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextTotal = total + 1;
    const isLast = index >= currentLesson.activities.length - 1;
    if (!ok) void rememberObjectiveMistake(answer, activity.answer, activity.explanation);

    setCorrect(nextCorrect); setTotal(nextTotal); setFeedback({ ok, text: activity.explanation }); setTransitioning(true);
    timerRef.current = setTimeout(() => { if (isLast) void finish(nextCorrect, nextTotal); else goNext(); }, 950);
  }

  if (finished) {
    const score = total ? Math.round((correct / total) * 100) : 100;
    return <Frame><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><section className="lesson-complete"><CheckCircle2 /><span className="eyebrow">LESSON COMPLETE</span><h1>{currentLesson.title}</h1><strong>{score}%</strong><p>{correct} correct out of {total} scored activities.</p><button className="primary" onClick={() => nav('/learn')}>Continue roadmap</button></section></Frame>;
  }

  return <Frame>
    <button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Exit lesson</button>
    <div className="lesson-top"><div><span className="eyebrow">{currentLesson.id.startsWith('a2-') ? 'A2' : 'A1'} · {currentLesson.skill.toUpperCase()} · {currentLesson.minutes} MIN</span><h1>{currentLesson.title}</h1><p>{currentLesson.objective}</p></div><span>{index + 1}/{currentLesson.activities.length}</span></div>
    <div className="lesson-language-chip" dir={directionFor(supportLanguage)}><Languages /> {supportLanguage} support · English target</div>
    <div className="progress-track"><i style={{ width: `${progressPercent}%` }} /></div>
    <section className="activity-card">
      {renderActivity(activity, selected, setSelected, fill, setFill, supportLanguage, transitioning || saving)}
      {feedback && <div className={`feedback ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.ok ? <CheckCircle2 /> : <XCircle />}<div dir={directionFor(supportLanguage)}><b>{feedback.ok ? t(supportLanguage, 'correct') : t(supportLanguage, 'retry')}</b><small className="feedback-label">{t(supportLanguage, 'explanation')}</small><p>{feedback.text}</p></div></div>}
      <button className="primary activity-action" disabled={saving || transitioning || (activity.type !== 'explain' && !(selected || fill.trim()))} onClick={check}>{saving ? 'Saving…' : transitioning ? (index >= currentLesson.activities.length - 1 ? 'Finishing…' : 'Next question…') : activity.type === 'explain' ? t(supportLanguage, 'continue') : t(supportLanguage, 'check')}</button>
    </section>
  </Frame>;
}
