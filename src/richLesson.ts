import type { Lesson } from './curriculum';

export type RichVisualWordActivity = {
  type: 'visual_word';
  visualId: 'hello' | 'water' | 'apple' | 'home';
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
  options: Array<{ visualId: 'hello' | 'water' | 'apple' | 'home'; label: string }>;
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

export const richBeginnerLesson: RichLesson = {
  id: 'a1-u1-l1',
  unitId: 'u1',
  title: 'First words: hello, water, apple, home',
  skill: 'Vocabulary',
  minutes: 8,
  objective: 'Recognize, hear and use four high-frequency English words before grammar.',
  activities: [
    {
      type: 'visual_word',
      visualId: 'hello',
      word: 'Hello',
      phonetic: '/həˈloʊ/',
      meanings: { Arabic: 'مرحبا', Dutch: 'Hallo', French: 'Bonjour', German: 'Hallo', Spanish: 'Hola', English: 'Hello' },
      example: 'Hello! I’m Amir.',
    },
    {
      type: 'listen_select',
      prompt: 'Listen and choose what you hear.',
      audioText: 'Hello',
      options: ['Hello', 'Water', 'Home'],
      answer: 'Hello',
      explanation: 'You heard “Hello”.',
    },
    {
      type: 'visual_word',
      visualId: 'water',
      word: 'Water',
      phonetic: '/ˈwɔːtər/',
      meanings: { Arabic: 'ماء', Dutch: 'Water', French: 'Eau', German: 'Wasser', Spanish: 'Agua', English: 'Water' },
      example: 'Water, please.',
    },
    {
      type: 'image_choice',
      prompt: 'Choose the picture for “water”.',
      options: [
        { visualId: 'apple', label: 'Apple' },
        { visualId: 'water', label: 'Water' },
        { visualId: 'home', label: 'Home' },
      ],
      answer: 'Water',
      explanation: 'The blue drop represents water.',
    },
    {
      type: 'visual_word',
      visualId: 'apple',
      word: 'Apple',
      phonetic: '/ˈæpəl/',
      meanings: { Arabic: 'تفاحة', Dutch: 'Appel', French: 'Pomme', German: 'Apfel', Spanish: 'Manzana', English: 'Apple' },
      example: 'This is an apple.',
    },
    {
      type: 'visual_word',
      visualId: 'home',
      word: 'Home',
      phonetic: '/hoʊm/',
      meanings: { Arabic: 'منزل', Dutch: 'Thuis', French: 'Maison', German: 'Zuhause', Spanish: 'Casa', English: 'Home' },
      example: 'I am at home.',
    },
    {
      type: 'sentence_build',
      prompt: 'Build the sentence.',
      words: ['at', 'I', 'home', 'am'],
      answer: 'I am at home',
      explanation: 'English word order is: I + am + at + home.',
    },
    {
      type: 'choice',
      prompt: 'You meet someone. Choose the natural first word.',
      options: ['Hello', 'Home', 'Apple'],
      answer: 'Hello',
      explanation: '“Hello” is a greeting used when you meet someone.',
    },
  ],
};
