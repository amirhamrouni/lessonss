import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BrainCircuit, Check, ChevronRight, Gauge, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { loadLessonProgress, ProgressMap } from './learning';
import { placementQuestions, scorePlacement } from './assessment';
import { Rating, StoredReviewCard, dueCards, ensureReviewCards, meaningForLanguage, saveReviewRating } from './review';
import { directionFor, normalizeLanguage } from './languageSupport';

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

function supportLanguage(profile: Record<string, any> | null) {
  return normalizeLanguage(profile?.explanationLanguage || profile?.nativeLanguage || profile?.interfaceLanguage || 'English');
}

function interfaceLanguage(profile: Record<string, any> | null) {
  return normalizeLanguage(profile?.interfaceLanguage || profile?.instructionLanguage || profile?.nativeLanguage || 'English');
}

function Frame({ children, language }: { children: React.ReactNode; language?: string }) {
  return <div className="app-shell"><div className="phone mode-phone"><main className="page mode-page">{children}</main><AppDock language={language} className="mode-dock" /></div></div>;
}

function Loading({ language }: { language?: string }) { return <Frame language={language}><div className="mode-loading"><BrainCircuit /><p>Loading your learning engine…</p></div></Frame>; }

function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function PracticeHub() {
  const { user, progress, profile, loading } = useLearner();
  const nav = useNavigate();
  const [dueCount, setDueCount] = useState(0);
  const language = supportLanguage(profile);
  const ar = language === 'Arabic';
  useEffect(() => {
    if (!user) return;
    const completed = Object.values(progress).filter(p => p.completed).map(p => p.lessonId);
    ensureReviewCards(user.uid, completed).then(cards => setDueCount(dueCards(cards).length)).catch(() => setDueCount(0));
  }, [user, progress]);
  if (loading) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  const completed = Object.values(progress).filter(p => p.completed).length;
  return <Frame language={language}>
    <div dir={directionFor(language)}>
      <header><div><span className="eyebrow">{ar ? 'تدرّب · اختبر · ثبّت' : 'TRAIN, TEST, RETAIN'}</span><h1>{ar ? 'التدريب' : 'Practice'}</h1><p>{ar ? 'كل وضع تدريب له وظيفة مختلفة في تعلّم الإنجليزية.' : 'Different engines for different learning jobs.'}</p></div></header>
      <section className="practice-command">
        <div><span className="mode-kicker">{ar ? 'المقترح الآن' : 'RECOMMENDED'}</span><h2>{ar ? (dueCount ? `لديك ${dueCount} مراجعات مستحقة الآن.` : completed ? 'ثبّت ما تعلمته قبل أن يضعف التذكّر.' : 'أكمل درسًا أولًا، ثم ابدأ تدريب الذاكرة.') : (dueCount ? `${dueCount} reviews are due now.` : completed ? 'Build recall before it fades.' : 'Complete a lesson, then train recall.')}</h2><p>{ar ? 'يجدول FSRS كلمات الدروس التي أكملتها فعليًا فقط.' : 'FSRS schedules vocabulary from lessons you actually completed.'}</p></div>
        <button disabled={!dueCount} onClick={() => nav('/review')}>{ar ? (dueCount ? 'ابدأ المراجعة' : 'لا توجد مراجعة الآن') : (dueCount ? 'Review now' : 'Nothing due')} <ChevronRight /></button>
      </section>
      <div className="mode-list">
        <button onClick={() => nav('/review')}><RotateCcw /><div><span>{ar ? 'الذاكرة' : 'MEMORY'}</span><h3>{ar ? 'مراجعة ذكية' : 'Smart Review'}</h3><p>{ar ? 'مراجعة مفردات بنظام FSRS وفق أداءك الحقيقي.' : 'FSRS vocabulary review with Again / Hard / Good / Easy scheduling.'}</p></div><ChevronRight /></button>
        <button onClick={() => nav('/sentence-builder')}><Sparkles /><div><span>{ar ? 'الإنتاج' : 'OUTPUT'}</span><h3>{ar ? 'بناء الجملة' : 'Sentence Builder'}</h3><p>{ar ? 'رتّب الكلمات لتبني جملة إنجليزية صحيحة بدل الاكتفاء بالتعرّف على الإجابة.' : 'Build correct English from shuffled words instead of only tapping answers.'}</p></div><ChevronRight /></button>
        <button onClick={() => nav('/assessment')}><Gauge /><div><span>{ar ? 'تشخيص المستوى' : 'DIAGNOSTIC'}</span><h3>{ar ? 'اختبار تحديد المستوى' : 'Placement Test'}</h3><p>{ar ? (profile?.placementLevel ? `مستواك المقاس حاليًا: ${profile.placementLevel}. يمكنك إعادة الاختبار في أي وقت.` : 'اختبار CEFR ثابت يقيس القواعد والمفردات والقراءة بدون تخمين ذاتي.') : (profile?.placementLevel ? `Current placement: ${profile.placementLevel}. Retake any time.` : 'Deterministic CEFR diagnostic across grammar, vocabulary and reading.')}</p></div><ChevronRight /></button>
        <button onClick={() => nav('/speak')}><Mic /><div><span>{ar ? 'الصوت' : 'VOICE'}</span><h3>{ar ? 'مختبر المحادثة' : 'Conversation Lab'}</h3><p>{ar ? 'انتقل من التمارين المنظمة إلى الكلام العفوي مع الـTwin.' : 'Move from structured practice into spontaneous speech with your Twin.'}</p></div><ChevronRight /></button>
      </div>
    </div>
  </Frame>;
}

export function ReviewMode() {
  const { user, progress, profile, loading } = useLearner();
  const nav = useNavigate();
  const [cards, setCards] = useState<StoredReviewCard[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const language = supportLanguage(profile);
  const dir = directionFor(language);
  const ar = language === 'Arabic';
  useEffect(() => {
    if (!user) return;
    const completed = Object.values(progress).filter(p => p.completed).map(p => p.lessonId);
    ensureReviewCards(user.uid, completed).then(value => { setCards(value); setReady(true); }).catch(() => setReady(true));
  }, [user, progress]);
  if (loading || !ready) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  const queue = dueCards(cards);
  const card = queue[0];
  const nativeMeaning = card ? meaningForLanguage(card, language) : '';
  async function rate(rating: Rating) {
    if (!card || !user) return;
    setBusy(true);
    try {
      const next = await saveReviewRating(user.uid, card, rating);
      setCards(current => current.map(item => item.id === card.id ? next : item));
      setShowAnswer(false);
    } finally { setBusy(false); }
  }
  return <Frame language={language}>
    <div dir={dir}>
      <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {ar ? 'التدريب' : 'Practice'}</button>
      <header><div><span className="eyebrow">FSRS MEMORY</span><h1>{ar ? 'المراجعة الذكية' : 'Smart Review'}</h1><p>{ar ? `${queue.length} بطاقات مستحقة الآن.` : `${queue.length} cards due now.`}</p></div></header>
      {!card ? <section className="mode-empty"><Check /><h2>{ar ? 'أنت مواكب للمراجعة.' : 'You’re caught up.'}</h2><p>{ar ? 'سيعيد FSRS الكلمات عندما يتوقع أن الذاكرة تحتاج إلى تعزيز.' : 'FSRS will bring items back when memory strength predicts they should be reviewed.'}</p><button onClick={() => nav('/practice')}>{ar ? 'العودة للتدريب' : 'Back to practice'}</button></section> :
        <section className="review-card">
          <span className="mode-kicker">{ar ? `مفردات · ${queue.length} متبقية` : `VOCABULARY · ${queue.length} LEFT`}</span>
          <div dir="ltr" className="review-term-row">
            <div><h2>{card.term}</h2>{card.phonetic && <small className="review-phonetic">{card.phonetic}</small>}</div>
            <button className="review-audio" type="button" aria-label={`Play ${card.term}`} onClick={() => speakEnglish(card.term)}><Volume2 /></button>
          </div>
          {!showAnswer ? <><p>{ar ? 'تذكّر المعنى أولًا، ثم اكشف الإجابة.' : 'Recall the meaning before revealing it.'}</p><button className="reveal" onClick={() => setShowAnswer(true)}>{ar ? 'اكشف المعنى' : 'Reveal answer'}</button></> : <>
            <div className="review-answer" dir={dir}><strong>{nativeMeaning}</strong><p dir="ltr">{card.example}</p></div>
            <button className="review-example-audio" type="button" onClick={() => speakEnglish(card.example)}><Volume2 /> {ar ? 'اسمع المثال' : 'Hear example'}</button>
            <div className="rating-row">
              <button disabled={busy} onClick={() => rate(Rating.Again)}><span>{ar ? 'نسيت' : 'Again'}</span><small>{ar ? 'أعدها قريبًا' : 'Forgot'}</small></button>
              <button disabled={busy} onClick={() => rate(Rating.Hard)}><span>{ar ? 'صعب' : 'Hard'}</span><small>{ar ? 'تذكّرت بصعوبة' : 'Struggled'}</small></button>
              <button disabled={busy} onClick={() => rate(Rating.Good)}><span>{ar ? 'جيد' : 'Good'}</span><small>{ar ? 'تذكّرت' : 'Recalled'}</small></button>
              <button disabled={busy} onClick={() => rate(Rating.Easy)}><span>{ar ? 'سهل' : 'Easy'}</span><small>{ar ? 'فوري' : 'Instant'}</small></button>
            </div>
          </>}
        </section>}
    </div>
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
  const { user, profile, loading } = useLearner();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  const language = supportLanguage(profile);
  if (loading) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  const item = builders[index];
  const remaining = item.words.filter((word, i) => {
    const usedBefore = built.filter(x => x === word).length;
    const occurrence = item.words.slice(0, i + 1).filter(x => x === word).length;
    return occurrence > usedBefore;
  });
  function check() { setResult(JSON.stringify(built) === JSON.stringify(item.answer) ? 'ok' : 'bad'); }
  function next() { setIndex((index + 1) % builders.length); setBuilt([]); setResult(null); }
  return <Frame language={language}>
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
  const { user, profile, loading } = useLearner();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const result = useMemo(() => scorePlacement(answers), [answers]);
  const language = interfaceLanguage(profile);
  const ar = language === 'Arabic';
  const dir = directionFor(language);
  if (loading) return <Loading language={supportLanguage(profile)} />;
  if (!user) return <Navigate to="/welcome" replace />;
  const uid = user.uid;
  const question = placementQuestions[index];
  async function finish() {
    setSaving(true);
    try {
      const final = scorePlacement(answers);
      await Promise.all([
        setDoc(doc(db, 'users', uid), { placementLevel: final.level, placementCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, 'users', uid, 'assessments', 'latest'), { ...final, answers, completedAt: serverTimestamp() }),
      ]);
      setFinished(true);
    } finally { setSaving(false); }
  }
  if (finished) return <Frame language={supportLanguage(profile)}><div dir={dir}><button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {ar ? 'التدريب' : 'Practice'}</button><section className="assessment-result"><span className="mode-kicker">{ar ? 'نتيجة تحديد المستوى' : 'PLACEMENT RESULT'}</span><strong>{result.level}</strong><h2>{ar ? `${result.percent}% النتيجة الإجمالية` : `${result.percent}% overall`}</h2><p>{ar ? `${result.correct} إجابات صحيحة من أصل ${result.total} سؤالًا ثابتًا.` : `${result.correct} of ${result.total} deterministic questions correct.`}</p><div className="skill-result">{Object.entries(result.skillScores).map(([skill, score]) => <div key={skill}><span>{ar ? ({ Grammar: 'القواعد', Vocabulary: 'المفردات', Reading: 'القراءة' } as Record<string, string>)[skill] || skill : skill}</span><b>{score}%</b></div>)}</div><button onClick={() => { setAnswers({}); setIndex(0); setFinished(false); }}>{ar ? 'إعادة الاختبار' : 'Retake assessment'}</button></section></div></Frame>;
  const selected = answers[question.id];
  const skillLabel = ar ? ({ Grammar: 'القواعد', Vocabulary: 'المفردات', Reading: 'القراءة' } as Record<string, string>)[question.skill] || question.skill : question.skill;
  return <Frame language={supportLanguage(profile)}>
    <div dir={dir}>
      <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {ar ? 'التدريب' : 'Practice'}</button>
      <header><div><span className="eyebrow">{ar ? 'تشخيص CEFR' : 'CEFR DIAGNOSTIC'}</span><h1>{ar ? 'تحديد المستوى' : 'Placement'}</h1><p>{ar ? 'بدون تقييم ذاتي أو تخمين. أجب فقط عمّا تعرفه فعلًا.' : 'No self-rating shortcuts. Answer what you actually know.'}</p></div></header>
      <div className="assessment-progress"><i style={{ width: `${((index + 1) / placementQuestions.length) * 100}%` }} /></div>
      <section className="assessment-card">
        <span className="mode-kicker">{skillLabel} · {question.level} · {index + 1}/{placementQuestions.length}</span>
        <div className="native-instruction" dir={dir}>{ar ? 'اختر الإجابة الإنجليزية الصحيحة.' : 'Choose the correct English answer.'}</div>
        <h2 dir="ltr">{question.prompt}</h2>
        <div className="assessment-options" dir="ltr">{question.options.map(option => <button className={selected === option ? 'selected' : ''} key={option} onClick={() => setAnswers({ ...answers, [question.id]: option })}>{option}</button>)}</div>
        <button className="assessment-next" disabled={!selected || saving} onClick={() => index === placementQuestions.length - 1 ? void finish() : setIndex(index + 1)}>{saving ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : index === placementQuestions.length - 1 ? (ar ? 'إنهاء الاختبار' : 'Finish assessment') : (ar ? 'السؤال التالي' : 'Next question')}</button>
      </section>
    </div>
  </Frame>;
}