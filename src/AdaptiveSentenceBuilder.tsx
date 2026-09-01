import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, Gauge, Home, Mic, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { auth, db } from './firebase';
import { builderPriority, isBuilderCorrect, MistakeSignal, rankSentenceItems, sentenceItems } from './sentenceBuilder';
import { directionFor, normalizeLanguage } from './languageSupport';

function Dock() {
  return <nav className="dock mode-dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><div className="phone mode-phone"><main className="page mode-page">{children}</main><Dock /></div></div>;
}

export default function AdaptiveSentenceBuilder() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [mistakes, setMistakes] = useState<MistakeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const [profileSnap, mistakesSnap] = await Promise.all([
        getDoc(doc(db, 'users', current.uid)),
        getDocs(collection(db, 'users', current.uid, 'mistakes')),
      ]);
      setProfile(profileSnap.exists() ? profileSnap.data() : {});
      setMistakes(mistakesSnap.docs.map(item => item.data() as MistakeSignal));
    } finally { setLoading(false); }
  }), []);

  const ranked = useMemo(() => rankSentenceItems(sentenceItems, mistakes), [mistakes]);
  const item = ranked[index % Math.max(1, ranked.length)];
  const language = normalizeLanguage(profile?.nativeLanguage || profile?.explanationLanguage || profile?.interfaceLanguage);
  const dir = directionFor(language);
  const ar = language === 'Arabic';

  if (loading) return <Frame><p>{ar ? 'جارٍ تحميل تدريبك…' : 'Loading your practice…'}</p></Frame>;
  if (!user) return <Navigate to="/" replace />;
  if (!item) return <Frame><button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button><h2>No sentence practice available.</h2></Frame>;

  const remaining = item.words.filter((word, i) => {
    const usedBefore = built.filter(x => x === word).length;
    const occurrence = item.words.slice(0, i + 1).filter(x => x === word).length;
    return occurrence > usedBefore;
  });
  const priority = builderPriority(item, mistakes);

  async function check() {
    const ok = isBuilderCorrect(item, built);
    setResult(ok ? 'ok' : 'bad');
    if (ok || !user) return;
    setSaving(true);
    try {
      const mistakeId = `sentence-builder-${item.id}`;
      await setDoc(doc(db, 'users', user.uid, 'mistakes', mistakeId), {
        lessonId: item.sourceLessonId,
        skill: 'Sentence Building',
        original: built.join(' '),
        corrected: item.answerText,
        reason: 'English word order needs reinforcement.',
        latestExample: item.prompt,
        timesSeen: increment(1),
        lastSeenAt: serverTimestamp(),
        source: 'sentence-builder',
        status: 'active',
      }, { merge: true });
      setMistakes(current => [...current, { lessonId: item.sourceLessonId, original: built.join(' '), corrected: item.answerText, timesSeen: 1, status: 'active' }]);
    } finally { setSaving(false); }
  }

  function next() {
    setIndex(current => (current + 1) % ranked.length);
    setBuilt([]);
    setResult(null);
  }

  return <Frame>
    <div dir={dir}>
      <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {ar ? 'التدريب' : 'Practice'}</button>
      <header><div><span className="eyebrow">ADAPTIVE OUTPUT</span><h1>{ar ? 'بناء الجملة الذكي' : 'Adaptive Sentence Builder'}</h1><p>{ar ? 'يقدّم الجمل المرتبطة بأخطائك السابقة أولًا.' : 'Sentences tied to your previous mistakes move to the front.'}</p></div></header>
      <section className="builder-card" dir={dir}>
        <span className="mode-kicker">{priority > 0 ? (ar ? 'أولوية من سجل الأخطاء' : 'MISTAKE-DRIVEN FOCUS') : (ar ? 'تدريب أساسي' : 'FOUNDATION PRACTICE')} · {index + 1}/{ranked.length}</span>
        <h2>{item.prompt}</h2>
        <div className="native-instruction">{ar ? 'رتّب الكلمات لتكوين الجملة الإنجليزية الصحيحة.' : 'Arrange the words into the correct English sentence.'}</div>
        <div className="built-zone" dir="ltr">{built.length ? built.map((word, i) => <button key={`${word}-${i}`} onClick={() => { setBuilt(built.filter((_, j) => j !== i)); setResult(null); }}>{word}</button>) : <span>{ar ? 'اضغط الكلمات بالأسفل' : 'Tap words below to build the sentence'}</span>}</div>
        <div className="word-bank" dir="ltr">{remaining.map((word, i) => <button key={`${word}-${i}`} disabled={Boolean(result)} onClick={() => { setBuilt([...built, word]); setResult(null); }}>{word}</button>)}</div>
        {result && <div className={`builder-feedback ${result}`}>{result === 'ok' ? (ar ? 'صحيح — ترتيب طبيعي.' : 'Correct — natural word order.') : (ar ? `حاول مجددًا. الجملة الصحيحة: ${item.answerText}` : `Try again. Target: ${item.answerText}.`)}</div>}
        <div className="builder-actions">
          <button onClick={() => { setBuilt([]); setResult(null); }}><RotateCcw /> {ar ? 'إعادة' : 'Reset'}</button>
          {result === 'ok' ? <button className="solid" onClick={next}><Sparkles /> {ar ? 'التالي' : 'Next'}</button> : result === 'bad' ? <button className="solid" onClick={() => { setBuilt([]); setResult(null); }}>{ar ? 'حاول مرة أخرى' : 'Try again'}</button> : <button className="solid" disabled={!built.length || saving} onClick={() => void check()}>{saving ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : (ar ? 'تحقق' : 'Check')}</button>}
        </div>
      </section>
    </div>
  </Frame>;
}
