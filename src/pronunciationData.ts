export type PronunciationItem = {
  id: string;
  word: string;
  syllables: string[];
  stressIndex: number;
  focus: string;
  mouthTip: string;
  contrast?: { word: string; cue: string };
  sentence: string;
};

export type PronunciationMistakeSignal = {
  original?: string;
  corrected?: string;
  latestExample?: string;
  timesSeen?: number;
  skill?: string;
};

export const pronunciationItems: PronunciationItem[] = [
  {
    id: 'three-th',
    word: 'three',
    syllables: ['three'],
    stressIndex: 0,
    focus: 'TH /θ/',
    mouthTip: 'Put the tip of your tongue lightly between your teeth and let air pass. Do not turn it into T.',
    contrast: { word: 'tree', cue: 'three has TH; tree starts with a clean T.' },
    sentence: 'I have three meetings today.',
  },
  {
    id: 'this-th',
    word: 'this',
    syllables: ['this'],
    stressIndex: 0,
    focus: 'TH /ð/',
    mouthTip: 'Use the same tongue position as TH, but add your voice. You should feel a light vibration.',
    contrast: { word: 'think', cue: 'this is voiced /ð/; think is unvoiced /θ/.' },
    sentence: 'This is the right address.',
  },
  {
    id: 'ship-short-i',
    word: 'ship',
    syllables: ['ship'],
    stressIndex: 0,
    focus: 'Short I /ɪ/',
    mouthTip: 'Keep the vowel short and relaxed. Do not stretch it into a long EE sound.',
    contrast: { word: 'sheep', cue: 'ship is short; sheep has a longer EE sound.' },
    sentence: 'The ship leaves at six.',
  },
  {
    id: 'live-short-i',
    word: 'live',
    syllables: ['live'],
    stressIndex: 0,
    focus: 'Short I /ɪ/',
    mouthTip: 'Keep the vowel compact and quick, then finish with a voiced V.',
    contrast: { word: 'leave', cue: 'live is short; leave has a long EE sound.' },
    sentence: 'I live near the city centre.',
  },
  {
    id: 'full-short-u',
    word: 'full',
    syllables: ['full'],
    stressIndex: 0,
    focus: 'Short OO /ʊ/',
    mouthTip: 'Use a short rounded vowel. Keep it relaxed rather than holding the sound.',
    contrast: { word: 'fool', cue: 'full is short; fool has a longer OO sound.' },
    sentence: 'The train is full this morning.',
  },
  {
    id: 'very-v',
    word: 'very',
    syllables: ['ver', 'y'],
    stressIndex: 0,
    focus: 'V /v/',
    mouthTip: 'Touch your lower lip lightly with your upper teeth and keep the sound voiced.',
    contrast: { word: 'ferry', cue: 'very starts voiced with V; ferry starts unvoiced with F.' },
    sentence: 'The lesson is very useful.',
  },
  {
    id: 'right-r',
    word: 'right',
    syllables: ['right'],
    stressIndex: 0,
    focus: 'R /r/',
    mouthTip: 'Keep your tongue away from the roof of your mouth. Round the lips slightly into the R.',
    contrast: { word: 'light', cue: 'right starts with R; light starts with L.' },
    sentence: 'Turn right after the station.',
  },
  {
    id: 'van-v',
    word: 'van',
    syllables: ['van'],
    stressIndex: 0,
    focus: 'V /v/',
    mouthTip: 'Keep the V voiced. You should feel vibration while the lower lip touches the upper teeth.',
    contrast: { word: 'fan', cue: 'van is voiced; fan is unvoiced.' },
    sentence: 'The delivery van is outside.',
  },
  {
    id: 'coffee-stress',
    word: 'coffee',
    syllables: ['cof', 'fee'],
    stressIndex: 0,
    focus: 'Word stress',
    mouthTip: 'Make the first syllable stronger and clearer; keep the second syllable lighter.',
    sentence: 'I would like a coffee, please.',
  },
  {
    id: 'today-stress',
    word: 'today',
    syllables: ['to', 'day'],
    stressIndex: 1,
    focus: 'Final stress',
    mouthTip: 'Keep the first syllable light and place the main beat on DAY.',
    sentence: 'I am working from home today.',
  },
  {
    id: 'hotel-stress',
    word: 'hotel',
    syllables: ['ho', 'tel'],
    stressIndex: 1,
    focus: 'Final stress',
    mouthTip: 'Reduce the first syllable slightly and make TEL the strongest beat.',
    sentence: 'Our hotel is close to the airport.',
  },
  {
    id: 'station-cluster',
    word: 'station',
    syllables: ['sta', 'tion'],
    stressIndex: 0,
    focus: 'SH sound in -tion',
    mouthTip: 'The ending -tion is normally smooth and light, like “shun”, not four separate letters.',
    sentence: 'Where is the nearest train station?',
  },
  {
    id: 'appointment-stress',
    word: 'appointment',
    syllables: ['ap', 'point', 'ment'],
    stressIndex: 1,
    focus: 'Middle stress',
    mouthTip: 'Put the main beat on POINT and keep the first and last syllables lighter.',
    sentence: 'I have a doctor appointment tomorrow.',
  },
  {
    id: 'important-stress',
    word: 'important',
    syllables: ['im', 'por', 'tant'],
    stressIndex: 1,
    focus: 'Middle stress',
    mouthTip: 'Make POR the strongest syllable and avoid giving every syllable equal weight.',
    sentence: 'This document is very important.',
  },
  {
    id: 'information-stress',
    word: 'information',
    syllables: ['in', 'for', 'ma', 'tion'],
    stressIndex: 2,
    focus: 'Long-word rhythm',
    mouthTip: 'Build toward the strong MA syllable, then relax into the final -tion.',
    sentence: 'Could you send me more information?',
  },
  {
    id: 'available-stress',
    word: 'available',
    syllables: ['a', 'vail', 'a', 'ble'],
    stressIndex: 1,
    focus: 'Long-word rhythm',
    mouthTip: 'Make VAIL the strongest beat and keep the surrounding syllables quick and light.',
    sentence: 'Is this time still available?',
  },
];

function signalText(signal: PronunciationMistakeSignal) {
  return `${signal.original || ''} ${signal.corrected || ''} ${signal.latestExample || ''}`.toLowerCase();
}

export function pronunciationPriority(item: PronunciationItem, mistakes: PronunciationMistakeSignal[]) {
  return mistakes.reduce((score, signal) => {
    const text = signalText(signal);
    if (!text.includes(item.word.toLowerCase())) return score;
    return score + Math.max(1, Number(signal.timesSeen) || 1);
  }, 0);
}

export function prioritizePronunciationItems(items: PronunciationItem[], mistakes: PronunciationMistakeSignal[]) {
  return [...items].sort((a, b) => {
    const boost = pronunciationPriority(b, mistakes) - pronunciationPriority(a, mistakes);
    return boost || a.id.localeCompare(b.id);
  });
}
