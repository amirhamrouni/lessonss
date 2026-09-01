import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, Gauge, Headphones, Home, Mic, RotateCcw, Sparkles, UserRound, Volume2 } from 'lucide-react';
import { auth, db } from './firebase';
import { prioritizeSpeakingPrompts, scoreSpokenAttempt, speakingPrompts, SpeakingMistakeSignal, SpeechScore } from './speakingEngine';
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

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

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
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<SpeakingMistakeSignal[]>([]);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<RecognitionLike | null>(null);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const snap = await getDocs(collection(db, 'users', current.uid, 'mistakes'));
      setMistakes(snap.docs.map(item => item.data() as SpeakingMistakeSignal));
    } finally { setLoading(false); }
  }), []);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  const prompts = useMemo(() => prioritizeSpeakingPrompts(speakingPrompts, mistakes), [mistakes]);
  const item = prompts[index % Math.max(prompts.length, 1)];

  if (loading) return <div className="app-shell"><div className="phone"><main className="page"><Mic /><p>Preparing speech practice…</p></main><Dock /></div></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!item) return <div className="app-shell"><div className="phone"><main className="page"><button className="back" onClick={() => nav('/')}><ArrowLeft /> Home</button><p>No speaking drills are available yet.</p></main><Dock /></div></div>;

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

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Guided speech recognition is not supported in this browser. Use Live Conversation instead.');
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
    recognition.onerror = event => { setError(`Microphone recognition error: ${event.error}`); setListening(false); };
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

  return <div className="app-shell"><div className="phone"><main className="page voice-live">
    <button className="back" onClick={() => nav('/')}><ArrowLeft /> Home</button>
    <header><span className="eyebrow">GUIDED SPEECH · ADAPTIVE</span><h1>Say it clearly</h1><p>Practice real lesson sentences. Weak lessons are prioritized from your saved mistake history.</p></header>

    <section className="builder-card">
      <span className="mode-kicker">{index + 1} / {prompts.length} · {item.lessonId.toUpperCase()}</span>
      <h2>{item.prompt}</h2>
      <div className="speech-target" dir="ltr">{item.target}</div>
      <button className="review-example-audio" type="button" onClick={() => speakTarget(item.target)}><Volume2 /> Hear target</button>
      <div className="builder-actions">
        <button onClick={() => { setTranscript(''); setScore(null); }}><RotateCcw /> Reset</button>
        <button className="solid" disabled={listening} onClick={startListening}><Mic /> {listening ? 'Listening…' : 'Speak now'}</button>
      </div>
    </section>

    {transcript && <section className="review-card"><span className="mode-kicker">WHAT WE HEARD</span><p dir="ltr">{transcript}</p></section>}

    {score && <section className="review-card">
      <span className="mode-kicker">SPEECH ACCURACY</span>
      <div className="assessment-result"><strong>{score.accuracy}%</strong><h2>{score.verdict === 'excellent' ? 'Excellent match' : score.verdict === 'good' ? 'Good — one more clean repetition' : 'Try again'}</h2></div>
      {!!score.missingWords.length && <p>Missing / unclear: <b>{score.missingWords.join(', ')}</b></p>}
      {!!score.extraWords.length && <p>Extra words heard: <b>{score.extraWords.join(', ')}</b></p>}
      <div className="builder-actions">{score.verdict === 'retry' ? <button className="solid" onClick={startListening}><Mic /> Try again</button> : <button className="solid" onClick={nextPrompt}><Sparkles /> Next drill</button>}</div>
    </section>}

    {error && <p className="error">{error}</p>}

    <section className="practice-command"><div><span className="mode-kicker">FREE CONVERSATION</span><h2>Ready to speak naturally?</h2><p>Live Conversation uses the authenticated Gemini Live microphone session for open-ended dialogue.</p></div><button onClick={() => nav('/speak/live')}><Headphones /> Open Live</button></section>
  </main><Dock /></div></div>;
}
