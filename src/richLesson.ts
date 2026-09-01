import type { Lesson } from './curriculum';

export type RichVisualWordActivity = {
  type: 'visual_word';
  visualId: string;
  word: string;
  phonetic: string;
  meanings: Record<string, string>;
  example: string;
};

export type RichListenSelectActivity = {
  type: 'listen_select';
  prompt: string;
  audioText: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type RichImageChoiceActivity = {
  type: 'image_choice';
  prompt: string;
  options: Array<{ visualId: string; label: string }>;
  answer: string;
  explanation: string;
};

export type RichSentenceBuildActivity = {
  type: 'sentence_build';
  prompt: string;
  words: string[];
  answer: string;
  explanation: string;
};

export type RichActivity =
  | RichVisualWordActivity
  | RichListenSelectActivity
  | RichImageChoiceActivity
  | RichSentenceBuildActivity;

export type RichLesson = Omit<Lesson, 'activities'> & { activities: Array<Lesson['activities'][number] | RichActivity> };

const meanings = (Arabic: string, Dutch: string, French: string, German: string, Spanish: string, English: string) => ({ Arabic, Dutch, French, German, Spanish, English });

export const richA1Lessons: RichLesson[] = [
  {
    id: 'a1-u1-l1', unitId: 'u1', title: 'First words: hello, water, apple, home', skill: 'Vocabulary', minutes: 8,
    objective: 'Recognize, hear and use four high-frequency English words before grammar.',
    activities: [
      { type: 'visual_word', visualId: 'hello', word: 'Hello', phonetic: '/həˈloʊ/', meanings: meanings('مرحبا','Hallo','Bonjour','Hallo','Hola','Hello'), example: 'Hello! I’m Amir.' },
      { type: 'listen_select', prompt: 'Listen and choose what you hear.', audioText: 'Hello', options: ['Hello','Water','Home'], answer: 'Hello', explanation: 'You heard “Hello”.' },
      { type: 'visual_word', visualId: 'water', word: 'Water', phonetic: '/ˈwɔːtər/', meanings: meanings('ماء','Water','Eau','Wasser','Agua','Water'), example: 'Water, please.' },
      { type: 'image_choice', prompt: 'Choose the picture for “water”.', options: [{visualId:'apple',label:'Apple'},{visualId:'water',label:'Water'},{visualId:'home',label:'Home'}], answer: 'Water', explanation: 'The blue drop represents water.' },
      { type: 'visual_word', visualId: 'apple', word: 'Apple', phonetic: '/ˈæpəl/', meanings: meanings('تفاحة','Appel','Pomme','Apfel','Manzana','Apple'), example: 'This is an apple.' },
      { type: 'visual_word', visualId: 'home', word: 'Home', phonetic: '/hoʊm/', meanings: meanings('منزل','Thuis','Maison','Zuhause','Casa','Home'), example: 'I am at home.' },
      { type: 'sentence_build', prompt: 'Build the sentence.', words: ['at','I','home','am'], answer: 'I am at home', explanation: 'English word order is: I + am + at + home.' },
      { type: 'choice', prompt: 'You meet someone. Choose the natural first word.', options: ['Hello','Home','Apple'], answer: 'Hello', explanation: '“Hello” is a greeting used when you meet someone.' },
    ],
  },
  {
    id: 'a1-u1-l2', unitId: 'u1', title: 'My name', skill: 'Speaking', minutes: 8,
    objective: 'Hear, understand and say a simple self-introduction using your name.',
    activities: [
      { type: 'visual_word', visualId: 'name', word: 'Name', phonetic: '/neɪm/', meanings: meanings('اسم','Naam','Nom','Name','Nombre','Name'), example: 'My name is Lina.' },
      { type: 'listen_select', prompt: 'Listen. Which sentence do you hear?', audioText: 'My name is Lina', options: ['My name is Lina','I need water','This is home'], answer: 'My name is Lina', explanation: 'The speaker says: “My name is Lina.”' },
      { type: 'visual_word', visualId: 'person', word: 'I’m', phonetic: '/aɪm/', meanings: meanings('أنا','Ik ben','Je suis','Ich bin','Soy','I am'), example: 'I’m Omar.' },
      { type: 'sentence_build', prompt: 'Build a natural introduction.', words: ['Amir','I’m'], answer: 'I’m Amir', explanation: 'A short natural introduction is “I’m + name”.' },
      { type: 'choice', prompt: 'Which question asks a person’s name?', options: ['What’s your name?','Where is the station?','Water, please.'], answer: 'What’s your name?', explanation: 'Use “What’s your name?” to ask for a name.' },
    ],
  },
  {
    id: 'a1-u2-l1', unitId: 'u2', title: 'My day', skill: 'Vocabulary', minutes: 9,
    objective: 'Recognize and hear the most useful actions in a simple daily routine.',
    activities: [
      { type: 'visual_word', visualId: 'wake', word: 'Wake up', phonetic: '/weɪk ʌp/', meanings: meanings('أستيقظ','Wakker worden','Se réveiller','Aufwachen','Despertarse','Wake up'), example: 'I wake up at seven.' },
      { type: 'listen_select', prompt: 'Listen and choose the action.', audioText: 'Wake up', options: ['Wake up','Work','Sleep'], answer: 'Wake up', explanation: 'You heard “wake up”.' },
      { type: 'visual_word', visualId: 'work', word: 'Work', phonetic: '/wɜːrk/', meanings: meanings('أعمل','Werken','Travailler','Arbeiten','Trabajar','Work'), example: 'I work in the morning.' },
      { type: 'visual_word', visualId: 'sleep', word: 'Sleep', phonetic: '/sliːp/', meanings: meanings('أنام','Slapen','Dormir','Schlafen','Dormir','Sleep'), example: 'I sleep at night.' },
      { type: 'image_choice', prompt: 'Choose “sleep”.', options: [{visualId:'work',label:'Work'},{visualId:'sleep',label:'Sleep'},{visualId:'wake',label:'Wake up'}], answer: 'Sleep', explanation: 'The bed and moon represent sleep.' },
      { type: 'sentence_build', prompt: 'Build the sentence.', words: ['work','I','today'], answer: 'I work today', explanation: 'Use subject + verb + time: “I work today.”' },
    ],
  },
  {
    id: 'a1-u3-l1', unitId: 'u3', title: 'My family', skill: 'Vocabulary', minutes: 9,
    objective: 'Recognize, hear and use basic words for close family members.',
    activities: [
      { type: 'visual_word', visualId: 'mother', word: 'Mother', phonetic: '/ˈmʌðər/', meanings: meanings('أم','Moeder','Mère','Mutter','Madre','Mother'), example: 'This is my mother.' },
      { type: 'visual_word', visualId: 'father', word: 'Father', phonetic: '/ˈfɑːðər/', meanings: meanings('أب','Vader','Père','Vater','Padre','Father'), example: 'This is my father.' },
      { type: 'listen_select', prompt: 'Listen and choose the word.', audioText: 'Sister', options: ['Sister','Brother','Father'], answer: 'Sister', explanation: 'You heard “sister”.' },
      { type: 'visual_word', visualId: 'sister', word: 'Sister', phonetic: '/ˈsɪstər/', meanings: meanings('أخت','Zus','Sœur','Schwester','Hermana','Sister'), example: 'My sister is here.' },
      { type: 'visual_word', visualId: 'brother', word: 'Brother', phonetic: '/ˈbrʌðər/', meanings: meanings('أخ','Broer','Frère','Bruder','Hermano','Brother'), example: 'My brother is here.' },
      { type: 'image_choice', prompt: 'Choose “mother”.', options: [{visualId:'father',label:'Father'},{visualId:'mother',label:'Mother'},{visualId:'brother',label:'Brother'}], answer: 'Mother', explanation: 'The selected family portrait represents mother.' },
    ],
  },
  {
    id: 'a1-u4-l1', unitId: 'u4', title: 'Food & drink essentials', skill: 'Vocabulary', minutes: 9,
    objective: 'Recognize and request essential food and drink words in everyday situations.',
    activities: [
      { type: 'visual_word', visualId: 'coffee', word: 'Coffee', phonetic: '/ˈkɔːfi/', meanings: meanings('قهوة','Koffie','Café','Kaffee','Café','Coffee'), example: 'Coffee, please.' },
      { type: 'visual_word', visualId: 'bread', word: 'Bread', phonetic: '/bred/', meanings: meanings('خبز','Brood','Pain','Brot','Pan','Bread'), example: 'I need bread.' },
      { type: 'listen_select', prompt: 'Listen and choose what you hear.', audioText: 'Water please', options: ['Water, please.','Coffee, please.','Bread, please.'], answer: 'Water, please.', explanation: 'The speaker asks for water.' },
      { type: 'image_choice', prompt: 'Choose “coffee”.', options: [{visualId:'bread',label:'Bread'},{visualId:'coffee',label:'Coffee'},{visualId:'water',label:'Water'}], answer: 'Coffee', explanation: 'The cup represents coffee.' },
      { type: 'sentence_build', prompt: 'Build a polite request.', words: ['please','Water'], answer: 'Water please', explanation: 'For a first beginner request, “Water, please” is clear and useful.' },
    ],
  },
  {
    id: 'a1-u5-l1', unitId: 'u5', title: 'Places I need', skill: 'Vocabulary', minutes: 9,
    objective: 'Recognize and hear essential places in town before learning detailed directions.',
    activities: [
      { type: 'visual_word', visualId: 'station', word: 'Station', phonetic: '/ˈsteɪʃən/', meanings: meanings('محطة','Station','Gare','Bahnhof','Estación','Station'), example: 'The station is here.' },
      { type: 'visual_word', visualId: 'hospital', word: 'Hospital', phonetic: '/ˈhɑːspɪtəl/', meanings: meanings('مستشفى','Ziekenhuis','Hôpital','Krankenhaus','Hospital','Hospital'), example: 'I need the hospital.' },
      { type: 'visual_word', visualId: 'pharmacy', word: 'Pharmacy', phonetic: '/ˈfɑːrməsi/', meanings: meanings('صيدلية','Apotheek','Pharmacie','Apotheke','Farmacia','Pharmacy'), example: 'Where is the pharmacy?' },
      { type: 'listen_select', prompt: 'Listen and choose the place.', audioText: 'Station', options: ['Station','Hospital','Pharmacy'], answer: 'Station', explanation: 'You heard “station”.' },
      { type: 'image_choice', prompt: 'Choose “hospital”.', options: [{visualId:'station',label:'Station'},{visualId:'hospital',label:'Hospital'},{visualId:'pharmacy',label:'Pharmacy'}], answer: 'Hospital', explanation: 'The medical cross represents a hospital.' },
      { type: 'sentence_build', prompt: 'Build the question.', words: ['the','Where','station','is'], answer: 'Where is the station', explanation: 'The location question is “Where is the station?”' },
    ],
  },
];

export const richBeginnerLesson = richA1Lessons[0];

export const richLessonById = (id: string) => richA1Lessons.find(lesson => lesson.id === id);
