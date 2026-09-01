import type { RichLesson } from './richLesson';

const m=(Arabic:string,Dutch:string,French:string,German:string,Spanish:string,English:string)=>({Arabic,Dutch,French,German,Spanish,English});
const word=(visualId:any,word:string,phonetic:string,meanings:Record<string,string>,example:string)=>({type:'visual_word' as const,visualId,word,phonetic,meanings,example});
const listen=(audioText:string,options:string[],answer=audioText,explanation=`You heard “${audioText}”.`)=>({type:'listen_select' as const,prompt:'Listen and choose what you hear.',audioText,options,answer,explanation});
const build=(prompt:string,words:string[],answer:string,explanation:string)=>({type:'sentence_build' as const,prompt,words,answer,explanation});

export const richA1GrammarLessons:RichLesson[]=[
  {
    id:'a1-u1-l3',unitId:'u1',title:'I am · You are',skill:'Grammar',minutes:8,
    objective:'Understand am and are through real identity sentences before learning the grammar rule.',
    activities:[
      word('person','I am','/aɪ æm/',m('أنا','Ik ben','Je suis','Ich bin','Yo soy','I am'),'I am Amir.'),
      listen('I am Amir',['I am Amir','You are Amir','My name water']),
      word('person','You are','/juː ɑːr/',m('أنت','Jij bent','Tu es','Du bist','Tú eres','You are'),'You are my friend.'),
      build('Build the sentence.',['am','I','ready'],'I am ready','With “I”, use “am”.'),
      {type:'choice',prompt:'Look at yourself and choose the natural sentence.',options:['I am ready.','I is ready.','I are ready.'],answer:'I am ready.',explanation:'Use “am” with “I”.'},
      {type:'choice',prompt:'You speak to another person. Choose the natural sentence.',options:['You are welcome.','You am welcome.','You is welcome.'],answer:'You are welcome.',explanation:'Use “are” with “you”.'}
    ]
  },
  {
    id:'a1-u2-l2',unitId:'u2',title:'Talk about your routine',skill:'Grammar',minutes:9,
    objective:'Notice present-simple patterns inside familiar daily actions before naming the rule.',
    activities:[
      word('wake','Every day','/ˈevri deɪ/',m('كل يوم','Elke dag','Chaque jour','Jeden Tag','Cada día','Every day'),'I wake up every day.'),
      listen('I work every day',['I work every day','I sleep station','She coffee every day']),
      word('work','Works','/wɜːrks/',m('يعمل/تعمل','Werkt','Travaille','Arbeitet','Trabaja','Works'),'She works today.'),
      build('Build the routine sentence.',['every','I','work','day'],'I work every day','With “I”, use the base verb: work.'),
      {type:'choice',prompt:'Choose the sentence about Lina.',options:['She works every day.','She work every day.','She working every day.'],answer:'She works every day.',explanation:'With he/she in a simple positive sentence, the verb often ends in -s.'},
      {type:'choice',prompt:'Choose the sentence about you.',options:['I work today.','I works today.','I working today.'],answer:'I work today.',explanation:'With “I”, use the base verb.'}
    ]
  },
  {
    id:'a1-u3-l2',unitId:'u3',title:'I have · She has',skill:'Grammar',minutes:8,
    objective:'Use have and has to talk about family through meaningful personal examples.',
    activities:[
      word('brother','I have','/aɪ hæv/',m('لديّ','Ik heb','J’ai','Ich habe','Tengo','I have'),'I have one brother.'),
      listen('I have one sister',['I have one sister','She has one sister','I am one sister']),
      word('sister','She has','/ʃiː hæz/',m('لديها','Zij heeft','Elle a','Sie hat','Ella tiene','She has'),'She has one sister.'),
      build('Build the sentence.',['two','I','brothers','have'],'I have two brothers','Use “have” with “I”.'),
      {type:'choice',prompt:'Choose the sentence about Sara.',options:['She has one brother.','She have one brother.','She am one brother.'],answer:'She has one brother.',explanation:'Use “has” with she/he.'},
      {type:'choice',prompt:'Choose the sentence about yourself.',options:['I have a family.','I has a family.','I is a family.'],answer:'I have a family.',explanation:'Use “have” with “I”.'}
    ]
  },
  {
    id:'a1-u6-l2',unitId:'u6',title:'What I can do',skill:'Grammar',minutes:9,
    objective:'Use can and cannot through real abilities before focusing on the grammar form.',
    activities:[
      word('person','Can','/kæn/',m('أستطيع','Kan','Peux','Kann','Puedo','Can'),'I can speak English.'),
      listen('I can work today',['I can work today','I am work today','I has work today']),
      word('work','Can’t','/kænt/',m('لا أستطيع','Kan niet','Ne peux pas','Kann nicht','No puedo','Cannot'),'I can’t work today.'),
      build('Build the ability sentence.',['speak','I','can','Arabic'],'I can speak Arabic','After “can”, use the base verb.'),
      {type:'choice',prompt:'Choose the natural sentence.',options:['I can swim.','I can to swim.','I can swimming.'],answer:'I can swim.',explanation:'After “can”, use the base verb without “to”.'},
      {type:'choice',prompt:'You cannot drive. What do you say?',options:['I can’t drive.','I don’t can drive.','I can’t to drive.'],answer:'I can’t drive.',explanation:'Use “can’t + base verb” for inability.'}
    ]
  }
];
