import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { Headphones, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, ProgressBar, SectionTitle, Surface } from './ui/LearningUI';
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

  if (loading) return <LearningShell language={language} dir={dir}><Mic /><p>{copy.loading}</p></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!item) return <LearningShell language={language} dir={dir}><p>{copy.noDrills}</p></LearningShell>;

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
    if (!speechConsent) { setShowConsent(true); return; }
    beginRecognition();
  }

  function beginRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError(copy.recognitionUnsupported); return; }
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

  return <LearningShell language={language} dir={dir} className="et-speak-shell">
    <PageTitle eyebrow={copy.eyebrow} title={copy.title} description={copy.intro} />

    <Surface className="et-pronunciation-shortcut" tone="teal">
      <div><span className="et-eyebrow">{pronunciationCopy.eyebrow}</span><h2>{pronunciationCopy.title}</h2><p>{pronunciationCopy.intro}</p></div>
      <ETButton variant="secondary" onClick={() => nav('/pronunciation')}><Volume2 /> {pronunciationCopy.wordStep} → {pronunciationCopy.sentenceStep}</ETButton>
    </Surface>

    {showConsent ? <Surface className="et-consent-card" role="dialog" aria-modal="true" aria-labelledby="guided-speech-consent-title">
      <SectionTitle title={copy.consentTitle} meta={copy.privacyEyebrow} />
      <p id="guided-speech-consent-title">{copy.consentBody}</p>
      <div className="et-inline-actions"><ETButton variant="ghost" onClick={() => setShowConsent(false)}>{copy.notNow}</ETButton><ETButton onClick={acceptSpeechConsent}>{copy.acceptStart}</ETButton></div>
    </Surface> : null}

    <Surface className="et-speech-card">
      <div className="et-speech-progress"><span>{index + 1} / {prompts.length}</span><small>{item.lessonId.toUpperCase()}</small></div>
      <h2>{item.prompt}</h2>
      <div className="et-speech-target" dir="ltr">{item.target}</div>
      <ETButton variant="secondary" type="button" onClick={() => speakTarget(item.target)}><Volume2 /> {copy.hearTarget}</ETButton>
      <button className={`et-mic-button ${listening ? 'listening' : ''}`} disabled={listening} onClick={startListening} aria-label={listening ? copy.listening : copy.speakNow}><Mic /></button>
      <b className="et-mic-label">{listening ? copy.listening : copy.speakNow}</b>
    </Surface>

    {transcript ? <Surface className="et-transcript-card"><span className="et-eyebrow">{copy.heard}</span><p dir="ltr">{transcript}</p><ETButton variant="ghost" onClick={() => { setTranscript(''); setScore(null); }}><RotateCcw /> {copy.reset}</ETButton></Surface> : null}

    {score ? <Surface className={`et-speech-score ${score.verdict}`}>
      <SectionTitle title={score.verdict === 'excellent' ? copy.excellent : score.verdict === 'good' ? copy.good : copy.retry} meta={copy.accuracy} />
      <div className="et-score-number"><strong>{score.accuracy}</strong><span>%</span></div>
      <ProgressBar value={score.accuracy} />
      {score.missingWords.length ? <div className="et-word-feedback"><span>{copy.missing}</span><b>{score.missingWords.join(', ')}</b></div> : null}
      {score.extraWords.length ? <div className="et-word-feedback"><span>{copy.extra}</span><b>{score.extraWords.join(', ')}</b></div> : null}
      <ETButton className="et-full" onClick={score.verdict === 'retry' ? startListening : nextPrompt}>{score.verdict === 'retry' ? <><Mic /> {copy.retry}</> : <><Sparkles /> {copy.nextDrill}</>}</ETButton>
    </Surface> : null}

    {error ? <p className="error" role="alert">{error}</p> : null}

    <Surface className="et-live-card" tone="blue">
      <div><span className="et-eyebrow">{copy.freeConversation}</span><h2>{copy.readyNatural}</h2><p>{copy.liveBody}</p></div>
      <ETButton onClick={() => nav('/speak/live')}><Headphones /> {copy.openLive}</ETButton>
    </Surface>
  </LearningShell>;
}
