import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Languages, LoaderCircle, Target, TimerReset } from 'lucide-react';
import { ETButton, LearningShell, StatusState } from './ui/LearningUI';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage, supportedLanguages } from './languageSupport';
import { defaultCEFRSkillLevels, normalizeLearningLevel } from './cefrProgress';
import { setupSupportCopy } from './setupSupportCopy';

type Draft = {
  nativeLanguage: SupportedLanguage;
  explanationLanguage: SupportedLanguage;
  learningGoal: string;
  cefrLevel: string;
  dailyTargetMinutes: number;
};

type SetupStateCopy = {
  loadError: string;
  loadErrorBody: string;
  retry: string;
  saveError: string;
};

const initial: Draft = {
  nativeLanguage: 'Arabic',
  explanationLanguage: 'Arabic',
  learningGoal: 'Daily conversation',
  cefrLevel: 'A1',
  dailyTargetMinutes: 15,
};

const goalValues = ['Daily conversation', 'Work', 'Travel', 'Study', 'Moving abroad', 'Job interview'];

const stateCopy: Record<SupportedLanguage, SetupStateCopy> = {
  English: {
    loadError: 'Couldn’t load your setup',
    loadErrorBody: 'Your existing learner settings were not changed. Check the connection and try again before continuing.',
    retry: 'Try again',
    saveError: 'Your choices are still here, but they could not be saved. Check the connection and try Finish again.',
  },
  Arabic: {
    loadError: 'تعذّر تحميل إعداداتك',
    loadErrorBody: 'لم تتغيّر إعداداتك المحفوظة. تحقق من الاتصال وحاول مرة أخرى قبل المتابعة.',
    retry: 'حاول مرة أخرى',
    saveError: 'اختياراتك ما زالت موجودة، لكن تعذّر حفظها. تحقق من الاتصال واضغط إنهاء مرة أخرى.',
  },
  Dutch: {
    loadError: 'Je instellingen konden niet worden geladen',
    loadErrorBody: 'Je bestaande leerinstellingen zijn niet gewijzigd. Controleer de verbinding en probeer opnieuw.',
    retry: 'Opnieuw proberen',
    saveError: 'Je keuzes staan er nog, maar konden niet worden opgeslagen. Controleer de verbinding en probeer Voltooien opnieuw.',
  },
  French: {
    loadError: 'Impossible de charger tes réglages',
    loadErrorBody: 'Tes réglages existants n’ont pas été modifiés. Vérifie la connexion et réessaie avant de continuer.',
    retry: 'Réessayer',
    saveError: 'Tes choix sont toujours là, mais ils n’ont pas pu être enregistrés. Vérifie la connexion et réessaie.',
  },
  German: {
    loadError: 'Deine Einrichtung konnte nicht geladen werden',
    loadErrorBody: 'Deine vorhandenen Lerneinstellungen wurden nicht verändert. Prüfe die Verbindung und versuche es erneut.',
    retry: 'Erneut versuchen',
    saveError: 'Deine Auswahl ist noch vorhanden, konnte aber nicht gespeichert werden. Prüfe die Verbindung und versuche es erneut.',
  },
  Spanish: {
    loadError: 'No se pudo cargar tu configuración',
    loadErrorBody: 'Tus ajustes existentes no cambiaron. Revisa la conexión y vuelve a intentarlo antes de continuar.',
    retry: 'Intentar de nuevo',
    saveError: 'Tus elecciones siguen aquí, pero no pudieron guardarse. Revisa la conexión y vuelve a pulsar Finalizar.',
  },
};

export default function LearnerSetup() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setLoading(true);
      setLoadError(false);
      if (!current) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', current.uid));
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data();
          const nativeLanguage = normalizeLanguage(data.nativeLanguage || data.interfaceLanguage || 'Arabic');
          const explanationLanguage = normalizeLanguage(data.explanationLanguage || nativeLanguage || data.interfaceLanguage || 'Arabic');
          setDraft({
            nativeLanguage,
            explanationLanguage,
            learningGoal: data.learningGoal || 'Daily conversation',
            cefrLevel: data.declaredLevel || data.cefrLevel || 'A1',
            dailyTargetMinutes: data.dailyTargetMinutes || 15,
          });
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadKey]);

  const language = normalizeLanguage(draft.explanationLanguage || draft.nativeLanguage);
  const copy = setupSupportCopy[language];
  const state = stateCopy[language];
  const dir = directionFor(language);
  const selectedLanguage = supportedLanguages.find(item => item.value === language) || supportedLanguages.find(item => item.value === 'English')!;

  if (loading) return <LearningShell language={language} dir={dir} showDock={false} pageClassName="setup-status-page"><StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title={copy.loading} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <LearningShell language={language} dir={dir} showDock={false} pageClassName="setup-status-page"><StatusState icon={<AlertTriangle />} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{state.retry}</ETButton>} /></LearningShell>;

  const pages = [
    <section key="language" className="setup-panel" dir={dir}>
      <div className="setup-icon"><Languages /></div>
      <span className="eyebrow">{copy.languageEyebrow}</span>
      <h1>{copy.languageTitle}</h1>
      <p>{copy.languageBody}</p>
      <div className="language-grid">
        {supportedLanguages.filter(item => item.value !== 'English').map(item => (
          <button type="button" key={item.value} className={draft.nativeLanguage === item.value ? 'selected-language' : ''} aria-pressed={draft.nativeLanguage === item.value} onClick={() => { setDraft({ ...draft, nativeLanguage: item.value, explanationLanguage: item.value }); setSaveError(''); }}>
            <b>{item.nativeLabel}</b><small>{item.label}</small>{draft.nativeLanguage === item.value && <Check />}
          </button>
        ))}
      </div>
      <div className="et-language-pair compact" aria-label={`${selectedLanguage.label} support to English target`}>
        <div><span>Support language</span><strong>{selectedLanguage.nativeLabel}</strong><p>Explanations and guidance use this language.</p></div>
        <div><span>Fixed learning target</span><strong>English</strong><p>You are always learning English. The selected language only helps explain it.</p></div>
      </div>
    </section>,
    <section key="goal" className="setup-panel" dir={dir}>
      <div className="setup-icon"><Target /></div>
      <span className="eyebrow">{copy.goalEyebrow}</span>
      <h1>{copy.goalTitle}</h1>
      <div className="choice-stack">{goalValues.map(value => <button type="button" key={value} aria-pressed={draft.learningGoal === value} className={draft.learningGoal === value ? 'active' : ''} onClick={() => { setDraft({ ...draft, learningGoal: value }); setSaveError(''); }}>{copy.goals[value] || value}{draft.learningGoal === value && <Check />}</button>)}</div>
    </section>,
    <section key="level" className="setup-panel" dir={dir}>
      <div className="setup-icon"><TimerReset /></div>
      <span className="eyebrow">{copy.levelEyebrow}</span>
      <h1>{copy.levelTitle}</h1>
      <p>{copy.levelBody}</p>
      <div className="level-row">{['A1','A2','B1','B2','C1'].map(level => <button type="button" key={level} aria-pressed={draft.cefrLevel === level} className={draft.cefrLevel === level ? 'active' : ''} onClick={() => { setDraft({ ...draft, cefrLevel: level }); setSaveError(''); }}>{level}</button>)}</div>
      <div className="minutes-row">{[5,10,15,20,30,45].map(minutes => <button type="button" key={minutes} aria-pressed={draft.dailyTargetMinutes === minutes} className={draft.dailyTargetMinutes === minutes ? 'active' : ''} onClick={() => { setDraft({ ...draft, dailyTargetMinutes: minutes }); setSaveError(''); }}>{minutes} {copy.minute}</button>)}</div>
    </section>,
  ];

  async function finish() {
    const currentUser = user;
    if (!currentUser || busy) return;
    setBusy(true);
    setSaveError('');
    try {
      const selectedLevel = normalizeLearningLevel(draft.cefrLevel);
      await setDoc(doc(db, 'users', currentUser.uid), {
        nativeLanguage: draft.nativeLanguage,
        explanationLanguage: draft.explanationLanguage,
        instructionLanguage: draft.nativeLanguage,
        interfaceLanguage: draft.nativeLanguage,
        targetLanguage: 'English',
        learningLanguage: 'English',
        learningGoal: draft.learningGoal,
        cefrLevel: selectedLevel,
        declaredLevel: selectedLevel,
        estimatedOverall: selectedLevel,
        currentCurriculumLevel: selectedLevel,
        cefrStateVersion: 2,
        dailyTargetMinutes: draft.dailyTargetMinutes,
        skillLevels: defaultCEFRSkillLevels(selectedLevel),
        immersionMode: 'adaptive',
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      nav('/');
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code || 'unknown') : 'unknown';
      console.error('Learner setup Firestore save failed', code);
      setSaveError(state.saveError);
    } finally {
      setBusy(false);
    }
  }

  return <main className="center setup-v2" dir={dir}><div className="setup-shell" aria-busy={busy}>
    <div className="setup-progress" role="progressbar" aria-label={`${step + 1} / ${pages.length}`} aria-valuemin={1} aria-valuemax={pages.length} aria-valuenow={step + 1}>{pages.map((_, index) => <i key={index} className={index <= step ? 'active' : ''} />)}</div>
    {pages[step]}
    {saveError ? <p className="error" role="alert">{saveError}</p> : null}
    <div className="setup-actions">
      <button type="button" className="secondary" disabled={step === 0 || busy} onClick={() => { setStep(step - 1); setSaveError(''); }}><ChevronLeft /> {copy.back}</button>
      <button type="button" className="primary lime" disabled={busy} onClick={() => step < pages.length - 1 ? (setStep(step + 1), setSaveError('')) : void finish()}>{busy ? copy.saving : step < pages.length - 1 ? <>{copy.continue} <ChevronRight /></> : copy.finish}</button>
    </div>
  </div></main>;
}
