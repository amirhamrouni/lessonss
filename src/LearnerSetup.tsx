import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, ChevronLeft, ChevronRight, Languages, Target, TimerReset } from 'lucide-react';
import { auth, db } from './firebase';
import { defaultSkillLevels, directionFor, normalizeLanguage, SupportedLanguage, supportedLanguages } from './languageSupport';
import { setupSupportCopy } from './setupSupportCopy';

type Draft = {
  nativeLanguage: SupportedLanguage;
  explanationLanguage: SupportedLanguage;
  learningGoal: string;
  cefrLevel: string;
  dailyTargetMinutes: number;
};

const initial: Draft = {
  nativeLanguage: 'Arabic',
  explanationLanguage: 'Arabic',
  learningGoal: 'Daily conversation',
  cefrLevel: 'A1',
  dailyTargetMinutes: 15,
};

const goalValues = ['Daily conversation', 'Work', 'Travel', 'Study', 'Moving abroad', 'Job interview'];

export default function LearnerSetup() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const snap = await getDoc(doc(db, 'users', current.uid));
      if (snap.exists()) {
        const data = snap.data();
        const nativeLanguage = normalizeLanguage(data.nativeLanguage || data.interfaceLanguage || 'Arabic');
        const explanationLanguage = normalizeLanguage(data.explanationLanguage || nativeLanguage || data.interfaceLanguage || 'Arabic');
        setDraft({
          nativeLanguage,
          explanationLanguage,
          learningGoal: data.learningGoal || 'Daily conversation',
          cefrLevel: data.cefrLevel || 'A1',
          dailyTargetMinutes: data.dailyTargetMinutes || 15,
        });
      }
    } finally { setLoading(false); }
  }), []);

  const language = normalizeLanguage(draft.explanationLanguage || draft.nativeLanguage);
  const copy = setupSupportCopy[language];
  const dir = directionFor(language);

  if (loading) return <main className="center" dir={dir}><p>{copy.loading}</p></main>;
  if (!user) return <Navigate to="/welcome" replace />;

  const pages = [
    <section key="language" className="setup-panel" dir={dir}>
      <div className="setup-icon"><Languages /></div>
      <span className="eyebrow">{copy.languageEyebrow}</span>
      <h1>{copy.languageTitle}</h1>
      <p>{copy.languageBody}</p>
      <div className="language-grid">
        {supportedLanguages.filter(item => item.value !== 'English').map(item => (
          <button key={item.value} className={draft.nativeLanguage === item.value ? 'selected-language' : ''} onClick={() => setDraft({ ...draft, nativeLanguage: item.value, explanationLanguage: item.value })}>
            <b>{item.nativeLabel}</b><small>{item.label}</small>{draft.nativeLanguage === item.value && <Check />}
          </button>
        ))}
      </div>
    </section>,
    <section key="goal" className="setup-panel" dir={dir}>
      <div className="setup-icon"><Target /></div>
      <span className="eyebrow">{copy.goalEyebrow}</span>
      <h1>{copy.goalTitle}</h1>
      <div className="choice-stack">{goalValues.map(value => <button key={value} className={draft.learningGoal === value ? 'active' : ''} onClick={() => setDraft({ ...draft, learningGoal: value })}>{copy.goals[value] || value}{draft.learningGoal === value && <Check />}</button>)}</div>
    </section>,
    <section key="level" className="setup-panel" dir={dir}>
      <div className="setup-icon"><TimerReset /></div>
      <span className="eyebrow">{copy.levelEyebrow}</span>
      <h1>{copy.levelTitle}</h1>
      <p>{copy.levelBody}</p>
      <div className="level-row">{['A1','A2','B1','B2','C1'].map(level => <button key={level} className={draft.cefrLevel === level ? 'active' : ''} onClick={() => setDraft({ ...draft, cefrLevel: level })}>{level}</button>)}</div>
      <div className="minutes-row">{[5,10,15,20,30,45].map(minutes => <button key={minutes} className={draft.dailyTargetMinutes === minutes ? 'active' : ''} onClick={() => setDraft({ ...draft, dailyTargetMinutes: minutes })}>{minutes} {copy.minute}</button>)}</div>
    </section>,
  ];

  async function finish() {
    setBusy(true);
    try {
      await setDoc(doc(db, 'users', user!.uid), {
        nativeLanguage: draft.nativeLanguage,
        explanationLanguage: draft.explanationLanguage,
        instructionLanguage: draft.nativeLanguage,
        interfaceLanguage: draft.nativeLanguage,
        targetLanguage: 'English',
        learningLanguage: 'English',
        learningGoal: draft.learningGoal,
        cefrLevel: draft.cefrLevel,
        dailyTargetMinutes: draft.dailyTargetMinutes,
        skillLevels: defaultSkillLevels(draft.cefrLevel),
        immersionMode: 'adaptive',
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      nav('/');
    } finally { setBusy(false); }
  }

  return <main className="center setup-v2" dir={dir}><div className="setup-shell">
    <div className="setup-progress">{pages.map((_, index) => <i key={index} className={index <= step ? 'active' : ''} />)}</div>
    {pages[step]}
    <div className="setup-actions">
      <button className="secondary" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}><ChevronLeft /> {copy.back}</button>
      <button className="primary lime" disabled={busy} onClick={() => step < pages.length - 1 ? setStep(step + 1) : void finish()}>{busy ? copy.saving : step < pages.length - 1 ? <>{copy.continue} <ChevronRight /></> : copy.finish}</button>
    </div>
  </div></main>;
}
