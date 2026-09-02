import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { builderPriority, isBuilderCorrect, MistakeSignal, rankSentenceItems, sentenceItems } from './sentenceBuilder';
import { directionFor, normalizeLanguage } from './languageSupport';
import { modeSupportCopy } from './modeSupportCopy';
import { prioritizeReviewFromMistake } from './review';

function Frame({ children, language }: { children: React.ReactNode; language?: string }) {
  return <div className="app-shell"><div className="phone mode-phone"><main className="page mode-page">{children}</main><AppDock language={language} className="mode-dock" /></div></div>;
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
  const language = normalizeLanguage(profile?.explanationLanguage || profile?.nativeLanguage || profile?.interfaceLanguage);
  const dir = directionFor(language);
  const copy = modeSupportCopy[language];

  if (loading) return <Frame language={language}><p>{copy.loadingPractice}</p></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!item) return <Frame language={language}><button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button><h2>{copy.noSentence}</h2></Frame>;

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
      const context = `${built.join(' ')} ${item.answerText} ${item.prompt}`;
      await Promise.all([
        setDoc(doc(db, 'users', user.uid, 'mistakes', mistakeId), {
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
        }, { merge: true }),
        prioritizeReviewFromMistake(user.uid, item.sourceLessonId, context).catch(() => []),
      ]);
      setMistakes(current => [...current, { lessonId: item.sourceLessonId, original: built.join(' '), corrected: item.answerText, timesSeen: 1, status: 'active' }]);
    } finally { setSaving(false); }
  }

  function next() {
    setIndex(current => (current + 1) % ranked.length);
    setBuilt([]);
    setResult(null);
  }

  return <Frame language={language}>
    <div dir={dir}>
      <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button>
      <header><div><span className="eyebrow">ADAPTIVE OUTPUT</span><h1>{copy.builderTitle}</h1><p>{copy.builderIntro}</p></div></header>
      <section className="builder-card" dir={dir}>
        <span className="mode-kicker">{priority > 0 ? copy.mistakeFocus : copy.foundationPractice} · {index + 1}/{ranked.length}</span>
        <h2>{item.prompt}</h2>
        <div className="native-instruction">{copy.arrangeWords}</div>
        <div className="built-zone" dir="ltr">{built.length ? built.map((word, i) => <button key={`${word}-${i}`} onClick={() => { setBuilt(built.filter((_, j) => j !== i)); setResult(null); }}>{word}</button>) : <span>{copy.tapWords}</span>}</div>
        <div className="word-bank" dir="ltr">{remaining.map((word, i) => <button key={`${word}-${i}`} disabled={Boolean(result)} onClick={() => { setBuilt([...built, word]); setResult(null); }}>{word}</button>)}</div>
        {result && <div className={`builder-feedback ${result}`}>{result === 'ok' ? copy.correctOrder : copy.tryAgainTarget(item.answerText)}</div>}
        <div className="builder-actions">
          <button onClick={() => { setBuilt([]); setResult(null); }}><RotateCcw /> {copy.reset}</button>
          {result === 'ok' ? <button className="solid" onClick={next}><Sparkles /> {copy.next}</button> : result === 'bad' ? <button className="solid" onClick={() => { setBuilt([]); setResult(null); }}>{copy.tryAgain}</button> : <button className="solid" disabled={!built.length || saving} onClick={() => void check()}>{saving ? copy.saving : copy.check}</button>}
        </div>
      </section>
    </div>
  </Frame>;
}
