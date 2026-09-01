import type { Lesson } from './curriculum';

export type RichVisualWordActivity = { type:'visual_word'; visualId:any; word:string; phonetic:string; meanings:Record<string,string>; example:string };
export type RichListenSelectActivity = { type:'listen_select'; prompt:string; audioText:string; options:string[]; answer:string; explanation:string };
export type RichImageChoiceActivity = { type:'image_choice'; prompt:string; options:Array<{visualId:any;label:string}>; answer:string; explanation:string };
export type RichSentenceBuildActivity = { type:'sentence_build'; prompt:string; words:string[]; answer:string; explanation:string };
export type RichActivity = RichVisualWordActivity|RichListenSelectActivity|RichImageChoiceActivity|RichSentenceBuildActivity;
export type RichLesson = Omit<Lesson,'activities'> & { activities:Array<Lesson['activities'][number]|RichActivity> };

const m=(Arabic:string,Dutch:string,French:string,German:string,Spanish:string,English:string)=>({Arabic,Dutch,French,German,Spanish,English});
const word=(visualId:any,word:string,phonetic:string,meanings:Record<string,string>,example:string):RichVisualWordActivity=>({type:'visual_word',visualId,word,phonetic,meanings,example});
const listen=(audioText:string,options:string[],answer=audioText,explanation=`You heard “${audioText}”.`):RichListenSelectActivity=>({type:'listen_select',prompt:'Listen and choose what you hear.',audioText,options,answer,explanation});
const picture=(prompt:string,options:Array<{visualId:any;label:string}>,answer:string,explanation:string):RichImageChoiceActivity=>({type:'image_choice',prompt,options,answer,explanation});
const build=(prompt:string,words:string[],answer:string,explanation:string):RichSentenceBuildActivity=>({type:'sentence_build',prompt,words,answer,explanation});

export const richA1Lessons:RichLesson[]=[
{id:'a1-u1-l1',unitId:'u1',title:'First words: hello, water, apple, home',skill:'Vocabulary',minutes:8,objective:'Recognize, hear and use four high-frequency English words before grammar.',activities:[
word('hello','Hello','/həˈloʊ/',m('مرحبا','Hallo','Bonjour','Hallo','Hola','Hello'),'Hello! I’m Amir.'),
listen('Hello',['Hello','Water','Home']),
word('water','Water','/ˈwɔːtər/',m('ماء','Water','Eau','Wasser','Agua','Water'),'Water, please.'),
picture('Choose the picture for “water”.',[{visualId:'apple',label:'Apple'},{visualId:'water',label:'Water'},{visualId:'home',label:'Home'}],'Water','The blue drop represents water.'),
word('apple','Apple','/ˈæpəl/',m('تفاحة','Appel','Pomme','Apfel','Manzana','Apple'),'This is an apple.'),
word('home','Home','/hoʊm/',m('منزل','Thuis','Maison','Zuhause','Casa','Home'),'I am at home.'),
build('Build the sentence.',['at','I','home','am'],'I am at home','English word order is: I + am + at + home.'),
{type:'choice',prompt:'You meet someone. Choose the natural first word.',options:['Hello','Home','Apple'],answer:'Hello',explanation:'“Hello” is a greeting used when you meet someone.'}]},

{id:'a1-u1-l2',unitId:'u1',title:'My name',skill:'Speaking',minutes:8,objective:'Hear, understand and say a simple self-introduction using your name.',activities:[
word('name','Name','/neɪm/',m('اسم','Naam','Nom','Name','Nombre','Name'),'My name is Lina.'),
listen('My name is Lina',['My name is Lina','I need water','This is home']),
word('person','I’m','/aɪm/',m('أنا','Ik ben','Je suis','Ich bin','Soy','I am'),'I’m Omar.'),
build('Build a natural introduction.',['Amir','I’m'],'I’m Amir','A short natural introduction is “I’m + name”.'),
{type:'choice',prompt:'Which question asks a person’s name?',options:['What’s your name?','Where is the station?','Water, please.'],answer:'What’s your name?',explanation:'Use “What’s your name?” to ask for a name.'}]},

{id:'a1-u2-l1',unitId:'u2',title:'My day',skill:'Vocabulary',minutes:9,objective:'Recognize and hear the most useful actions in a simple daily routine.',activities:[
word('wake','Wake up','/weɪk ʌp/',m('أستيقظ','Wakker worden','Se réveiller','Aufwachen','Despertarse','Wake up'),'I wake up at seven.'),
listen('Wake up',['Wake up','Work','Sleep']),
word('work','Work','/wɜːrk/',m('أعمل','Werken','Travailler','Arbeiten','Trabajar','Work'),'I work in the morning.'),
word('sleep','Sleep','/sliːp/',m('أنام','Slapen','Dormir','Schlafen','Dormir','Sleep'),'I sleep at night.'),
picture('Choose “sleep”.',[{visualId:'work',label:'Work'},{visualId:'sleep',label:'Sleep'},{visualId:'wake',label:'Wake up'}],'Sleep','The bed and moon represent sleep.'),
build('Build the sentence.',['work','I','today'],'I work today','Use subject + verb + time: “I work today.”')]},

{id:'a1-u3-l1',unitId:'u3',title:'My family',skill:'Vocabulary',minutes:9,objective:'Recognize, hear and use basic words for close family members.',activities:[
word('mother','Mother','/ˈmʌðər/',m('أم','Moeder','Mère','Mutter','Madre','Mother'),'This is my mother.'),
word('father','Father','/ˈfɑːðər/',m('أب','Vader','Père','Vater','Padre','Father'),'This is my father.'),
listen('Sister',['Sister','Brother','Father']),
word('sister','Sister','/ˈsɪstər/',m('أخت','Zus','Sœur','Schwester','Hermana','Sister'),'My sister is here.'),
word('brother','Brother','/ˈbrʌðər/',m('أخ','Broer','Frère','Bruder','Hermano','Brother'),'My brother is here.'),
picture('Choose “mother”.',[{visualId:'father',label:'Father'},{visualId:'mother',label:'Mother'},{visualId:'brother',label:'Brother'}],'Mother','The selected family portrait represents mother.')]},

{id:'a1-u4-l1',unitId:'u4',title:'Food & drink essentials',skill:'Vocabulary',minutes:9,objective:'Recognize and request essential food and drink words in everyday situations.',activities:[
word('coffee','Coffee','/ˈkɔːfi/',m('قهوة','Koffie','Café','Kaffee','Café','Coffee'),'Coffee, please.'),
word('bread','Bread','/bred/',m('خبز','Brood','Pain','Brot','Pan','Bread'),'I need bread.'),
listen('Water please',['Water, please.','Coffee, please.','Bread, please.'],'Water, please.','The speaker asks for water.'),
picture('Choose “coffee”.',[{visualId:'bread',label:'Bread'},{visualId:'coffee',label:'Coffee'},{visualId:'water',label:'Water'}],'Coffee','The cup represents coffee.'),
build('Build a polite request.',['please','Water'],'Water please','For a first beginner request, “Water, please” is clear and useful.')]},

{id:'a1-u5-l1',unitId:'u5',title:'Places I need',skill:'Vocabulary',minutes:9,objective:'Recognize and hear essential places in town before learning detailed directions.',activities:[
word('station','Station','/ˈsteɪʃən/',m('محطة','Station','Gare','Bahnhof','Estación','Station'),'The station is here.'),
word('hospital','Hospital','/ˈhɑːspɪtəl/',m('مستشفى','Ziekenhuis','Hôpital','Krankenhaus','Hospital','Hospital'),'I need the hospital.'),
word('pharmacy','Pharmacy','/ˈfɑːrməsi/',m('صيدلية','Apotheek','Pharmacie','Apotheke','Farmacia','Pharmacy'),'Where is the pharmacy?'),
listen('Station',['Station','Hospital','Pharmacy']),
picture('Choose “hospital”.',[{visualId:'station',label:'Station'},{visualId:'hospital',label:'Hospital'},{visualId:'pharmacy',label:'Pharmacy'}],'Hospital','The medical cross represents a hospital.'),
build('Build the question.',['the','Where','station','is'],'Where is the station','The location question is “Where is the station?”')]}
];

export const richBeginnerLesson=richA1Lessons[0];
export const richLessonById=(id:string)=>richA1Lessons.find(lesson=>lesson.id===id);
