import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, Target } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, ProgressBar, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { loadSkillMastery } from './cefrPersistence';
import { checkpointEligible, nextLevel, normalizeLearningLevel, type SkillMastery } from './cefrProgress';
import type { SkillName } from './adaptiveLearning';
import type { LearningLevel } from './curriculumAll';
import { directionFor, normalizeLanguage } from './languageSupport';

type Profile = {
  nativeLanguage?: string;
  explanationLanguage?: string;
  interfaceLanguage?: string;
  declaredLevel?: string;
  estimatedOverall?: string;
  currentCurriculumLevel?: string;
  placementLevel?: string;
  cefrLevel?: string;
};

const skillOrder: SkillName[] = ['reading','listening','spoken_interaction','spoken_production','writing','vocabulary','grammar','mediation'];
const labels: Record<SkillName,string> = {
  vocabulary:'Vocabulary', grammar:'Grammar', reading:'Reading', listening:'Listening', speaking:'Speaking', spoken_interaction:'Spoken interaction', spoken_production:'Spoken production', writing:'Writing', pronunciation:'Pronunciation', mediation:'Mediation',
};

export default function LevelCheckpoint() {
  const nav = useNavigate();
  const [user,setUser] = useState<User|null>(null);
  const [profile,setProfile] = useState<Profile>({});
  const [mastery,setMastery] = useState<Partial<Record<SkillName,SkillMastery>>>({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [advanced,setAdvanced] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current); setLoading(true); setError('');
      if (!current) { setLoading(false); return; }
      try {
        const [profileSnap, skillMastery] = await Promise.all([
          getDoc(doc(db,'users',current.uid)),
          loadSkillMastery(current.uid),
        ]);
        if (!active) return;
        setProfile(profileSnap.exists()?profileSnap.data() as Profile:{});
        setMastery(skillMastery);
      } catch {
        if (active) setError('Could not load your checkpoint evidence. Your saved progress was not changed.');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active=false; unsubscribe(); };
  },[]);

  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const dir = directionFor(language);
  const level: LearningLevel = normalizeLearningLevel(profile.currentCurriculumLevel || profile.placementLevel || profile.cefrLevel || 'A1');
  const gate = useMemo(() => checkpointEligible({targetLevel:level,mastery}),[level,mastery]);
  const next = nextLevel(level);
  const requiredSkills = level === 'A1' || level === 'A2' || level === 'B1' ? skillOrder.filter(skill=>skill!=='mediation') : skillOrder;
  const readyCount = requiredSkills.filter(skill=>!gate.missing.includes(skill)).length;
  const readiness = Math.round((readyCount/requiredSkills.length)*100);

  if (loading) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="CEFR CHECKPOINT" title="Checking your evidence…" /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace/>;
  if (error) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<AlertTriangle/>} tone="danger" title="Checkpoint unavailable" body={error} action={<ETButton onClick={()=>nav('/learn')}>Back to learning</ETButton>} /></LearningShell>;

  async function confirmLevel() {
    if (!user || !gate.eligible || busy) return;
    setBusy(true); setError('');
    try {
      await setDoc(doc(db,'users',user.uid),{
        stateVersion:2,
        estimatedOverall:level,
        placementLevel:level,
        currentCurriculumLevel:next || level,
        lastCheckpointLevel:level,
        lastCheckpointAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
      },{merge:true});
      setAdvanced(true);
    } catch {
      setError('Your evidence is still saved, but the checkpoint result could not be stored. Try again.');
    } finally { setBusy(false); }
  }

  if (advanced) return <LearningShell language={language} dir={dir} showDock={false} className="et-checkpoint-shell"><Surface className="et-complete-card" tone="blue"><CheckCircle2 className="et-complete-icon"/><span className="et-eyebrow">CEFR CHECKPOINT</span><h1>{level} evidence confirmed</h1><p>{next ? `Your next curriculum level is ${next}. This is an estimated English Twin CEFR profile, not an external certificate.` : 'You have reached the top curriculum level currently offered by English Twin.'}</p><ETButton onClick={()=>nav('/learn')}>Continue learning</ETButton></Surface></LearningShell>;

  return <LearningShell language={language} dir={dir} className="et-checkpoint-shell">
    <ETButton variant="ghost" onClick={()=>nav('/learn')}><ArrowLeft/> Back to Learn</ETButton>
    <PageTitle eyebrow="CEFR CHECKPOINT" title={`${level} readiness`} description="A level advances only when several skills have repeated evidence. Completing lessons alone is not enough."/>
    <Surface className="et-checkpoint-summary" tone="blue"><div><Target/><div><b>{readyCount} / {requiredSkills.length} skill gates ready</b><p>{gate.eligible ? 'You have enough evidence to confirm this level.' : 'Keep building evidence in the missing skills. You do not need to restart lower levels.'}</p></div></div><ProgressBar value={readiness}/></Surface>
    <div className="et-checkpoint-grid">{requiredSkills.map(skill=>{const item=mastery[skill];const ready=!gate.missing.includes(skill);return <Surface key={skill} className={`et-checkpoint-skill ${ready?'ready':'missing'}`}><span className="et-checkpoint-icon">{ready?<CheckCircle2/>:<LockKeyhole/>}</span><div><b>{labels[skill]}</b><p>{item?`${item.level} · ${Math.round(item.confidence*100)}% confidence · ${item.evidenceCount} evidence points`:'Not enough measured evidence yet'}</p></div></Surface>})}</div>
    <Surface className="et-checkpoint-policy"><b>English Twin level policy</b><p>Results are reported as CEFR-aligned estimated profiles. This checkpoint does not claim official external certification.</p></Surface>
    <ETButton className="et-full" disabled={!gate.eligible||busy} onClick={confirmLevel}>{busy?'Saving checkpoint…':gate.eligible?(next?`Confirm ${level} and continue to ${next}`:`Confirm ${level}`):'More skill evidence required'}</ETButton>
  </LearningShell>;
}
