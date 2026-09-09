import type { LearningLevel } from './curriculumAll';

export type AdvancedPronunciationTask = {
  id:string;
  level:'B1'|'B2'|'C1';
  focus:string;
  target:string;
  listenText:string;
  coaching:string;
  success:string[];
};

export const advancedPronunciationTasks:AdvancedPronunciationTask[]=[
  {id:'b1-chunking-1',level:'B1',focus:'Thought groups & sentence stress',target:'After work, I usually take the train home.',listenText:'After work, I usually take the train home.',coaching:'Group the sentence into meaning chunks. Make WORK, USUALLY, TRAIN and HOME clearer than small grammar words.',success:['generally intelligible','clear content-word stress','natural pause after the opening phrase']},
  {id:'b1-weak-form-1',level:'B1',focus:'Weak forms',target:'I can meet you at the station at six.',listenText:'I can meet you at the station at six.',coaching:'Keep CAN, AT and THE lighter unless they carry contrast. Do not give every word equal weight.',success:['intelligible sentence','lighter function words','clear stressed content words']},
  {id:'b1-linking-1',level:'B1',focus:'Basic linking',target:'Turn it off when you arrive.',listenText:'Turn it off when you arrive.',coaching:'Let word boundaries connect smoothly. Avoid adding a strong pause between every word.',success:['smooth word boundaries','clear final consonants','generally intelligible rhythm']},
  {id:'b1-contrast-1',level:'B1',focus:'Contrastive stress',target:'I asked for Tuesday, not Thursday.',listenText:'I asked for Tuesday, not Thursday.',coaching:'Make TUESDAY and THURSDAY carry the contrast. The stressed words should make the correction obvious.',success:['contrast is audible','key words are prominent','sentence remains intelligible']},
  {id:'b2-rhythm-1',level:'B2',focus:'Stress-timed rhythm',target:'The proposal could work if we manage the risks carefully.',listenText:'The proposal could work if we manage the risks carefully.',coaching:'Keep a steady beat on PROPOSAL, WORK, MANAGE, RISKS and CAREFULLY while compressing less important words.',success:['stable rhythm','prominent information words','no word-by-word delivery']},
  {id:'b2-linking-1',level:'B2',focus:'Connected speech & linking',target:'We need to look at all of the evidence before we decide.',listenText:'We need to look at all of the evidence before we decide.',coaching:'Connect consonant-to-vowel boundaries naturally while preserving clarity. Smooth does not mean swallowing key words.',success:['connected delivery','clear key words','intelligible phrase boundaries']},
  {id:'b2-stance-1',level:'B2',focus:'Intonation for viewpoint',target:'I agree with the main idea, but I am not convinced by the evidence.',listenText:'I agree with the main idea, but I am not convinced by the evidence.',coaching:'Use intonation to signal agreement first, then a clear shift before BUT and the reservation that follows.',success:['viewpoint shift is clear','contrastive stress supports meaning','extended phrase stays fluent']},
  {id:'b2-qualification-1',level:'B2',focus:'Prominence for qualification',target:'The plan is probably effective in the short term.',listenText:'The plan is probably effective in the short term.',coaching:'Give PROBABLY enough prominence to show that the claim is qualified rather than certain.',success:['qualification is audible','natural sentence stress','clear final phrase']},
  {id:'c1-nuance-1',level:'C1',focus:'Prosody for nuance',target:'The results are encouraging, although they are by no means conclusive.',listenText:'The results are encouraging, although they are by no means conclusive.',coaching:'Signal the positive claim, then use a controlled shift in pitch and prominence to qualify it strongly after ALTHOUGH.',success:['nuance is signalled','qualification is prominent','delivery remains fluent and controlled']},
  {id:'c1-register-1',level:'C1',focus:'Professional delivery & register',target:'I appreciate the concern; however, the available evidence suggests a different conclusion.',listenText:'I appreciate the concern; however, the available evidence suggests a different conclusion.',coaching:'Use measured pacing, a clear boundary before HOWEVER, and controlled emphasis on EVIDENCE and DIFFERENT CONCLUSION.',success:['professional pacing','discourse marker is signalled','strategic prominence supports the argument']},
  {id:'c1-presentation-1',level:'C1',focus:'Presentation chunking',target:'There are three reasons for this recommendation: cost, reliability, and long-term impact.',listenText:'There are three reasons for this recommendation: cost, reliability, and long-term impact.',coaching:'Use the colon as a planning boundary. Introduce the list clearly and give each item balanced prominence.',success:['clear signposting','balanced list rhythm','controlled phrase boundaries']},
  {id:'c1-implication-1',level:'C1',focus:'Intonation for implication',target:'That would be one way of interpreting the data.',listenText:'That would be one way of interpreting the data.',coaching:'Keep the wording polite while using prominence to imply that other interpretations remain possible. Avoid exaggerated sarcasm.',success:['subtle qualification','controlled intonation','natural fluent delivery']},
];

export function pronunciationTasksForLevel(level:LearningLevel){
  if(level==='B1'||level==='B2'||level==='C1')return advancedPronunciationTasks.filter(item=>item.level===level);
  return [];
}
