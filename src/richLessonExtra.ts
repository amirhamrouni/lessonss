import type { RichLesson } from './richLesson';

const m=(Arabic:string,Dutch:string,French:string,German:string,Spanish:string,English:string)=>({Arabic,Dutch,French,German,Spanish,English});
const word=(visualId:any,word:string,phonetic:string,meanings:Record<string,string>,example:string)=>({type:'visual_word' as const,visualId,word,phonetic,meanings,example});
const listen=(audioText:string,options:string[],answer=audioText,explanation=`You heard “${audioText}”.`)=>({type:'listen_select' as const,prompt:'Listen and choose what you hear.',audioText,options,answer,explanation});
const build=(prompt:string,words:string[],answer:string,explanation:string)=>({type:'sentence_build' as const,prompt,words,answer,explanation});

export const richA1ExtraLessons:RichLesson[]=[
  {id:'a1-u4-l2',unitId:'u4',title:'Order politely',skill:'Speaking',minutes:8,objective:'Ask for food and drink politely using short useful phrases.',activities:[
    word('coffee','Please','/pliːz/',m('من فضلك','Alsjeblieft','S’il vous plaît','Bitte','Por favor','Please'),'Coffee, please.'),
    listen('Coffee please',['Coffee please','Water please','Where is the station']),
    {type:'choice',prompt:'Choose the polite request.',options:['Coffee.','Give coffee.','Coffee, please.'],answer:'Coffee, please.',explanation:'Adding “please” makes the request polite.'},
    build('Build the request.',['have','I','Can','water'],'Can I have water','“Can I have …?” is a useful polite request.'),
    {type:'choice',prompt:'You want water. What do you say?',options:['Can I have water, please?','Where is water?','You water.'],answer:'Can I have water, please?',explanation:'“Can I have …, please?” is polite and natural.'}
  ]},
  {id:'a1-u5-l2',unitId:'u5',title:'Find the way',skill:'Speaking',minutes:9,objective:'Ask where a place is and understand very simple direction words.',activities:[
    word('station','Where','/wer/',m('أين','Waar','Où','Wo','Dónde','Where'),'Where is the station?'),
    listen('Where is the station',['Where is the station','I need the hospital','Coffee please']),
    {type:'choice',prompt:'Which question asks for a place?',options:['Where is the station?','What’s your name?','Can I have coffee?'],answer:'Where is the station?',explanation:'Use “Where is …?” to ask for a location.'},
    build('Build the question.',['pharmacy','the','is','Where'],'Where is the pharmacy','Use “Where is + place?”'),
    {type:'choice',prompt:'Someone says “Go straight.” What should you do?',options:['Continue forward','Turn back','Sit down'],answer:'Continue forward',explanation:'“Go straight” means continue forward.'}
  ]},
  {id:'a1-u6-l1',unitId:'u6',title:'Work & study basics',skill:'Vocabulary',minutes:9,objective:'Recognize and hear common work and study roles before using grammar about jobs.',activities:[
    word('teacher','Teacher','/ˈtiːtʃər/',m('معلّم','Leraar','Professeur','Lehrer','Profesor','Teacher'),'She is a teacher.'),
    word('student','Student','/ˈstuːdənt/',m('طالب','Student','Étudiant','Student','Estudiante','Student'),'I am a student.'),
    listen('Teacher',['Teacher','Student','Hospital']),
    {type:'choice',prompt:'A person who learns at school is a…',options:['student','teacher','station'],answer:'student',explanation:'A learner at school or university is a student.'},
    build('Build the sentence.',['student','a','I’m'],'I’m a student','Use “I’m a + role”.')
  ]}
];
