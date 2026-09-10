import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { deleteUser, onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { AlertTriangle, BrainCircuit, ChevronRight, Languages, LoaderCircle, LogOut, Save, ShieldCheck, Target, Trash2 } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, SectionTitle, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage, supportedLanguages } from './languageSupport';

type LearnerProfile = {
  displayName?: string;
  interfaceLanguage?: SupportedLanguage;
  nativeLanguage?: SupportedLanguage;
  explanationLanguage?: SupportedLanguage;
  targetLanguage?: 'English';
  learningLanguage?: 'English';
  learningGoal?: string;
  dailyTargetMinutes?: number;
  cefrLevel?: string;
  placementLevel?: string;
  estimatedOverall?: string;
  currentCurriculumLevel?: string;
  onboardingCompleted?: boolean;
};
type Mistake = { id:string; original?:string; corrected?:string; reason?:string; timesSeen?:number; source?:'lesson'|'twin-coach'|string; skill?:string; latestExample?:string; status?:string; lastSeenAt?:{toMillis?:()=>number} };
const goals=['Daily conversation','Work','Travel','Study','Moving abroad'];
const rhythms=[5,10,15,20,30];
const userSubcollections=['lessonProgress','reviewCards','reviewLogs','mistakes','twin','learningSessions','assessments','attempts','writingResponses','evaluations','skillEvidence','mastery'];
const htmlLanguageTags:Record<SupportedLanguage,string>={English:'en',Arabic:'ar',Dutch:'nl',French:'fr',German:'de',Spanish:'es'};
const stateCopy:Record<SupportedLanguage,{loading:string;loadError:string;loadErrorBody:string;retry:string;saved:string;saveError:string}>={
  English:{loading:'Loading your profile…',loadError:'Couldn’t load your profile',loadErrorBody:'No settings were changed. Check the connection and try again.',retry:'Try again',saved:'Profile saved',saveError:'Could not save your profile. Check your connection and try again.'},
  Arabic:{loading:'نحمّل ملفك…',loadError:'تعذّر تحميل ملفك',loadErrorBody:'لم يتم تغيير أي إعداد. تحقق من الاتصال وحاول مرة أخرى.',retry:'حاول مرة أخرى',saved:'تم حفظ الملف',saveError:'تعذّر حفظ الملف. تحقق من الاتصال وحاول مرة أخرى.'},
  Dutch:{loading:'Je profiel wordt geladen…',loadError:'Je profiel kon niet worden geladen',loadErrorBody:'Er zijn geen instellingen gewijzigd. Controleer je verbinding en probeer opnieuw.',retry:'Opnieuw proberen',saved:'Profiel opgeslagen',saveError:'Je profiel kon niet worden opgeslagen. Controleer je verbinding en probeer opnieuw.'},
  French:{loading:'Chargement de ton profil…',loadError:'Impossible de charger ton profil',loadErrorBody:'Aucun réglage n’a été modifié. Vérifie la connexion et réessaie.',retry:'Réessayer',saved:'Profil enregistré',saveError:'Impossible d’enregistrer ton profil. Vérifie la connexion et réessaie.'},
  German:{loading:'Dein Profil wird geladen…',loadError:'Dein Profil konnte nicht geladen werden',loadErrorBody:'Es wurden keine Einstellungen geändert. Prüfe die Verbindung und versuche es erneut.',retry:'Erneut versuchen',saved:'Profil gespeichert',saveError:'Dein Profil konnte nicht gespeichert werden. Prüfe die Verbindung und versuche es erneut.'},
  Spanish:{loading:'Cargando tu perfil…',loadError:'No se pudo cargar tu perfil',loadErrorBody:'No se cambió ninguna configuración. Revisa la conexión y vuelve a intentarlo.',retry:'Intentar de nuevo',saved:'Perfil guardado',saveError:'No se pudo guardar tu perfil. Revisa la conexión y vuelve a intentarlo.'},
};
async function deleteCollectionDocuments(uid:string,name:string){const snapshot=await getDocs(collection(db,'users',uid,name));const docs=snapshot.docs;for(let offset=0;offset<docs.length;offset+=400){const batch=writeBatch(db);docs.slice(offset,offset+400).forEach(item=>batch.delete(item.ref));await batch.commit();}}
async function deleteLearnerData(uid:string){for(const name of userSubcollections)await deleteCollectionDocuments(uid,name);await Promise.all([deleteDoc(doc(db,'learningProfiles',uid)),deleteDoc(doc(db,'users',uid))]);}
function errorCode(error:unknown){return typeof error==='object'&&error!==null&&'code' in error?String((error as {code?:unknown}).code||'unknown'):'unknown';}

export function ProfileHub(){
  const nav=useNavigate();const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<LearnerProfile>({});const[draft,setDraft]=useState<LearnerProfile>({});const[loading,setLoading]=useState(true);const[loadError,setLoadError]=useState(false);const[reloadKey,setReloadKey]=useState(0);const[saving,setSaving]=useState(false);const[deleting,setDeleting]=useState(false);const[confirmDelete,setConfirmDelete]=useState(false);const[notice,setNotice]=useState('');const[noticeOk,setNoticeOk]=useState(false);
  useEffect(()=>{const unsubscribe=onAuthStateChanged(auth,async current=>{setUser(current);setLoading(true);setLoadError(false);if(!current){setLoading(false);return;}try{const snap=await getDoc(doc(db,'users',current.uid));const data=snap.exists()?snap.data() as LearnerProfile:{};const normalized:LearnerProfile={displayName:data.displayName||current.displayName||current.email?.split('@')[0]||'Learner',interfaceLanguage:data.interfaceLanguage||data.explanationLanguage||data.nativeLanguage||'English',nativeLanguage:data.nativeLanguage||data.explanationLanguage||'Arabic',explanationLanguage:data.explanationLanguage||data.nativeLanguage||data.interfaceLanguage||'Arabic',targetLanguage:'English',learningLanguage:'English',learningGoal:data.learningGoal||'Daily conversation',dailyTargetMinutes:data.dailyTargetMinutes||15,cefrLevel:data.cefrLevel||'A1',placementLevel:data.placementLevel,estimatedOverall:data.estimatedOverall,currentCurriculumLevel:data.currentCurriculumLevel,onboardingCompleted:data.onboardingCompleted};setProfile(normalized);setDraft(normalized);}catch{setLoadError(true);}finally{setLoading(false);}});return unsubscribe;},[reloadKey]);
  const support=normalizeLanguage(draft.explanationLanguage||draft.nativeLanguage||draft.interfaceLanguage||'English');const dir=directionFor(support);const state=stateCopy[support];const supportMeta=supportedLanguages.find(item=>item.value===support)||supportedLanguages.find(item=>item.value==='English')!;
  if(loading)return <LearningShell language={support} dir={dir} showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="ENGLISH TWIN" title={state.loading}/></LearningShell>;
  if(!user)return <Navigate to="/welcome" replace/>;
  if(loadError)return <LearningShell language={support} dir={dir}><StatusState icon={<AlertTriangle/>} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={()=>setReloadKey(value=>value+1)}>{state.retry}</ETButton>}/></LearningShell>;
  function selectSupportLanguage(value:SupportedLanguage){setDraft(current=>({...current,nativeLanguage:value,explanationLanguage:value,interfaceLanguage:value,targetLanguage:'English',learningLanguage:'English'}));setNotice('');setNoticeOk(false);}
  async function save(event:FormEvent){
    event.preventDefault();if(!user||saving)return;setSaving(true);setNotice('');setNoticeOk(false);
    const selectedSupport=normalizeLanguage(draft.explanationLanguage||draft.nativeLanguage||draft.interfaceLanguage||'English');
    const next:LearnerProfile={...draft,displayName:draft.displayName?.trim()||'Learner',nativeLanguage:selectedSupport,explanationLanguage:selectedSupport,interfaceLanguage:selectedSupport,targetLanguage:'English',learningLanguage:'English',dailyTargetMinutes:Number(draft.dailyTargetMinutes||15)};
    try{
      await setDoc(doc(db,'users',user.uid),{...next,uid:user.uid,email:user.email,targetLanguage:'English',learningLanguage:'English',updatedAt:serverTimestamp()},{merge:true});
      try{await updateProfile(user,{displayName:next.displayName||'Learner'});}catch(error){console.warn('Auth display-name sync skipped after profile save',errorCode(error));}
      setProfile(next);setDraft(next);document.documentElement.lang=htmlLanguageTags[selectedSupport];document.documentElement.dir=directionFor(selectedSupport);setNotice(stateCopy[selectedSupport].saved);setNoticeOk(true);
    }catch(error){console.error('Profile Firestore save failed',errorCode(error));setNotice(stateCopy[selectedSupport].saveError);setNoticeOk(false);}finally{setSaving(false);}
  }
  async function removeAccount(){if(!user||deleting)return;setNotice('');setNoticeOk(false);setDeleting(true);try{const token=await user.getIdTokenResult(true);const authAgeMs=Date.now()-new Date(token.authTime).getTime();if(!Number.isFinite(authAgeMs)||authAgeMs>5*60*1000){setNotice('For security, sign out and sign in again before deleting your account. No data was deleted.');setConfirmDelete(false);return;}await deleteLearnerData(user.uid);await deleteUser(user);localStorage.removeItem('english-twin-voice-consent-v1');localStorage.removeItem('english-twin-guided-speech-consent-v1');nav('/welcome',{replace:true});}catch(error){const message=error instanceof Error?error.message:'';if(message.includes('requires-recent-login'))setNotice('Sign out and sign in again, then retry account deletion.');else setNotice('Account deletion could not be completed. Please retry.');}finally{setDeleting(false);}}
  const measuredLevel=draft.currentCurriculumLevel||draft.estimatedOverall||draft.placementLevel||draft.cefrLevel||'A1';
  return <LearningShell language={support} dir={dir} className="et-profile-shell">
    <PageTitle eyebrow="LEARNER PROFILE" title={profile.displayName||'Learner'} description={user.email||''}/>
    <Surface className="et-profile-overview" tone="blue"><div className="et-profile-avatar">{(profile.displayName||'L').slice(0,1).toUpperCase()}</div><div><span>Current curriculum level</span><h2>{measuredLevel}</h2><p>{draft.learningGoal||'Daily conversation'} · {draft.dailyTargetMinutes||15} min/day</p></div></Surface>
    <form className="et-profile-form" onSubmit={save}>
      <Surface><SectionTitle title="Your learning setup" meta="Identity"/><label className="et-field">Name<input value={draft.displayName||''} onChange={e=>setDraft({...draft,displayName:e.target.value})} maxLength={60}/></label></Surface>
      <Surface><SectionTitle title="Your language → English" meta="Languages"/><div className="et-language-pair compact"><div><span>Your support language</span><strong>{supportMeta.nativeLabel}</strong><p>Menus, instructions, hints and explanations use this language.</p></div><div><span>Language you are learning</span><strong>English</strong><p>English is the fixed target language across lessons, practice, speaking and Twin Coach.</p></div></div><label className="et-field">I speak / explain English to me in<select value={support} onChange={e=>selectSupportLanguage(e.target.value as SupportedLanguage)}>{supportedLanguages.map(language=><option key={language.value} value={language.value}>{language.nativeLabel} — {language.label}</option>)}</select></label><div className="et-inline-info"><Languages/><div><b>{supportMeta.nativeLabel} → English</b><small>A French, Dutch, Arabic, German or Spanish learner uses their own language for support while learning English — never the reverse.</small></div></div></Surface>
      <Surface><SectionTitle title="Goal and daily rhythm" meta="Study plan"/><label className="et-field">Learning goal<select value={draft.learningGoal||'Daily conversation'} onChange={e=>setDraft({...draft,learningGoal:e.target.value})}>{goals.map(goal=><option key={goal}>{goal}</option>)}</select></label><label className="et-field">Daily target<select value={draft.dailyTargetMinutes||15} onChange={e=>setDraft({...draft,dailyTargetMinutes:Number(e.target.value)})}>{rhythms.map(minutes=><option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><div className="et-inline-info"><Target/><div><b>Estimated CEFR profile</b><small>{draft.estimatedOverall||draft.placementLevel||draft.cefrLevel||'A1'} · curriculum {draft.currentCurriculumLevel||measuredLevel}</small></div></div></Surface>
      <ETButton className="et-full" type="submit" disabled={saving} aria-busy={saving}><Save/>{saving?'Saving…':'Save profile'}</ETButton>{notice?<p className={noticeOk?'success':'error'} role="status">{notice}</p>:null}
    </form>
    <Surface className="et-settings-list"><button type="button" onClick={()=>nav('/mistakes')}><BrainCircuit/><div><b>Error Memory</b><small>Review recurring mistakes from real practice.</small></div><ChevronRight/></button><button type="button" onClick={()=>nav('/privacy')}><ShieldCheck/><div><b>Privacy & AI data</b><small>See how voice, progress and AI features use data.</small></div><ChevronRight/></button><button type="button" onClick={async()=>{await signOut(auth);nav('/welcome');}}><LogOut/><div><b>Sign out</b></div><ChevronRight/></button></Surface>
    <Surface className="et-danger-zone" tone="danger"><SectionTitle title="Delete account" meta="Data control"/><p>This permanently removes your profile, lesson progress, FSRS history, mistakes, Twin memory, placement/checkpoint evidence, writing drafts, attempts, structured evaluations, mastery records and saved speaking sessions, then deletes your sign-in account.</p>{!confirmDelete?<ETButton variant="danger" onClick={()=>setConfirmDelete(true)}><Trash2/> Delete account and learning data</ETButton>:<div className="et-inline-actions"><ETButton variant="ghost" onClick={()=>setConfirmDelete(false)} disabled={deleting}>Cancel</ETButton><ETButton variant="danger" onClick={()=>void removeAccount()} disabled={deleting} aria-busy={deleting}><Trash2/>{deleting?'Deleting…':'Permanently delete'}</ETButton></div>}</Surface>
  </LearningShell>;
}

export function MistakeMemory(){
  const nav=useNavigate();const[user,setUser]=useState<User|null>(null);const[mistakes,setMistakes]=useState<Mistake[]>([]);const[loading,setLoading]=useState(true);const[loadError,setLoadError]=useState(false);const[reloadKey,setReloadKey]=useState(0);
  useEffect(()=>{const unsubscribe=onAuthStateChanged(auth,async current=>{setUser(current);setLoading(true);setLoadError(false);if(!current){setLoading(false);return;}try{const snap=await getDocs(collection(db,'users',current.uid,'mistakes'));const rows=snap.docs.map(item=>({id:item.id,...item.data()} as Mistake));rows.sort((a,b)=>(b.lastSeenAt?.toMillis?.()||0)-(a.lastSeenAt?.toMillis?.()||0));setMistakes(rows);}catch{setLoadError(true);}finally{setLoading(false);}});return unsubscribe;},[reloadKey]);
  const lessonCount=useMemo(()=>mistakes.filter(item=>item.source==='lesson'||item.source==='advanced-lesson').length,[mistakes]);const twinCount=useMemo(()=>mistakes.filter(item=>item.source==='twin-coach').length,[mistakes]);
  if(loading)return <LearningShell showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="ERROR MEMORY" title="Reading your saved mistakes…"/></LearningShell>;
  if(!user)return <Navigate to="/welcome" replace/>;
  if(loadError)return <LearningShell><StatusState icon={<AlertTriangle/>} tone="danger" title="Couldn’t load Error Memory" body="Your saved mistakes were not changed. Check the connection and try again." action={<ETButton onClick={()=>setReloadKey(value=>value+1)}>Try again</ETButton>}/></LearningShell>;
  return <LearningShell className="et-mistake-shell"><PageTitle eyebrow="ERROR MEMORY" title="Your recurring mistakes" description="Mistakes and remediation targets captured from real lessons, pronunciation and Twin Coach appear here."/><div className="et-metric-grid"><Surface><strong>{mistakes.length}</strong><span>Total</span></Surface><Surface><strong>{lessonCount}</strong><span>Lessons</span></Surface><Surface><strong>{twinCount}</strong><span>Twin Coach</span></Surface></div>{!mistakes.length?<StatusState icon={<BrainCircuit/>} title="No stored mistakes yet" body="Make a real mistake in a scored lesson or Twin Coach and it will appear here." action={<ETButton variant="secondary" onClick={()=>nav('/practice')}>Go to practice</ETButton>}/>:<div className="et-mistake-list">{mistakes.map(item=><Surface className="et-mistake-card" key={item.id}><div className="et-mistake-meta"><span>{String(item.source||'practice').toUpperCase().replaceAll('-',' ')}</span>{item.skill?<span>{item.skill}</span>:null}<span>{item.timesSeen||1}× seen</span></div><del>{item.original||'—'}</del><b>{item.corrected||'—'}</b>{item.reason?<p>{item.reason}</p>:null}{item.latestExample?<small>Context: {item.latestExample}</small>:null}</Surface>)}</div>}</LearningShell>;
}
