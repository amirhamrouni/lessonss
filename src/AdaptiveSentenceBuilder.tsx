import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { ETButton, LearningShell, StatusState } from './ui/LearningUI';
import { auth, db } from './firebase';
import { builderPriority, isBuilderCorrect, MistakeSignal, rankSentenceItems, sentenceItems } from './sentenceBuilder';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
import { modeSupportCopy } from './modeSupportCopy';
import { prioritizeReviewFromMistake } from './review';

type BuilderStateCopy = {
  loadError: string;
  loadErrorBody: string;
  retry: string;
  saveError: string;
  retrySave: string;
  noItemsBody: string;
};

const builderStateCopy: Record<SupportedLanguage, BuilderStateCopy> = {
  English: {
    loadError: 'Couldn’t load your sentence practice',
    loadErrorBody: 'Your saved mistakes and progress were not changed. Check the connection and try again.',
    retry: 'Try again',
    saveError: 'Your answer is still visible, but this mistake could not be saved for future practice.',
    retrySave: 'Retry save',
    noItemsBody: 'There are no sentence-building items available for your current course data.',
  },
  Arabic: {
    loadError: 'تعذّر تحميل تدريب بناء الجمل',
    loadErrorBody: 'لم تتغيّر أخطاؤك أو بيانات تقدّمك المحفوظة. تحقق من الاتصال وحاول مرة أخرى.',
    retry: 'حاول مرة أخرى',
    saveError: 'إجابتك ما زالت ظاهرة، لكن تعذّر حفظ هذا الخطأ للتدريب القادم.',
    retrySave: 'أعد محاولة الحفظ',
    noItemsBody: 'لا توجد تمارين بناء جمل متاحة حاليًا ضمن بيانات دورتك.',
  },
  Dutch: {
    loadError: 'Je zinoefening kon niet worden geladen',
    loadErrorBody: 'Je opgeslagen fouten en voortgang zijn niet gewijzigd. Controleer de verbinding en probeer opnieuw.',
    retry: 'Opnieuw proberen',
    saveError: 'Je antwoord blijft zichtbaar, maar deze fout kon niet worden opgeslagen voor latere oefening.',
    retrySave: 'Opslaan opnieuw proberen',
    noItemsBody: 'Er zijn momenteel geen zinsbouwoefeningen beschikbaar voor je cursusgegevens.',
  },
  French: {
    loadError: 'Impossible de charger ton exercice de phrases',
    loadErrorBody: 'Tes erreurs et ta progression enregistrées n’ont pas été modifiées. Vérifie la connexion et réessaie.',
    retry: 'Réessayer',
    saveError: 'Ta réponse reste visible, mais cette erreur n’a pas pu être enregistrée pour un futur entraînement.',
    retrySave: 'Réessayer l’enregistrement',
    noItemsBody: 'Aucun exercice de construction de phrase n’est disponible pour tes données de cours actuelles.',
  },
  German: {
    loadError: 'Dein Satztraining konnte nicht geladen werden',
    loadErrorBody: 'Deine gespeicherten Fehler und Fortschritte wurden nicht verändert. Prüfe die Verbindung und versuche es erneut.',
    retry: 'Erneut versuchen',
    saveError: 'Deine Antwort bleibt sichtbar, aber dieser Fehler konnte nicht für späteres Training gespeichert werden.',
    retrySave: 'Speichern erneut versuchen',
    noItemsBody: 'Für deine aktuellen Kursdaten sind derzeit keine Satzbauübungen verfügbar.',
  },
  Spanish: {
    loadError: 'No se pudo cargar tu práctica de frases',
    loadErrorBody: 'Tus errores y tu progreso guardados no cambiaron. Revisa la conexión y vuelve a intentarlo.',
    retry: 'Intentar de nuevo',
    saveError: 'Tu respuesta sigue visible, pero este error no pudo guardarse para prácticas futuras.',
    retrySave: 'Reintentar guardado',
    noItemsBody: 'No hay ejercicios de construcción de frases disponibles para los datos actuales de tu curso.',
  },
};

function Frame({ children, language, showDock = true }: { children: ReactNode; language?: string; showDock?: boolean }) {
  const normalized = normalizeLanguage(language || 'English');
  return <LearningShell language={normalized} dir={directionFor(normalized)} pageClassName="mode-page" showDock={showDock}>{children}</LearningShell>;
}

export default function AdaptiveSentenceBuilder() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [mistakes, setMistakes] = useState<MistakeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setLoading(true);
      setLoadError(false);
      if (!current) {
        setProfile({});
        setMistakes([]);
        setLoading(false);
        return;
      }
      try {
        const [profileSnap, mistakesSnap] = await Promise.all([
          getDoc(doc(db, 'users', current.uid)),
          getDocs(collection(db, 'users', current.uid, 'mistakes')),
        ]);
        if (!active) return;
        setProfile(profileSnap.exists() ? profileSnap.data() : {});
        setMistakes(mistakesSnap.docs.map(item => item.data() as MistakeSignal));
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [reloadKey]);

  const ranked = useMemo(() => rankSentenceItems(sentenceItems, mistakes), [mistakes]);
  const item = ranked[index % Math.max(1, ranked.length)];
  const language = normalizeLanguage(profile?.explanationLanguage || profile?.nativeLanguage || profile?.interfaceLanguage || 'English');
  const dir = directionFor(language);
  const copy = modeSupportCopy[language];
  const state = builderStateCopy[language];

  if (loading) return <Frame language={language} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title={copy.loadingPractice} /></Frame>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <Frame language={language}><StatusState icon={<AlertTriangle />} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{state.retry}</ETButton>} /></Frame>;
  if (!item) return <Frame language={language}><StatusState icon={<Sparkles />} title={copy.noSentence} body={state.noItemsBody} action={<ETButton onClick={() => nav('/practice')}>{copy.backPractice}</ETButton>} /></Frame>;

  const remaining = item.words.filter((word, i) => {
    const usedBefore = built.filter(x => x === word).length;
    const occurrence = item.words.slice(0, i + 1).filter(x => x === word).length;
    return occurrence > usedBefore;
  });
  const priority = builderPriority(item, mistakes);

  function clearAttempt() {
    setBuilt([]);
    setResult(null);
    setSaveError('');
  }

  async function check() {
    if (saving) return;
    setSaveError('');
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
      setMistakes(current => [...current, {
        lessonId: item.sourceLessonId,
        original: built.join(' '),
        corrected: item.answerText,
        timesSeen: 1,
        status: 'active',
      }]);
    } catch {
      setSaveError(state.saveError);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    setIndex(current => (current + 1) % ranked.length);
    clearAttempt();
  }

  return <Frame language={language}>
    <div dir={dir}>
      <button type="button" className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button>
      <header><div><span className="eyebrow">ADAPTIVE OUTPUT</span><h1>{copy.builderTitle}</h1><p>{copy.builderIntro}</p></div></header>
      <section className="builder-card" dir={dir} aria-busy={saving}>
        <span className="mode-kicker">{priority > 0 ? copy.mistakeFocus : copy.foundationPractice} · {index + 1}/{ranked.length}</span>
        <h2>{item.prompt}</h2>
        <div className="native-instruction">{copy.arrangeWords}</div>
        <div className="built-zone" dir="ltr">{built.length ? built.map((word, i) => <button type="button" key={`${word}-${i}`} disabled={saving} onClick={() => { setBuilt(built.filter((_, j) => j !== i)); setResult(null); setSaveError(''); }}>{word}</button>) : <span>{copy.tapWords}</span>}</div>
        <div className="word-bank" dir="ltr">{remaining.map((word, i) => <button type="button" key={`${word}-${i}`} disabled={Boolean(result) || saving} onClick={() => { setBuilt([...built, word]); setResult(null); setSaveError(''); }}>{word}</button>)}</div>
        {result ? <div className={`builder-feedback ${result}`} role="status">{result === 'ok' ? copy.correctOrder : copy.tryAgainTarget(item.answerText)}</div> : null}
        {saveError ? <div className="builder-save-warning" role="alert"><p className="error">{saveError}</p><ETButton variant="soft" disabled={saving} onClick={() => void check()}>{saving ? copy.saving : state.retrySave}</ETButton></div> : null}
        <div className="builder-actions">
          <button type="button" disabled={saving} onClick={clearAttempt}><RotateCcw /> {copy.reset}</button>
          {result === 'ok'
            ? <button type="button" className="solid" onClick={next}><Sparkles /> {copy.next}</button>
            : result === 'bad'
              ? <button type="button" className="solid" disabled={saving} onClick={clearAttempt}>{copy.tryAgain}</button>
              : <button type="button" className="solid" disabled={!built.length || saving} onClick={() => void check()}>{saving ? copy.saving : copy.check}</button>}
        </div>
      </section>
    </div>
  </Frame>;
}
