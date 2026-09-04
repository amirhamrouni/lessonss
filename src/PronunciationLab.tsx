import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BrainCircuit, ChevronRight, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage } from './languageSupport';
import { pronunciationItems, pronunciationPriority, prioritizePronunciationItems, PronunciationMistakeSignal } from './pronunciationData';
import { pronunciationSupportCopy } from './pronunciationSupportCopy';
import { scoreSpokenAttempt, SpeechScore } from './speakingEngine';

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; 0: RecognitionAlternative };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  }
}

const CONSENT_KEY = 'english-twin-guided-speech-consent-v1';
type Stage = 'word' | 'sentence';

function speakEnglish(text: string, rate: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => voice.lang.toLowerCase().startsWith('en-us')) || voices.find(voice => voice.lang.toLowerCase().startsWith('en')) || null;
  window.speechSynthesis.speak(utterance);
}

function highlightedSentence(sentence: string, word: string) {
  const lower = sentence.toLowerCase();
  const start = lower.indexOf(word.toLowerCase());
  if (start < 0) return <>{sentence}</>;
  return <>{sentence.slice(0, start)}<mark>{sentence.slice(start, start + word.length)}</mark>{sentence.slice(start + word.length)}</>;
}

export default function PronunciationLab() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [mistakes, setMistakes] = useState<PronunciationMistakeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('word');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [error, setError] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [speechConsent, setSpeechConsent] = useState(() => localStorage.getItem(CONSENT_KEY) === 'accepted');
  const recognitionRef = useRef<RecognitionLike | null>(null);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const [profileSnap, mistakesSnap] = await Promise.all([
        getDoc(doc(db, 'users', current.uid)),
        getDocs(collection(db, 'users', current.uid, 'mistakes')),
      ]);
      setProfile(profileSnap.exists() ? profileSnap.data() : {});
      setMistakes(mistakesSnap.docs.map(item => item.data() as PronunciationMistakeSignal));
    } finally { setLoading(false); }
  }), []);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const copy = pronunciationSupportCopy[language];
  const dir = directionFor(language);
  const queue = useMemo(() => prioritizePronunciationItems(pronunciationItems, mistakes), [mistakes]);
  const item = queue[index % Math.max(queue.length, 1)];
  const target = item ? (stage === 'word' ? item.word : item.sentence) : '';
  const personalized = item ? pronunciationPriority(item, mistakes) > 0 : false;

  if (loading) return <div className="app-shell" dir={dir}><div className="phone"><main className="page"><BrainCircuit /><p>{copy.loading}</p></main><AppDock language={language} /></div></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!item) return <Navigate to="/practice" replace />;

  function resetAttempt() {
    setTranscript('');
    setScore(null);
    setError('');
  }

  function acceptConsent() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setSpeechConsent(true);
    setShowConsent(false);
    beginRecognition();
  }

  function startRecognition() {
    if (!speechConsent) { setShowConsent(true); return; }
    beginRecognition();
  }

  function beginRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError(copy.recognitionUnsupported); return; }
    resetAttempt();
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = event => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        interim += `${result[0].transcript} `;
        if (result.isFinal) finalText += `${result[0].transcript} `;
      }
      const heard = (finalText || interim).trim();
      setTranscript(heard);
      if (finalText.trim()) {
        const result = scoreSpokenAttempt(target, finalText.trim());
        setScore(result);
        if (result.verdict === 'retry') void saveWeakAttempt(result, finalText.trim());
      }
    };
    recognition.onerror = event => {
      setListening(false);
      setError(event.error === 'no-speech' ? copy.noSpeech : copy.micError(event.error));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  async function saveWeakAttempt(result: SpeechScore, heard: string) {
    if (!user) return;
    const id = `pronunciation-${item.id}-${stage}`;
    await setDoc(doc(db, 'users', user.uid, 'mistakes', id), {
      skill: 'Pronunciation',
      original: heard,
      corrected: target,
      reason: stage === 'word'
        ? `Pronunciation recognition did not reliably match the target word “${item.word}”. Focus: ${item.focus}.`
        : `Pronunciation recognition did not reliably match the target sentence. Focus word: “${item.word}”.`,
      latestExample: item.sentence,
      timesSeen: increment(1),
      lastSeenAt: serverTimestamp(),
      source: 'pronunciation-lab',
      status: 'active',
      pronunciationItemId: item.id,
      pronunciationStage: stage,
      speechAccuracy: result.accuracy,
    }, { merge: true });
  }

  function moveForward() {
    resetAttempt();
    if (stage === 'word') {
      setStage('sentence');
      return;
    }
    setStage('word');
    setIndex(current => (current + 1) % queue.length);
  }

  const verdictLabel = !score ? '' : score.verdict === 'excellent' ? copy.excellent : score.verdict === 'good' ? copy.good : copy.retry;
  const stressWord = item.syllables.map((syllable, syllableIndex) => <span key={`${syllable}-${syllableIndex}`} className={syllableIndex === item.stressIndex ? 'stressed' : ''}>{syllable}</span>);

  return <div className="app-shell pronunciation-shell" dir={dir}><div className="phone"><main className="page pronunciation-page">
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.back}</button>
    <header className="pronunciation-header"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><div className="pronunciation-orb"><Volume2 /></div></header>

    <div className="pronunciation-progress" aria-label={copy.progress(index + 1, queue.length)}><div><span>{copy.progress(index + 1, queue.length)}</span><b>{stage === 'word' ? copy.wordStep : copy.sentenceStep}</b></div><i><em style={{ width: `${((index + (stage === 'sentence' ? 0.5 : 0)) / queue.length) * 100}%` }} /></i></div>

    {personalized && <section className="pronunciation-personalized"><BrainCircuit /><div><b>{copy.personalized}</b><p>{copy.personalizedBody}</p></div></section>}

    {showConsent && <section className="rich-activity-card pronunciation-consent" role="dialog" aria-modal="true" aria-labelledby="pronunciation-consent-title"><div className="section-heading"><span>{copy.consentEyebrow}</span><h3 id="pronunciation-consent-title">{copy.consentTitle}</h3></div><p>{copy.consentBody}</p><div className="lesson-actions"><button className="ghost" onClick={() => setShowConsent(false)}>{copy.notNow}</button><button className="primary lime" onClick={acceptConsent}>{copy.accept}</button></div></section>}

    <section className={`pronunciation-card ${stage}`}>
      <div className="pronunciation-stage-label"><span>{stage === 'word' ? copy.wordStep : copy.sentenceStep}</span><small>{item.focus}</small></div>
      {stage === 'word' ? <>
        <h2 dir="ltr">{item.word}</h2>
        <div className="syllable-row" dir="ltr">{stressWord}</div>
      </> : <h2 className="pronunciation-sentence" dir="ltr">{highlightedSentence(item.sentence, item.word)}</h2>}

      <div className="listen-actions">
        <button onClick={() => speakEnglish(target, stage === 'word' ? 0.82 : 0.86)}><Volume2 /> {copy.listen}</button>
        <button onClick={() => speakEnglish(target, 0.62)}><Volume2 /> {copy.slow}</button>
      </div>

      <button className={`pronunciation-mic ${listening ? 'listening' : ''}`} disabled={listening} onClick={startRecognition}><span><Mic /></span><b>{listening ? copy.listening : copy.speak}</b></button>

      {transcript && <div className="pronunciation-heard"><span>{copy.heard}</span><p dir="ltr">{transcript}</p></div>}

      {score && <div className={`pronunciation-score ${score.verdict}`}><div className="score-ring" style={{ '--score': `${score.accuracy}%` } as React.CSSProperties}><strong>{score.accuracy}%</strong></div><div><span>{copy.accuracy}</span><h3>{verdictLabel}</h3>{score.missingWords.length > 0 && <small>{score.missingWords.join(' · ')}</small>}</div></div>}
    </section>

    <section className="pronunciation-coach-grid">
      <article><span>{copy.focus}</span><b>{item.focus}</b><p>{item.mouthTip}</p></article>
      <article><span>{copy.stress}</span><b dir="ltr" className="stress-preview">{stressWord}</b><p>{copy.mouth}</p></article>
      {item.contrast && <article className="contrast-card"><span>{copy.contrast}</span><div dir="ltr"><b>{item.word}</b><i>↔</i><b>{item.contrast.word}</b></div><p>{item.contrast.cue}</p></article>}
    </section>

    {error && <p className="error">{error}</p>}

    <div className="pronunciation-footer-actions">
      <button className="ghost" onClick={resetAttempt}><RotateCcw /> {copy.tryAgain}</button>
      <button className="primary" onClick={moveForward}>{stage === 'word' ? copy.nextSentence : copy.nextWord} <ChevronRight /></button>
    </div>

    <section className="pronunciation-note"><Sparkles /><p>English Twin compares what the browser recognized with the target. The sound-focus and mouth tips guide pronunciation; this is not a phoneme-level acoustic exam.</p></section>
  </main><AppDock language={language} /></div></div>;
}
