import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, Headphones, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage } from './languageSupport';
import { prioritizeSpeakingPrompts, scoreSpokenAttempt, speakingPrompts, SpeakingMistakeSignal, SpeechScore } from './speakingEngine';
import { speechSupportCopy } from './speechSupportCopy';
import { pronunciationSupportCopy } from './pronunciationSupportCopy';
import { prioritizeReviewFromMistake } from './review';

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

const GUIDED_SPEECH_CONSENT_KEY = 'english-twin-guided-speech-consent-v1';

function speakTarget(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

export default function SpeechDrill() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<SpeakingMistakeSignal[]>([]);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [error, setError] = useState('');
  const [speechConsent, setSpeechConsent] = useState(() => localStorage.getItem(GUIDED_SPEECH_CONSENT_KEY) === 'accepted');
  const [showConsent, setShowConsent] = useState(false);
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
      setMistakes(mistakesSnap.docs.map(item => item.data() as SpeakingMistakeSignal));
    } finally { setLoading(false); }
  }), []);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  const prompts = useMemo(() => prioritizeSpeakingPrompts(speakingPrompts, mistakes), [mistakes]);
  const item = prompts[index % Math.max(prompts.length, 1)];
  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const copy = speechSupportCopy[language];
  const pronunciationCopy = pronunciationSupportCopy[language];
  const dir = directionFor(language);

  if (loading) return <div className="app-shell" dir={dir}><div className="phone"><main className="page"><Mic /><p>{copy.loading}</p></main><AppDock language={language} /></div></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!item) return <div className="app-shell" dir={dir}><div className="phone"><main className="page"><button className="back" onClick={() => nav('/')}><ArrowLeft /> {copy.home}</button><p>{copy.noDrills}</p></main><AppDock language={language} /></div></div>;

  async function saveWeakAttempt(result: SpeechScore, heard: string) {
    if (!user || result.verdict !== 'retry') return;
    const id = `speech-${item.id}`;
    const context = `${heard} ${item.target} ${item.prompt} ${result.missingWords.join(' ')}`;
    await Promise.all([
      setDoc(doc(db, 'users', user.uid, 'mistakes', id), {
        lessonId: item.lessonId,
        skill: 'Speaking',
        original: heard,
        corrected: item.target,
        reason: result.missingWords.length ? `Missing or unclear words: ${result.missingWords.join(', ')}` : 'Speech transcript did not match the target closely enough.',
        latestExample: item.prompt,
        timesSeen: increment(1),
        lastSeenAt: serverTimestamp(),
        source: 'speech-drill',
        status: 'active',
        speechAccuracy: result.accuracy,
      }, { merge: true }),
      prioritizeReviewFromMistake(user.uid, item.lessonId, context).catch(() => []),
    ]);
  }

  function acceptSpeechConsent() {
    localStorage.setItem(GUIDED_SPEECH_CONSENT_KEY, 'accepted');
    setSpeechConsent(true);
    setShowConsent(false);
    beginRecognition();
  }

  function startListening() {
    if (!speechConsent) {
      setShowConsent(true);
      return;
    }
    beginRecognition();
  }

  function beginRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError(copy.recognitionUnsupported);
      return;
    }
    setError('');
    setTranscript('');
    setScore(null);
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = event => {
      let text = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        text += `${result[0].transcript} `;
        if (result.isFinal) finalText += `${result[0].transcript} `;
      }
      const heard = (finalText || text).trim();
      setTranscript(heard);
      if (finalText.trim()) {
        const nextScore = scoreSpokenAttempt(item.target, finalText.trim());
        setScore(nextScore);
        void saveWeakAttempt(nextScore, finalText.trim());
      }
    };
    recognition.onerror = event => { setError(copy.micError(event.error)); setListening(false); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function nextPrompt() {
    setIndex(current => (current + 1) % prompts.length);
    setTranscript('');
    setScore(null);
    setError('');
  }

  return <div className="app-shell" dir={dir}><div className="phone"><main className="page voice-live">
    <button className="back" onClick={() => nav('/')}><ArrowLeft /> {copy.home}</button>
    <header><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></header>

    <section className="practice-command pronunciation-entry-card"><div><span className="mode-kicker">{pronunciationCopy.eyebrow}</span><h2>{pronunciationCopy.title}</h2><p>{pronunciationCopy.intro}</p></div><button onClick={() => nav('/pronunciation')}><Volume2 /> {pronunciationCopy.wordStep} → {pronunciationCopy.sentenceStep}</button></section>

    {showConsent && <section className="rich-activity-card" role="dialog" aria-modal="true" aria-labelledby="guided-speech-consent-title">
      <div className="section-heading"><span>{copy.privacyEyebrow}</span><h3 id="guided-speech-consent-title">{copy.consentTitle}</h3></div>
      <p>{copy.consentBody}</p>
      <div className="lesson-actions"><button className="ghost" onClick={() => setShowConsent(false)}>{copy.notNow}</button><button className="primary lime" onClick={acceptSpeechConsent}>{copy.acceptStart}</button></div>
    </section>}

    <section className="builder-card">
      <span className="mode-kicker">{index + 1} / {prompts.length} · {item.lessonId.toUpperCase()}</span>
      <h2>{item.prompt}</h2>
      <div className="speech-target" dir="ltr">{item.target}</div>
      <button className="review-example-audio" type="button" onClick={() => speakTarget(item.target)}><Volume2 /> {copy.hearTarget}</button>
      <div className="builder-actions">
        <button onClick={() => { setTranscript(''); setScore(null); }}><RotateCcw /> {copy.reset}</button>
        <button className="solid" disabled={listening} onClick={startListening}><Mic /> {listening ? copy.listening : copy.speakNow}</button>
      </div>
    </section>

    {transcript && <section className="review-card"><span className="mode-kicker">{copy.heard}</span><p dir="ltr">{transcript}</p></section>}

    {score && <section className="review-card">
      <span className="mode-kicker">{copy.accuracy}</span>
      <div className="assessment-result"><strong>{score.accuracy}%</strong><h2>{score.verdict === 'excellent' ? copy.excellent : score.verdict === 'good' ? copy.good : copy.retry}</h2></div>
      {!!score.missingWords.length && <p>{copy.missing}: <b>{score.missingWords.join(', ')}</b></p>}
      {!!score.extraWords.length && <p>{copy.extra}: <b>{score.extraWords.join(', ')}</b></p>}
      <div className="builder-actions">{score.verdict === 'retry' ? <button className="solid" onClick={startListening}><Mic /> {copy.retry}</button> : <button className="solid" onClick={nextPrompt}><Sparkles /> {copy.nextDrill}</button>}</div>
    </section>}

    {error && <p className="error">{error}</p>}

    <section className="practice-command"><div><span className="mode-kicker">{copy.freeConversation}</span><h2>{copy.readyNatural}</h2><p>{copy.liveBody}</p></div><button onClick={() => nav('/speak/live')}><Headphones /> {copy.openLive}</button></section>
  </main><AppDock language={language} /></div></div>;
}
