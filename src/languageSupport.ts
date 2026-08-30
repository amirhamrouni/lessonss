export type SupportedLanguage = 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';

export type SkillLevels = {
  speaking: string;
  listening: string;
  reading: string;
  writing: string;
  grammar: string;
  vocabulary: string;
};

export const supportedLanguages: Array<{ value: SupportedLanguage; label: string; nativeLabel: string; dir: 'ltr' | 'rtl' }> = [
  { value: 'Arabic', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { value: 'Dutch', label: 'Dutch', nativeLabel: 'Nederlands', dir: 'ltr' },
  { value: 'French', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  { value: 'German', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  { value: 'Spanish', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  { value: 'English', label: 'English', nativeLabel: 'English', dir: 'ltr' },
];

export const defaultSkillLevels = (level = 'A1'): SkillLevels => ({
  speaking: level,
  listening: level,
  reading: level,
  writing: level,
  grammar: level,
  vocabulary: level,
});

const copy: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    learn: 'Learn', choose: 'Choose the best answer', fill: 'Complete the English sentence', check: 'Check answer', continue: 'Continue', correct: 'Correct', retry: 'Not quite', explanation: 'Why?', support: 'Explanation language', target: 'Answer in English', hint: 'Hint', nativeQuestion: 'Read the task and answer in English.',
  },
  Arabic: {
    learn: 'تعلّم', choose: 'اختر الإجابة الإنجليزية الأنسب', fill: 'أكمل الجملة الإنجليزية', check: 'تحقق من الإجابة', continue: 'متابعة', correct: 'إجابة صحيحة', retry: 'ليست الإجابة الصحيحة بعد', explanation: 'لماذا؟', support: 'لغة الشرح', target: 'أجب بالإنجليزية', hint: 'تلميح', nativeQuestion: 'اقرأ المطلوب ثم أجب بالإنجليزية.',
  },
  Dutch: {
    learn: 'Leren', choose: 'Kies het beste Engelse antwoord', fill: 'Vul de Engelse zin aan', check: 'Controleer antwoord', continue: 'Doorgaan', correct: 'Goed', retry: 'Nog niet helemaal', explanation: 'Waarom?', support: 'Uitlegtaal', target: 'Antwoord in het Engels', hint: 'Hint', nativeQuestion: 'Lees de opdracht en antwoord in het Engels.',
  },
  French: {
    learn: 'Apprendre', choose: 'Choisis la meilleure réponse en anglais', fill: 'Complète la phrase anglaise', check: 'Vérifier', continue: 'Continuer', correct: 'Correct', retry: 'Pas encore', explanation: 'Pourquoi ?', support: "Langue d'explication", target: 'Réponds en anglais', hint: 'Indice', nativeQuestion: 'Lis la consigne puis réponds en anglais.',
  },
  German: {
    learn: 'Lernen', choose: 'Wähle die beste englische Antwort', fill: 'Vervollständige den englischen Satz', check: 'Antwort prüfen', continue: 'Weiter', correct: 'Richtig', retry: 'Noch nicht ganz', explanation: 'Warum?', support: 'Erklärungssprache', target: 'Antworte auf Englisch', hint: 'Hinweis', nativeQuestion: 'Lies die Aufgabe und antworte auf Englisch.',
  },
  Spanish: {
    learn: 'Aprender', choose: 'Elige la mejor respuesta en inglés', fill: 'Completa la frase en inglés', check: 'Comprobar', continue: 'Continuar', correct: 'Correcto', retry: 'Todavía no', explanation: '¿Por qué?', support: 'Idioma de explicación', target: 'Responde en inglés', hint: 'Pista', nativeQuestion: 'Lee la tarea y responde en inglés.',
  },
};

export function normalizeLanguage(value?: string): SupportedLanguage {
  return supportedLanguages.some(item => item.value === value) ? value as SupportedLanguage : 'English';
}

export function t(language: string | undefined, key: string): string {
  const lang = normalizeLanguage(language);
  return copy[lang][key] || copy.English[key] || key;
}

export function directionFor(language?: string): 'ltr' | 'rtl' {
  return supportedLanguages.find(item => item.value === normalizeLanguage(language))?.dir || 'ltr';
}

export function immersionSupportPercent(level?: string): number {
  switch ((level || 'A1').toUpperCase()) {
    case 'A1': return 70;
    case 'A2': return 50;
    case 'B1': return 30;
    case 'B2': return 15;
    default: return 5;
  }
}
