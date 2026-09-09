import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, BrainCircuit, ChevronRight, LoaderCircle, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { ETButton, LearningShell, StatusState } from './ui/LearningUI';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
import { pronunciationItems, pronunciationPriority, prioritizePronunciationItems, PronunciationMistakeSignal } from './pronunciationData';
import { pronunciationSupportCopy } from './pronunciationSupportCopy';
import { pronunciationMeasurementNote, pronunciationTip } from './pronunciationTips';
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

const stateCopy: Record<SupportedLanguage, { loadError:string; loadErrorBody:string; retry:string; noItems:string; noItemsBody:string }> = {
  English:{loadError:'Couldn’t prepare pronunciation practice',loadErrorBody:'Your saved pronunciation mistakes were not changed. Check the connection and try again.',retry:'Try again',noItems:'No pronunciation items are available',noItemsBody:'Return to Practice and continue another activity for now.'},
  Arabic:{loadError:'تعذّر تجهيز تدريب النطق',loadErrorBody:'لم تتغيّر أخطاء النطق المحفوظة. تحقق من الاتصال وحاول مرة أخرى.',retry:'حاول مرة أخرى',noItems:'لا توجد تمارين نطق متاحة',noItemsBody:'ارجع إلى التدريب وواصل نشاطًا آخر الآن.'},
  Dutch:{loadError:'Uitspraakoefening kon niet worden voorbereid',loadErrorBody:'Je opgeslagen uitspraakfouten zijn niet gewijzigd. Controleer de verbinding en probeer opnieuw.',retry:'Opnieuw proberen',noItems:'Er zijn geen uitspraakoefeningen beschikbaar',noItemsBody:'Ga terug naar Oefenen en kies voorlopig een andere activiteit.'},
  French:{loadError:'Impossible de préparer la prononciation',loadErrorBody:'Tes erreurs de prononciation enregistrées n’ont pas changé. Vérifie la connexion et réessaie.',retry:'Réessayer',noItems:'Aucun exercice de prononciation disponible',noItemsBody:'Retourne aux exercices et choisis une autre activité pour le moment.'},
  German:{loadError:'Aussprachetraining konnte nicht vorbereitet werden',loadErrorBody:'Deine gespeicherten Aussprachefehler wurden nicht verändert. Prüfe die Verbindung und versuche es erneut.',retry:'Erneut versuchen',noItems:'Keine Ausspracheübungen verfügbar',noItemsBody:'Gehe zurück zum Üben und wähle vorerst eine andere Aktivität.'},
  Spanish:{loadError:'No se pudo preparar la práctica de pronunciación',loadErrorBody:'Tus errores de pronunciación guardados no cambiaron. Revisa la conexión y vuelve a intentarlo.',retry:'Intentar de nuevo',noItems:'No hay ejercicios de pronunciación disponibles',noItemsBody:'Vuelve a Práctica y elige otra actividad por ahora.'},
};

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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('word');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<SpeechScore | null>(null);
  const [error, setError] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [speechConsent, setSpeechConsent] = useState(() => localStorage.getItem(CONSENT_KEY) === 'accepted');
  const recognitionRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setLoading(true);
      setLoadError(false);
      if (!current) { setLoading(false); return; }
      try {
        const [profileSnap, mistakesSnap] = await Promise.all([
          getDoc(doc(db, 'users', current.uid)),
          getDocs(collection(db, 'users', current.uid, 'mistakes')),
        ]);
        if (!active) return;
        setProfile(profileSnap.exists() ? profileSnap.data() : {});
        setMistakes(mistakesSnap.docs.map(item => item.data() as PronunciationMistakeSignal));
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [reloadKey]);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const copy = pronunciationSupportCopy[language];
  const state = stateCopy[language];
  const dir = directionFor(language);
  const queue = useMemo(() => prioritizePronunciationItems(pronunciationItems, mistakes), [mistakes]);
  const item = queue[index % Math.max(queue.length, 1)];
  const target = item ? (stage === 'word' ? item.word : item.sentence) : '';
  const personalized = item ? pronunciationPriority(item, mistakes) > 0 : false;

  if (loading) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="PRONUNCIATION" title={copy.loading} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <LearningShell language={language} dir={dir}><StatusState icon={<AlertTriangle />} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{state.retry}</ETButton>} /></LearningShell>;
  if (!item) return <LearningShell language={language} dir={dir}><StatusState icon={<Volume2 />} title={state.noItems} body={state.noItemsBody} action={<ETButton variant="secondary" onClick={() => nav('/practice')}>{copy.back}</ETButton>} /></LearningShell>;

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
        if (result.verdict === 'retry') void saveWeakAttempt(result, finalText.trim()).catch(() => undefined);
      }
    };
    recognition.onerror = event => {
      setListening(false);
      setError(event.error === 'no-speech' ? copy.noSpeech : copy.micError(event.error));
    };
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

  return <LearningShell language={language} dir={dir} className="pronunciation-shell" pageClassName="pronunciation-page">
    <button type="button" className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.back}</button>
    <header className="pronunciation-header"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><div className="pronunciation-orb"><Volume2 /></div></header>

    <div className="pronunciation-progress" aria-label={copy.progress(index + 1, queue.length)}><div><span>{copy.progress(index + 1, queue.length)}</span><b>{stage === 'word' ? copy.wordStep : copy.sentenceStep}</b></div><i role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((index + (stage === 'sentence' ? 0.5 : 0)) / queue.length) * 100)}><em style={{ width: `${((index + (stage === 'sentence' ? 0.5 : 0)) / queue.length) * 100}%` }} /></i></div>

    {personalized ? <section className="pronunciation-personalized"><BrainCircuit /><div><b>{copy.personalized}</b><p>{copy.personalizedBody}</p></div></section> : null}

    {showConsent ? <section className="rich-activity-card pronunciation-consent" role="dialog" aria-modal="true" aria-labelledby="pronunciation-consent-title"><div className="section-heading"><span>{copy.consentEyebrow}</span><h3 id="pronunciation-consent-title">{copy.consentTitle}</h3></div><p>{copy.consentBody}</p><div className="lesson-actions"><button type="button" className="ghost" onClick={() => setShowConsent(false)}>{copy.notNow}</button><button type="button" className="primary lime" onClick={acceptConsent}>{copy.accept}</button></div></section> : null}

    <section className={`pronunciation-card ${stage}`}>
      <div className="pronunciation-stage-label"><span>{stage === 'word' ? copy.wordStep : copy.sentenceStep}</span><small>{item.focus}</small></div>
      {stage === 'word' ? <>
        <h2 dir="ltr">{item.word}</h2>
        <div className="syllable-row" dir="ltr">{stressWord}</div>
      </> : <h2 className="pronunciation-sentence" dir="ltr">{highlightedSentence(item.sentence, item.word)}</h2>}

      <div className="listen-actions">
        <button type="button" onClick={() => speakEnglish(target, stage === 'word' ? 0.82 : 0.86)}><Volume2 /> {copy.listen}</button>
        <button type="button" onClick={() => speakEnglish(target, 0.62)}><Volume2 /> {copy.slow}</button>
      </div>

      <button type="button" className={`pronunciation-mic ${listening ? 'listening' : ''}`} disabled={listening} aria-busy={listening} onClick={startRecognition}><span><Mic /></span><b>{listening ? copy.listening : copy.speak}</b></button>

      {transcript ? <div className="pronunciation-heard"><span>{copy.heard}</span><p dir="ltr">{transcript}</p></div> : null}

      {score ? <div className={`pronunciation-score ${score.verdict}`}><div className="score-ring" style={{ '--score': `${score.accuracy}%` } as CSSProperties}><strong>{score.accuracy}%</strong></div><div><span>{copy.accuracy}</span><h3>{verdictLabel}</h3>{score.missingWords.length > 0 ? <small>{score.missingWords.join(' · ')}</small> : null}</div></div> : null}
    </section>

    <section className="pronunciation-coach-grid">
      <article><span>{copy.focus}</span><b>{item.focus}</b><p>{pronunciationTip(language, item.id)}</p></article>
      <article><span>{copy.stress}</span><b dir="ltr" className="stress-preview">{stressWord}</b><p>{copy.mouth}</p></article>
      {item.contrast ? <article className="contrast-card"><span>{copy.contrast}</span><div dir="ltr"><b>{item.word}</b><i>↔</i><b>{item.contrast.word}</b></div></article> : null}
    </section>

    {error ? <p className="error" role="alert">{error}</p> : null}

    <div className="pronunciation-footer-actions">
      <button type="button" className="ghost" onClick={resetAttempt}><RotateCcw /> {copy.tryAgain}</button>
      <button type="button" className="primary" onClick={moveForward}>{stage === 'word' ? copy.nextSentence : copy.nextWord} <ChevronRight /></button>
    </div>

    <section className="pronunciation-note"><Sparkles /><p>{pronunciationMeasurementNote[language]}</p></section>
  </LearningShell>;
}
