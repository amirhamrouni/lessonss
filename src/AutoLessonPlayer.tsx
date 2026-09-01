import { useState, useEffect } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, CheckCircle2, Gauge, Home, Languages, Mic, RotateCcw, UserRound, Volume2, XCircle } from 'lucide-react';
import { auth, db } from './firebase';
import { Activity, Lesson, lessonById } from './curriculumAll';
import type { RichActivity } from './richLesson';
import { loadLessonProgress, ProgressMap, saveLessonCompletion } from './learning';
import { directionFor, normalizeLanguage, t } from './languageSupport';
import { prioritizeReviewFromMistake } from './review';

type LearnerProfile = { nativeLanguage?: string; explanationLanguage?: string };
type Feedback = { ok: boolean; text: string };
type AnyActivity = Activity | RichActivity;

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function Frame({ children, dir = 'ltr' }: { children: React.ReactNode; dir?: 'ltr' | 'rtl' }) {
  return <div className="app-shell" dir={dir}><div className="phone"><main className="page">{children}</main><Dock /></div></div>;
}

function speakEnglish(text: string, rate = 0.82) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

function Visual({ visualId, label }: { visualId: 'hello' | 'water' | 'apple' | 'home'; label: string }) {
  return <svg className="lesson-visual" viewBox="0 0 320 220" role="img" aria-label={label}><use href={`/lesson-visuals/basic.svg#${visualId}`} /></svg>;
}

function renderActivity(
  activity: AnyActivity,
  selected: string,
  setSelected: (value: string) => void,
  fill: string,
  setFill: (value: string) => void,
  supportLanguage: string,
  locked: boolean,
) {
  const dir = directionFor(supportLanguage);

  if (activity.type === 'visual_word') {
    const meaning = activity.meanings[supportLanguage] || activity.meanings.English || activity.word;
    return <div className="rich-word-card">
      <span className="eyebrow" dir={dir}>{supportLanguage === 'Arabic' ? 'شاهد · اسمع · افهم' : 'SEE · HEAR · UNDERSTAND'}</span>
      <Visual visualId={activity.visualId} label={activity.word} />
      <div className="rich-word-copy">
        <h2>{activity.word}</h2>
        <span className="phonetic">{activity.phonetic}</span>
        <strong dir={dir}>{meaning}</strong>
        <button className="listen-button" type="button" onClick={() => speakEnglish(activity.word)}><Volume2 /> {supportLanguage === 'Arabic' ? 'اسمع ببطء' : 'Hear it'}</button>
        <p>{activity.example}</p>
      </div>
    </div>;
  }

  if (activity.type === 'listen_select') return <div>
    <span className="eyebrow" dir={dir}>{supportLanguage === 'Arabic' ? 'استماع' : 'LISTEN'}</span>
    <h2>{activity.prompt}</h2>
    <button className="audio-hero" type="button" onClick={() => speakEnglish(activity.audioText, 0.72)}><Volume2 /> {supportLanguage === 'Arabic' ? 'تشغيل الصوت' : 'Play audio'}</button>
    <div className="answer-list">{activity.options.map(option => <button disabled={locked} className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>{option}</button>)}</div>
  </div>;

  if (activity.type === 'image_choice') return <div>
    <span className="eyebrow" dir={dir}>{supportLanguage === 'Arabic' ? 'صورة + كلمة' : 'PICTURE MATCH'}</span>
    <h2>{activity.prompt}</h2>
    <div className="image-choice-grid">{activity.options.map(option => <button disabled={locked} className={selected === option.label ? 'selected image-option' : 'image-option'} key={option.label} onClick={() => setSelected(option.label)}><Visual visualId={option.visualId} label={option.label} /><b>{option.label}</b></button>)}</div>
  </div>;

  if (activity.type === 'sentence_build') return <div>
    <span className="eyebrow" dir={dir}>{supportLanguage === 'Arabic' ? 'رتّب الجملة' : 'BUILD THE SENTENCE'}</span>
    <h2>{activity.prompt}</h2>
    <div className="sentence-answer">{selected || '…'}</div>
    <div className="word-bank">{activity.words.map((word, index) => <button disabled={locked} type="button" key={`${word}-${index}`} onClick={() => setSelected(selected ? `${selected} ${word}` : word)}>{word}</button>)}</div>
    {selected && !locked && <button className="text-action" type="button" onClick={() => setSelected('')}><RotateCcw /> {supportLanguage === 'Arabic' ? 'ابدأ من جديد' : 'Reset'}</button>}
  </div>;

  if (activity.type === 'explain') return <div className="explain"><span className="eyebrow" dir={dir}>{t(supportLanguage, 'learn')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'nativeQuestion')}</div><h2>{activity.title}</h2><p>{activity.body}</p><div className="examples">{activity.examples.map(example => <div key={example}>{example}</div>)}</div></div>;
  if (activity.type === 'choice') return <div><span className="eyebrow" dir={dir}>{t(supportLanguage, 'choose')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div><h2>{activity.prompt}</h2><div className="answer-list">{activity.options.map(option => <button disabled={locked} className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>{option}</button>)}</div></div>;
  return <div><span className="eyebrow" dir={dir}>{t(supportLanguage, 'fill')}</span><div className="native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div><h2>{activity.prompt}</h2><input disabled={locked} className="lesson-input" value={fill} onChange={event => setFill(event.target.value)} placeholder={activity.hint || t(supportLanguage, 'hint')} /></div>;
}

function isPassive(activity: AnyActivity) {
  return activity.type === 'explain' || activity.type === 'visual_word';
}

function activityAnswer(activity: AnyActivity, selected: string, fill: string) {
  if (activity.type === 'fill') return fill.trim();
  if (activity.type === 'choice' || activity.type === 'listen_select' || activity.type === 'image_choice' || activity.type === 'sentence_build') return selected.trim();
  return '';
}

function expectedAnswer(activity: AnyActivity) {
  if ('answer' in activity && typeof activity.answer === 'string') return activity.answer;
  return '';
}

function explanationFor(activity: AnyActivity) {
  if ('explanation' in activity && typeof activity.explanation === 'string') return activity.explanation;
  return '';
}

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
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
    return unsubscribe;
  }, []);

  if (loading) return <Frame><p>Loading lesson…</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!profile.nativeLanguage) return <Navigate to="/setup" replace />;
  if (!lesson) return <Frame><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> Learn</button><h2>Lesson not found</h2></Frame>;

  const uid = user.uid;
  const currentLesson = lesson;
  const supportLanguage = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage);
  const dir = directionFor(supportLanguage);
  const ar = supportLanguage === 'Arabic';
  const activity = currentLesson.activities[index] as AnyActivity;
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / currentLesson.activities.length) * 100);

  async function rememberObjectiveMistake(given: string, expected: string, explanation: string) {
    const id = `${currentLesson.id}-activity-${index}`;
    const prompt = 'prompt' in activity && typeof activity.prompt === 'string' ? activity.prompt : currentLesson.title;
    const reviewContext = `${expected} ${given} ${prompt} ${explanation}`;
    await Promise.all([
      setDoc(doc(db, 'users', uid, 'mistakes', id), {
        lessonId: currentLesson.id,
        activityIndex: index,
        skill: currentLesson.skill,
        original: given,
        corrected: expected,
        reason: explanation,
        latestExample: prompt,
        timesSeen: increment(1),
        lastSeenAt: serverTimestamp(),
        source: 'lesson',
        status: 'active',
      }, { merge: true }),
      prioritizeReviewFromMistake(uid, currentLesson.id, reviewContext).catch(() => []),
    ]);
  }

  async function finish(nextCorrect = correct, nextTotal = total) {
    if (saving || finished) return;
    setSaving(true);
    try {
      const saved = await saveLessonCompletion(uid, currentLesson.id, nextCorrect, nextTotal);
      setProgress(current => ({ ...current, [currentLesson.id]: saved }));
      setFinished(true);
    } finally { setSaving(false); }
  }

  function goNext() {
    setFeedback(null);
    setSelected('');
    setFill('');
    setIndex(current => Math.min(current + 1, currentLesson.activities.length - 1));
  }

  function continuePassive() {
    if (index >= currentLesson.activities.length - 1) { void finish(correct, total); return; }
    goNext();
  }

  function check() {
    if (saving) return;

    if (isPassive(activity)) {
      continuePassive();
      return;
    }

    if (feedback) {
      if (!feedback.ok) {
        setFeedback(null);
        setSelected('');
        setFill('');
        return;
      }
      if (index >= currentLesson.activities.length - 1) { void finish(correct, total); return; }
      goNext();
      return;
    }

    const answer = activityAnswer(activity, selected, fill);
    if (!answer) return;
    const expected = expectedAnswer(activity);
    const explanation = explanationFor(activity);
    const ok = normalizeAnswer(answer) === normalizeAnswer(expected);
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextTotal = total + 1;

    if (!ok) void rememberObjectiveMistake(answer, expected, explanation);
    setCorrect(nextCorrect);
    setTotal(nextTotal);
    setFeedback({ ok, text: explanation });
  }

  if (finished) {
    const score = total ? Math.round((correct / total) * 100) : 100;
    return <Frame dir={dir}><button className="back" onClick={() => nav('/learn')}><ArrowLeft /> {ar ? 'التعلّم' : 'Learn'}</button><section className="lesson-complete"><CheckCircle2 /><span className="eyebrow">{ar ? 'اكتمل الدرس' : 'LESSON COMPLETE'}</span><h1>{currentLesson.title}</h1><strong>{score}%</strong><p>{ar ? `${correct} إجابات صحيحة من أصل ${total}.` : `${correct} correct out of ${total} scored activities.`}</p><button className="primary" onClick={() => nav('/learn')}>{ar ? 'متابعة المسار' : 'Continue roadmap'}</button></section></Frame>;
  }

  const hasAnswer = isPassive(activity) || Boolean(selected || fill.trim());
  const actionLabel = saving
    ? (ar ? 'جارٍ الحفظ…' : 'Saving…')
    : feedback
      ? feedback.ok ? (ar ? 'متابعة' : 'Continue') : (ar ? 'حاول مرة أخرى' : 'Try again')
      : isPassive(activity) ? t(supportLanguage, 'continue') : t(supportLanguage, 'check');

  return <Frame dir={dir}>
    <button className="back" onClick={() => nav('/learn')}><ArrowLeft /> {ar ? 'الخروج من الدرس' : 'Exit lesson'}</button>
    <div className="lesson-top"><div><span className="eyebrow">{currentLesson.id.startsWith('a2-') ? 'A2' : 'A1'} · {currentLesson.skill.toUpperCase()} · {currentLesson.minutes} {ar ? 'د' : 'MIN'}</span><h1>{currentLesson.title}</h1><p>{currentLesson.objective}</p></div><span>{index + 1}/{currentLesson.activities.length}</span></div>
    <div className="lesson-language-chip" dir={dir}><Languages /> {ar ? 'الشرح بالعربية · الإنجليزية هي الهدف' : `${supportLanguage} support · English target`}</div>
    <div className="progress-track"><i style={{ width: `${progressPercent}%` }} /></div>
    <section className="activity-card rich-activity-card">
      {renderActivity(activity, selected, setSelected, fill, setFill, supportLanguage, saving || Boolean(feedback))}
      {feedback && <div className={`feedback ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.ok ? <CheckCircle2 /> : <XCircle />}<div dir={dir}><b>{feedback.ok ? t(supportLanguage, 'correct') : t(supportLanguage, 'retry')}</b><small className="feedback-label">{t(supportLanguage, 'explanation')}</small><p>{feedback.text}</p></div></div>}
      <button className="primary activity-action" disabled={saving || (!feedback && !hasAnswer)} onClick={check}>{actionLabel}</button>
    </section>
  </Frame>;
}