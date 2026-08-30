export type ChoiceActivity={type:'choice';prompt:string;options:string[];answer:string;explanation:string};
export type FillActivity={type:'fill';prompt:string;answer:string;hint?:string;explanation:string};
export type ExplainActivity={type:'explain';title:string;body:string;examples:string[]};
export type Activity=ChoiceActivity|FillActivity|ExplainActivity;
export type Lesson={id:string;unitId:string;title:string;skill:'Vocabulary'|'Grammar'|'Reading'|'Speaking'|'Listening'|'Review';minutes:number;objective:string;activities:Activity[]};
export type Unit={id:string;title:string;icon:string;lessons:string[]};

export const units:Unit[]=[
{id:'u1',title:'Introductions',icon:'👋',lessons:['a1-u1-l1','a1-u1-l2','a1-u1-l3']},
{id:'u2',title:'Everyday Life',icon:'☀️',lessons:['a1-u2-l1','a1-u2-l2']},
{id:'u3',title:'Family & People',icon:'👥',lessons:['a1-u3-l1','a1-u3-l2']},
{id:'u4',title:'Food & Drinks',icon:'☕',lessons:['a1-u4-l1','a1-u4-l2']},
{id:'u5',title:'Places & Directions',icon:'🗺️',lessons:['a1-u5-l1','a1-u5-l2']},
{id:'u6',title:'Work & Study',icon:'💼',lessons:['a1-u6-l1','a1-u6-l2']},
];

export const lessons:Lesson[]=[
{id:'a1-u1-l1',unitId:'u1',title:'Hello & goodbye',skill:'Vocabulary',minutes:6,objective:'Use basic greetings naturally.',activities:[
{type:'explain',title:'Meet and greet',body:'Use “Hello” or “Hi” when you meet someone. Use “Goodbye”, “Bye”, or “See you” when you leave.',examples:['Hi! I’m Sara.','Hello, nice to meet you.','See you tomorrow!']},
{type:'choice',prompt:'You meet a new colleague. What is the best opener?',options:['Goodbye!','Hi, I’m Amir.','See you later.'],answer:'Hi, I’m Amir.',explanation:'“Hi, I’m …” is a natural way to introduce yourself.'},
{type:'fill',prompt:'Complete: Nice to ___ you.',answer:'meet',hint:'m___',explanation:'The fixed phrase is “Nice to meet you.”'},
{type:'choice',prompt:'You are leaving. Choose the natural phrase.',options:['See you later!','Nice to meet you?','Hello again?'],answer:'See you later!',explanation:'“See you later” is used when leaving.'}
]},
{id:'a1-u1-l2',unitId:'u1',title:'My name is…',skill:'Speaking',minutes:7,objective:'Introduce yourself and ask someone’s name.',activities:[
{type:'explain',title:'Introduce yourself',body:'Use “My name is …” or “I’m …”. Ask “What’s your name?”',examples:['I’m Lina.','My name is Omar.','What’s your name?']},
{type:'fill',prompt:'Complete: My ___ is Adam.',answer:'name',explanation:'“My name is …” is the standard form.'},
{type:'choice',prompt:'Which question asks for a person’s name?',options:['Where are you?','What’s your name?','How old is this?'],answer:'What’s your name?',explanation:'“What’s your name?” asks for someone’s name.'}
]},
{id:'a1-u1-l3',unitId:'u1',title:'am / is / are',skill:'Grammar',minutes:8,objective:'Use the verb “be” with I, you, he and she.',activities:[
{type:'explain',title:'The verb be',body:'Use am with I, is with he/she/it, and are with you/we/they.',examples:['I am ready.','She is from Spain.','You are welcome.']},
{type:'choice',prompt:'I ___ from Tunisia.',options:['is','am','are'],answer:'am',explanation:'Use “am” with “I”.'},
{type:'choice',prompt:'She ___ a student.',options:['am','are','is'],answer:'is',explanation:'Use “is” with “she”.'},
{type:'fill',prompt:'Complete: You ___ very kind.',answer:'are',explanation:'Use “are” with “you”.'}
]},
{id:'a1-u2-l1',unitId:'u2',title:'Daily routines',skill:'Vocabulary',minutes:7,objective:'Talk about simple daily routines.',activities:[
{type:'explain',title:'Everyday actions',body:'Common routine verbs include wake up, eat, work, study, go home and sleep.',examples:['I wake up at seven.','I work in the morning.','I go home at five.']},
{type:'choice',prompt:'Which phrase means start your day after sleeping?',options:['wake up','go home','have dinner'],answer:'wake up',explanation:'You “wake up” after sleeping.'},
{type:'fill',prompt:'Complete: I ___ breakfast at 8.',answer:'eat',hint:'e__',explanation:'“Eat breakfast” is correct.'}
]},
{id:'a1-u2-l2',unitId:'u2',title:'Present simple',skill:'Grammar',minutes:9,objective:'Use present simple for routines.',activities:[
{type:'explain',title:'Habits and routines',body:'Use the base verb with I/you/we/they. Add -s for he/she/it in simple affirmative sentences.',examples:['I work every day.','She works every day.','They study English.']},
{type:'choice',prompt:'He ___ in Eindhoven.',options:['live','lives','living'],answer:'lives',explanation:'With “he”, add -s: lives.'},
{type:'fill',prompt:'Complete: They ___ English every evening.',answer:'study',explanation:'With “they”, use the base form “study”.'}
]},
{id:'a1-u3-l1',unitId:'u3',title:'Family words',skill:'Vocabulary',minutes:6,objective:'Name close family members.',activities:[
{type:'explain',title:'Family basics',body:'Learn mother, father, parents, brother, sister, son and daughter.',examples:['This is my sister.','My parents live nearby.','He has one son.']},
{type:'choice',prompt:'Your mother and father are your…',options:['parents','children','friends'],answer:'parents',explanation:'Mother + father = parents.'},
{type:'fill',prompt:'Complete: My mother’s son is my ___.',answer:'brother',explanation:'Your mother’s son is your brother (if it is not you).'}
]},
{id:'a1-u3-l2',unitId:'u3',title:'have / has',skill:'Grammar',minutes:7,objective:'Use have and has to describe people and family.',activities:[
{type:'explain',title:'Have or has?',body:'Use have with I/you/we/they and has with he/she/it.',examples:['I have two brothers.','She has blue eyes.']},
{type:'choice',prompt:'She ___ one daughter.',options:['have','has'],answer:'has',explanation:'Use “has” with “she”.'},
{type:'fill',prompt:'Complete: We ___ a big family.',answer:'have',explanation:'Use “have” with “we”.'}
]},
{id:'a1-u4-l1',unitId:'u4',title:'Food essentials',skill:'Vocabulary',minutes:7,objective:'Recognize common food and drink words.',activities:[
{type:'explain',title:'At the table',body:'Useful words include water, coffee, tea, bread, rice, chicken, fruit and vegetables.',examples:['I’d like coffee.','We need some bread.']},
{type:'choice',prompt:'Which one is a drink?',options:['bread','coffee','rice'],answer:'coffee',explanation:'Coffee is a drink.'},
{type:'fill',prompt:'Complete: A glass of ___.',answer:'water',explanation:'“A glass of water” is a common phrase.'}
]},
{id:'a1-u4-l2',unitId:'u4',title:'Ordering politely',skill:'Speaking',minutes:8,objective:'Order simple food and drinks politely.',activities:[
{type:'explain',title:'Polite ordering',body:'Use “I’d like …, please” or “Can I have …, please?”',examples:['I’d like a coffee, please.','Can I have some water, please?']},
{type:'choice',prompt:'Choose the most polite order.',options:['Coffee.','Give coffee.','I’d like a coffee, please.'],answer:'I’d like a coffee, please.',explanation:'“I’d like …, please” is polite and natural.'},
{type:'fill',prompt:'Complete: Can I ___ some water, please?',answer:'have',explanation:'The phrase is “Can I have …?”'}
]},
{id:'a1-u5-l1',unitId:'u5',title:'Places in town',skill:'Vocabulary',minutes:6,objective:'Name common places around town.',activities:[
{type:'explain',title:'Around town',body:'Useful places include station, supermarket, hospital, bank, restaurant and pharmacy.',examples:['The station is near here.','The pharmacy is next to the bank.']},
{type:'choice',prompt:'Where do you usually buy medicine?',options:['pharmacy','station','restaurant'],answer:'pharmacy',explanation:'Medicine is commonly bought at a pharmacy.'}
]},
{id:'a1-u5-l2',unitId:'u5',title:'Ask for directions',skill:'Speaking',minutes:8,objective:'Ask where a place is and understand simple directions.',activities:[
{type:'explain',title:'Finding your way',body:'Ask “Where is …?” or “How do I get to …?” Simple directions use left, right, straight and next to.',examples:['Where is the station?','Go straight, then turn left.']},
{type:'choice',prompt:'Which phrase asks for a location?',options:['Where is the station?','What time do you eat?','Who is she?'],answer:'Where is the station?',explanation:'“Where is …?” asks for location.'},
{type:'fill',prompt:'Complete: Turn ___ at the corner.',answer:'left',hint:'l___',explanation:'“Turn left” is a standard direction phrase.'}
]},
{id:'a1-u6-l1',unitId:'u6',title:'Jobs & study',skill:'Vocabulary',minutes:6,objective:'Talk about basic work and study roles.',activities:[
{type:'explain',title:'Work and school',body:'Useful words include teacher, student, driver, nurse, office, school and university.',examples:['I am a student.','She works in an office.']},
{type:'choice',prompt:'A person who learns at school is a…',options:['student','teacher','driver'],answer:'student',explanation:'A learner at school or university is a student.'}
]},
{id:'a1-u6-l2',unitId:'u6',title:'can / can’t',skill:'Grammar',minutes:8,objective:'Say what you can and cannot do.',activities:[
{type:'explain',title:'Ability with can',body:'Use can + base verb for ability. Use can’t for inability.',examples:['I can speak Arabic.','I can’t drive.','Can you help me?']},
{type:'choice',prompt:'Choose the correct sentence.',options:['I can to swim.','I can swim.','I can swimming.'],answer:'I can swim.',explanation:'After “can”, use the base verb without “to”.'},
{type:'fill',prompt:'Complete: She ___ speak English.',answer:'can',explanation:'Use “can + verb” for ability.'}
]}
];

export const lessonById=(id:string):Lesson=>{
  const lesson=lessons.find(l=>l.id===id);
  if(!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
};
export const lessonsForUnit=(unitId:string)=>lessons.filter(l=>l.unitId===unitId);
