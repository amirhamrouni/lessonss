import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, BrainCircuit, Check, ChevronRight, Gauge, Home, Mic, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { auth, db } from './firebase';
import { loadLessonProgress, ProgressMap } from './learning';
import { placementQuestions, scorePlacement } from './assessment';
import { Rating, StoredReviewCard, dueCards, ensureReviewCards, saveReviewRating } from './review';

function useLearner() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, async current => {
    setLoading(true);
    setUser(current);
    if (!current) { setProgress({}); setProfile(null); setLoading(false); return; }
    const [p, snap] = await Promise.all([loadLessonProgress(current.uid), getDoc(doc(db, 'users', current.uid))]);
    setProgress(p);
    setProfile(snap.exists() ? snap.data() : {});
    setLoading(false);
  }), []);
  return { user, progress, profile, loading };
}

function Dock() {
  return <nav className="dock mode-dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><div className="phone mode-phone"><main className="page mode-page">{children}</main><Dock /></div></div>;
}

function Loading() { return <Frame><div className="mode-loading"><BrainCircuit /><p>Loading your learning engine…</p></div></Frame>; }

export function PracticeHub() {
  const { user, progress, profile, loading } = useLearner();
  const nav = useNavigate();
  const [dueCount, setDueCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    const completed = Object.values(progress).filter(p => p.completed).map(p => p.lessonId);
    ensureReviewCards(user.uid, completed).then(cards => setDueCount(dueCards(cards).length)).catch(() => setDueCount(0));
  }, [user, progress]);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  const completed = Object.values(progress).filter(p => p.completed).length;
  return <Frame>
    <header><div><span className="eyebrow">TRAIN, TEST, RETAIN</span><h1>Practice</h1><p>Different engines for different learning jobs.</p></div></header>
    <section className="practice-command">
      <div><span className="mode-kicker">RECOMMENDED</span><h2>{dueCount ? `${dueCount} reviews are due now.` : completed ? 'Build recall before it fades.' : 'Complete a lesson, then train recall.'}</h2><p>FSRS schedules vocabulary from lessons you actually completed.</p></div>
      <button disabled={!dueCount} onClick={() => nav('/review')}>{dueCount ? 'Review now' : 'Nothing due'} <ChevronRight /></button>
    </section>
    <div className="mode-list">
      <button onClick={() => nav('/review')}><RotateCcw /><div><span>MEMORY</span><h3>Smart Review</h3><p>FSRS vocabulary review with Again / Hard / Good / Easy scheduling.</p></div><ChevronRight /></button>
      <button onClick={() => nav('/sentence-builder')}><Sparkles /><div><span>OUTPUT</span><h3>Sentence Builder</h3><p>Build correct English from shuffled words instead of only tapping answers.</p></div><ChevronRight /></button>
      <button onClick={() => nav('/assessment')}><Gauge /><div><span>DIAGNOSTIC</span><h3>Placement Test</h3><p>{profile?.placementLevel ? `Current placement: ${profile.placementLevel}. Retake any time.` : 'Deterministic CEFR diagnostic across grammar, vocabulary and reading.'}</p></div><ChevronRight /></button>
      <button onClick={() => nav('/speak')}><Mic /><div><span>VOICE</span><h3>Conversation Lab</h3><p>Move from structured practice into spontaneous speech with your Twin.</p></div><ChevronRight /></button>
    </div>
  </Frame>;
}

export function ReviewMode() {
  const { user, progress, loading } = useLearner();
  const nav = useNavigate();
  const [cards, setCards] = useState<StoredReviewCard[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!user) return;
    const completed = Object.values(progress).filter(p => p.completed).map(p => p.lessonId);
    ensureReviewCards(user.uid, completed).then(value => { setCards(value); setReady(true); }).catch(() => setReady(true));
  }, [user, progress]);
  if (loading || !ready) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  const queue = dueCards(cards);
  const card = queue[0];
  async function rate(rating: Rating) {
    if (!card || !user) return;
    setBusy(true);
    try {
      const next = await saveReviewRating(user.uid, card, rating);
      setCards(current => current.map(item => item.id === card.id ? next : item));
      setShowAnswer(false);
    } finally { setBusy(false); }
  }
  return <Frame>
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button>
    <header><div><span className="eyebrow">FSRS MEMORY</span><h1>Review</h1><p>{queue.length} cards due now.</p></div></header>
    {!card ? <section className="mode-empty"><Check /><h2>You’re caught up.</h2><p>FSRS will bring items back when memory strength predicts they should be reviewed.</p><button onClick={() => nav('/practice')}>Back to practice</button></section> :
      <section className="review-card">
        <span className="mode-kicker">VOCABULARY · {queue.length} LEFT</span>
        <h2>{card.term}</h2>
        {!showAnswer ? <><p>Recall the meaning before revealing it.</p><button className="reveal" onClick={() => setShowAnswer(true)}>Reveal answer</button></> : <>
          <div className="review-answer"><strong>{card.meaning}</strong><p>{card.example}</p></div>
          <div className="rating-row">
            <button disabled={busy} onClick={() => rate(Rating.Again)}><span>Again</span><small>Forgot</small></button>
            <button disabled={busy} onClick={() => rate(Rating.Hard)}><span>Hard</span><small>Struggled</small></button>
            <button disabled={busy} onClick={() => rate(Rating.Good)}><span>Good</span><small>Recalled</small></button>
            <button disabled={busy} onClick={() => rate(Rating.Easy)}><span>Easy</span><small>Instant</small></button>
          </div>
        </>}
      </section>}
  </Frame>;
}

type Builder = { prompt: string; words: string[]; answer: string[] };
const builders: Builder[] = [
  { prompt: 'Introduce yourself', words: ['Amir', 'I’m', 'Hello'], answer: ['Hello', 'I’m', 'Amir'] },
  { prompt: 'Talk about a routine', words: ['every', 'work', 'I', 'day'], answer: ['I', 'work', 'every', 'day'] },
  { prompt: 'Order politely', words: ['please', 'coffee', 'a', 'like', 'I’d'], answer: ['I’d', 'like', 'a', 'coffee', 'please'] },
  { prompt: 'Ask for a place', words: ['station', 'the', 'is', 'Where'], answer: ['Where', 'is', 'the', 'station'] },
];

export function SentenceBuilderMode() {
  const { user, loading } = useLearner();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  const item = builders[index];
  const remaining = item.words.filter((word, i) => {
    const usedBefore = built.filter(x => x === word).length;
    const occurrence = item.words.slice(0, i + 1).filter(x => x === word).length;
    return occurrence > usedBefore;
  });
  function check() { setResult(JSON.stringify(built) === JSON.stringify(item.answer) ? 'ok' : 'bad'); }
  function next() { setIndex((index + 1) % builders.length); setBuilt([]); setResult(null); }
  return <Frame>
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button>
    <header><div><span className="eyebrow">ACTIVE OUTPUT</span><h1>Sentence Builder</h1><p>Construct the sentence. Don’t just recognize it.</p></div></header>
    <section className="builder-card">
      <span className="mode-kicker">{index + 1} / {builders.length}</span><h2>{item.prompt}</h2>
      <div className="built-zone">{built.length ? built.map((word, i) => <button key={`${word}-${i}`} onClick={() => { setBuilt(built.filter((_, j) => j !== i)); setResult(null); }}>{word}</button>) : <span>Tap words below to build the sentence</span>}</div>
      <div className="word-bank">{remaining.map((word, i) => <button key={`${word}-${i}`} onClick={() => { setBuilt([...built, word]); setResult(null); }}>{word}</button>)}</div>
      {result && <div className={`builder-feedback ${result}`}>{result === 'ok' ? 'Correct — natural word order.' : `Try again. Target: ${item.answer.join(' ')}.`}</div>}
      <div className="builder-actions"><button onClick={() => { setBuilt([]); setResult(null); }}>Reset</button>{result === 'ok' ? <button className="solid" onClick={next}>Next</button> : <button className="solid" disabled={!built.length} onClick={check}>Check</button>}</div>
    </section>
  </Frame>;
}

export function AssessmentMode() {
  const { user, loading } = useLearner();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const result = useMemo(() => scorePlacement(answers), [answers]);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  const question = placementQuestions[index];
  async function finish() {
    setSaving(true);
    try {
      const final = scorePlacement(answers);
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), { placementLevel: final.level, placementCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, 'users', user.uid, 'assessments', 'latest'), { ...final, answers, completedAt: serverTimestamp() }),
      ]);
      setFinished(true);
    } finally { setSaving(false); }
  }
  if (finished) return <Frame><button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button><section className="assessment-result"><span className="mode-kicker">PLACEMENT RESULT</span><strong>{result.level}</strong><h2>{result.percent}% overall</h2><p>{result.correct} of {result.total} deterministic questions correct.</p><div className="skill-result">{Object.entries(result.skillScores).map(([skill, score]) => <div key={skill}><span>{skill}</span><b>{score}%</b></div>)}</div><button onClick={() => { setAnswers({}); setIndex(0); setFinished(false); }}>Retake assessment</button></section></Frame>;
  const selected = answers[question.id];
  return <Frame>
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button>
    <header><div><span className="eyebrow">CEFR DIAGNOSTIC</span><h1>Placement</h1><p>No self-rating shortcuts. Answer what you actually know.</p></div></header>
    <div className="assessment-progress"><i style={{ width: `${((index + 1) / placementQuestions.length) * 100}%` }} /></div>
    <section className="assessment-card"><span className="mode-kicker">{question.skill} · {question.level} · {index + 1}/{placementQuestions.length}</span><h2>{question.prompt}</h2><div className="assessment-options">{question.options.map(option => <button className={selected === option ? 'selected' : ''} key={option} onClick={() => setAnswers({ ...answers, [question.id]: option })}>{option}</button>)}</div><button className="assessment-next" disabled={!selected || saving} onClick={() => index === placementQuestions.length - 1 ? void finish() : setIndex(index + 1)}>{saving ? 'Saving…' : index === placementQuestions.length - 1 ? 'Finish assessment' : 'Next question'}</button></section>
  </Frame>;
}
