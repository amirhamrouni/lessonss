import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import { auth, db } from './firebase';
import PronunciationLab from './PronunciationLab';
import AdvancedPronunciationLab from './AdvancedPronunciationLab';
import { normalizeLearningLevel } from './cefrProgress';
import { LearningShell, StatusState } from './ui/LearningUI';

type Profile={currentCurriculumLevel?:string;placementLevel?:string;cefrLevel?:string};
export default function PronunciationGateway(){
  const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<Profile>({});const[loading,setLoading]=useState(true);
  useEffect(()=>onAuthStateChanged(auth,async current=>{setUser(current);if(!current){setLoading(false);return;}try{const snap=await getDoc(doc(db,'users',current.uid));setProfile(snap.exists()?snap.data() as Profile:{});}finally{setLoading(false);}}),[]);
  if(loading)return <LearningShell showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="PRONUNCIATION" title="Preparing pronunciation practice…"/></LearningShell>;
  if(!user)return <Navigate to="/welcome" replace/>;
  const level=normalizeLearningLevel(profile.currentCurriculumLevel||profile.placementLevel||profile.cefrLevel||'A1');
  if(level==='B1'||level==='B2'||level==='C1')return <AdvancedPronunciationLab level={level}/>;
  return <PronunciationLab/>;
}
