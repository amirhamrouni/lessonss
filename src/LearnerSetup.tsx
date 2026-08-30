import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, ChevronLeft, ChevronRight, Languages, Target, TimerReset } from 'lucide-react';
import { auth, db } from './firebase';
import { defaultSkillLevels, SupportedLanguage, supportedLanguages } from './languageSupport';

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
        setDraft({
          nativeLanguage: (data.nativeLanguage || 'Arabic') as SupportedLanguage,
          explanationLanguage: (data.explanationLanguage || data.nativeLanguage || 'Arabic') as SupportedLanguage,
          learningGoal: data.learningGoal || 'Daily conversation',
          cefrLevel: data.cefrLevel || 'A1',
          dailyTargetMinutes: data.dailyTargetMinutes || 15,
        });
      }
    } finally { setLoading(false); }
  }), []);

  if (loading) return <main className="center"><p>Preparing your learning setup…</p></main>;
  if (!user) return <Navigate to="/welcome" replace />;

  const pages = [
    <section key="language" className="setup-panel">
      <div className="setup-icon"><Languages /></div>
      <span className="eyebrow">01 · YOUR LANGUAGE</span>
      <h1>What language should your Twin use to teach you?</h1>
      <p>Instructions, hints and explanations use this language. Your answers stay in English.</p>
      <div className="language-grid">
        {supportedLanguages.filter(item => item.value !== 'English').map(item => (
          <button key={item.value} className={draft.nativeLanguage === item.value ? 'selected-language' : ''} onClick={() => setDraft({ ...draft, nativeLanguage: item.value, explanationLanguage: item.value })}>
            <b>{item.nativeLabel}</b><small>{item.label}</small>{draft.nativeLanguage === item.value && <Check />}
          </button>
        ))}
      </div>
    </section>,
    <section key="goal" className="setup-panel">
      <div className="setup-icon"><Target /></div>
      <span className="eyebrow">02 · OUTCOME</span>
      <h1>What should English unlock for you?</h1>
      <div className="choice-stack">{['Daily conversation','Work','Travel','Study','Moving abroad','Job interview'].map(goal => <button key={goal} className={draft.learningGoal === goal ? 'active' : ''} onClick={() => setDraft({ ...draft, learningGoal: goal })}>{goal}{draft.learningGoal === goal && <Check />}</button>)}</div>
    </section>,
    <section key="level" className="setup-panel">
      <div className="setup-icon"><TimerReset /></div>
      <span className="eyebrow">03 · STARTING POINT</span>
      <h1>Set your starting level and daily rhythm.</h1>
      <p>The placement test can update each skill separately later.</p>
      <div className="level-row">{['A1','A2','B1','B2','C1'].map(level => <button key={level} className={draft.cefrLevel === level ? 'active' : ''} onClick={() => setDraft({ ...draft, cefrLevel: level })}>{level}</button>)}</div>
      <div className="minutes-row">{[5,10,15,20,30,45].map(minutes => <button key={minutes} className={draft.dailyTargetMinutes === minutes ? 'active' : ''} onClick={() => setDraft({ ...draft, dailyTargetMinutes: minutes })}>{minutes} min</button>)}</div>
    </section>,
  ];

  async function finish() {
    setBusy(true);
    try {
      await setDoc(doc(db, 'users', user!.uid), {
        nativeLanguage: draft.nativeLanguage,
        explanationLanguage: draft.explanationLanguage,
        interfaceLanguage: draft.nativeLanguage,
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

  return <main className="center setup-v2"><div className="setup-shell">
    <div className="setup-progress">{pages.map((_, index) => <i key={index} className={index <= step ? 'active' : ''} />)}</div>
    {pages[step]}
    <div className="setup-actions">
      <button className="secondary" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}><ChevronLeft /> Back</button>
      <button className="primary lime" disabled={busy} onClick={() => step < pages.length - 1 ? setStep(step + 1) : void finish()}>{busy ? 'Saving…' : step < pages.length - 1 ? <>Continue <ChevronRight /></> : 'Build my Twin'}</button>
    </div>
  </div></main>;
}
