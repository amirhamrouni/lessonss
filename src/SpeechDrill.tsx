import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, Headphones, LoaderCircle, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, ProgressBar, SectionTitle, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
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

const stateCopy: Record<SupportedLanguage, { loadError:string; loadErrorBody:string; retry:string; noDrillsBody:string; backPractice:string }> = {
  English:{loadError:'Couldn’t prepare speaking practice',loadErrorBody:'Your saved mistakes and progress were not changed. Check the connection and try again.',retry:'Try again',noDrillsBody:'Complete a lesson first so English Twin can choose a useful speaking prompt.',backPractice:'Back to practice'},
  Arabic:{loadError:'تعذّر تجهيز تدريب المحادثة',loadErrorBody:'لم تتغيّر أخطاؤك أو نتائجك المحفوظة. تحقق من الاتصال وحاول مرة أخرى.',retry:'حاول مرة أخرى',noDrillsBody:'أكمل درسًا أولًا حتى يختار English Twin تمرين نطق مناسبًا.',backPractice:'العودة للتدريب'},
  Dutch:{loadError:'Spreekoefening kon niet worden voorbereid',loadErrorBody:'Je opgeslagen fouten en voortgang zijn niet gewijzigd. Controleer de verbinding en probeer opnieuw.',retry:'Opnieuw proberen',noDrillsBody:'Voltooi eerst een les zodat English Twin een nuttige spreekoefening kan kiezen.',backPractice:'Terug naar oefenen'},
  French:{loadError:'Impossible de préparer l’exercice oral',loadErrorBody:'Tes erreurs et ta progression enregistrées n’ont pas changé. Vérifie la connexion et réessaie.',retry:'Réessayer',noDrillsBody:'Termine d’abord une leçon pour que English Twin choisisse un exercice utile.',backPractice:'Retour aux exercices'},
  German:{loadError:'Sprechtraining konnte nicht vorbereitet werden',loadErrorBody:'Deine gespeicherten Fehler und Fortschritte wurden nicht verändert. Prüfe die Verbindung und versuche es erneut.',retry:'Erneut versuchen',noDrillsBody:'Schließe zuerst eine Lektion ab, damit English Twin eine passende Sprechübung auswählen kann.',backPractice:'Zurück zum Üben'},
  Spanish:{loadError:'No se pudo preparar la práctica oral',loadErrorBody:'Tus errores y progreso guardados no cambiaron. Revisa la conexión y vuelve a intentarlo.',retry:'Intentar de nuevo',noDrillsBody:'Completa primero una lección para que English Twin elija una práctica útil.',backPractice:'Volver a practicar'},
};

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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [mistakes, setMistakes] = useState<SpeakingMistakeSignal[]>([]);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [error, setError] = useState('');
  const [speechConsent, setSpeechConsent] = useState(() => localStorage.getItem(GUIDED_SPEECH_CONSENT_KEY) === 'accepted');
  const [showConsent, setShowConsent] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async current => {
      setUser(current);
      setLoadError(false);
      setLoading(true);
      if (!current) { setLoading(false); return; }
      try {
        const [profileSnap, mistakesSnap] = await Promise.all([
          getDoc(doc(db, 'users', current.uid)),
          getDocs(collection(db, 'users', current.uid, 'mistakes')),
        ]);
        setProfile(profileSnap.exists() ? profileSnap.data() : {});
        setMistakes(mistakesSnap.docs.map(item => item.data() as SpeakingMistakeSignal));
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [reloadKey]);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  const prompts = useMemo(() => prioritizeSpeakingPrompts(speakingPrompts, mistakes), [mistakes]);
  const item = prompts[index % Math.max(prompts.length, 1)];
  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const copy = speechSupportCopy[language];
  const pronunciationCopy = pronunciationSupportCopy[language];
  const state = stateCopy[language];
  const dir = directionFor(language);

  if (loading) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title={copy.loading} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<AlertTriangle />} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{state.retry}</ETButton>} /></LearningShell>;
  if (!item) return <LearningShell language={language} dir={dir}><StatusState icon={<Mic />} title={copy.noDrills} body={state.noDrillsBody} action={<ETButton variant="secondary" onClick={() => nav('/practice')}>{state.backPractice}</ETButton>} /></LearningShell>;

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
        void saveWeakAttempt(nextScore, finalText.trim()).catch(() => undefined);
      }
    };
    recognition.onerror = event => { setError(copy.micError(event.error)); setListening(false); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setError(copy.micError('start-failed'));
    }
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
      <ETButton variant="secondary" onClick={() => speakTarget(item.target)}><Volume2 /> {copy.hearTarget}</ETButton>
      <button type="button" className={`et-mic-button ${listening ? 'listening' : ''}`} disabled={listening} onClick={startListening} aria-label={listening ? copy.listening : copy.speakNow}><Mic /></button>
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
