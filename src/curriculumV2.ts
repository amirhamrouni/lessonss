import type { Lesson as LegacyLesson } from './curriculum';

export type CEFRLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export const cefrLevels: CEFRLevel[] = ['A0','A1','A2','B1','B2','C1'];

export type Skill =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'spoken_interaction'
  | 'spoken_production'
  | 'writing'
  | 'pronunciation'
  | 'mediation';

export type CommunicativeMode = 'reception' | 'production' | 'interaction' | 'mediation';

export type ContentBlock =
  | { format: 'plain_text'; value: string }
  | { format: 'markdown'; value: string };

export type CanDoDescriptor = {
  id: string;
  level: CEFRLevel;
  mode: CommunicativeMode;
  skill: Skill;
  statement: string;
  sourceRef?: string;
};

export type DeterministicEvaluationSpec = {
  mode: 'deterministic';
  kind: 'exact' | 'choice' | 'ordered_tokens' | 'evidence_selection' | 'structural';
  answer?: string;
  acceptedAnswers?: string[];
  minimumWords?: number;
  maximumWords?: number;
  requiredEvidenceReferences?: number;
};

export type StructuredAIEvaluationSpec = {
  mode: 'structured_ai';
  rubricId: string;
  rubricVersion?: string;
};

export type HybridEvaluationSpec = {
  mode: 'hybrid';
  rubricId: string;
  rubricVersion?: string;
  minimumWords?: number;
  maximumWords?: number;
  requiredEvidenceReferences?: number;
};

export type EvaluationSpec = DeterministicEvaluationSpec | StructuredAIEvaluationSpec | HybridEvaluationSpec;

export type BaseActivityV2 = {
  id: string;
  type: string;
  level: CEFRLevel;
  skills: Skill[];
  instruction: ContentBlock;
  required: boolean;
  canDoIds: string[];
  estimatedMinutes: number;
  evaluation: EvaluationSpec;
};

export type SourceBlock = {
  id: string;
  title?: string;
  content: ContentBlock;
};

export type ExtendedReadingActivity = BaseActivityV2 & {
  type: 'extended_reading';
  passage: ContentBlock;
  questions: Array<{ id: string; prompt: string; options: string[]; answer: string; explanation: string }>;
};

export type ReadingInferenceActivity = BaseActivityV2 & {
  type: 'reading_inference';
  passage: ContentBlock;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type CriticalReadingActivity = BaseActivityV2 & {
  type: 'critical_reading';
  source: ContentBlock;
  prompt: string;
  response: { mode: 'structured_text'; minimumWords: number; maximumWords: number; requiredEvidenceReferences: number };
};

export type ListeningComprehensionActivity = BaseActivityV2 & {
  type: 'listening_comprehension';
  audioText: string;
  questions: Array<{ id: string; prompt: string; options: string[]; answer: string; explanation: string }>;
};

export type DictationActivity = BaseActivityV2 & {
  type: 'dictation';
  audioText: string;
  answer: string;
};

export type LexicalItemActivity = BaseActivityV2 & {
  type: 'lexical_item';
  term: string;
  definition: string;
  example: string;
  lexicalKind: 'word' | 'collocation' | 'phrasal_verb' | 'idiom' | 'discourse_marker' | 'functional_phrase';
};

export type CollocationActivity = BaseActivityV2 & {
  type: 'collocation';
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type ParaphraseActivity = BaseActivityV2 & {
  type: 'paraphrase';
  sourceText: string;
  constraints?: string[];
  minimumWords?: number;
  maximumWords?: number;
};

export type ErrorCorrectionActivity = BaseActivityV2 & {
  type: 'error_correction';
  prompt: string;
  sentence: string;
  answer: string;
  explanation: string;
};

export type GuidedWritingActivity = BaseActivityV2 & {
  type: 'guided_writing';
  prompt: string;
  scaffolds: string[];
  minimumWords: number;
  maximumWords: number;
  audience?: string;
  register?: string;
};

export type FreeWritingActivity = BaseActivityV2 & {
  type: 'free_writing';
  prompt: string;
  minimumWords: number;
  maximumWords: number;
  audience?: string;
  register?: string;
};

export type ParagraphSynthesisActivity = BaseActivityV2 & {
  type: 'paragraph_synthesis';
  sources: SourceBlock[];
  prompt: string;
  minimumWords: number;
  maximumWords: number;
  requiredSourceIds: string[];
};

export type SummarizationActivity = BaseActivityV2 & {
  type: 'summarization';
  source: ContentBlock;
  prompt: string;
  minimumWords: number;
  maximumWords: number;
};

export type ArgumentBuilderActivity = BaseActivityV2 & {
  type: 'argument_builder';
  proposition: string;
  requiredParts: Array<'position'|'reason'|'evidence'|'counterargument'|'rebuttal'|'conclusion'>;
  minimumWords: number;
  maximumWords: number;
};

export type RoleplayActivity = BaseActivityV2 & {
  type: 'roleplay';
  scenario: string;
  learnerRole: string;
  counterpartRole: string;
  successCriteria: string[];
};

export type OpenSpeakingActivity = BaseActivityV2 & {
  type: 'open_speaking';
  prompt: string;
  preparationSeconds?: number;
  targetSeconds?: { min: number; max: number };
  successCriteria: string[];
};

export type MediationActivity = BaseActivityV2 & {
  type: 'mediation';
  sources: SourceBlock[];
  prompt: string;
  audience: string;
  minimumWords: number;
  maximumWords: number;
};

export type SourceComparisonActivity = BaseActivityV2 & {
  type: 'source_comparison';
  sources: SourceBlock[];
  prompt: string;
  minimumWords: number;
  maximumWords: number;
  dimensions: string[];
};

export type PresentationActivity = BaseActivityV2 & {
  type: 'presentation';
  topic: string;
  outlineRequirements: string[];
  targetSeconds: { min: number; max: number };
  successCriteria: string[];
};

export type ActivityV2 =
  | ExtendedReadingActivity
  | ReadingInferenceActivity
  | CriticalReadingActivity
  | ListeningComprehensionActivity
  | DictationActivity
  | LexicalItemActivity
  | CollocationActivity
  | ParaphraseActivity
  | ErrorCorrectionActivity
  | GuidedWritingActivity
  | FreeWritingActivity
  | ParagraphSynthesisActivity
  | SummarizationActivity
  | ArgumentBuilderActivity
  | RoleplayActivity
  | OpenSpeakingActivity
  | MediationActivity
  | SourceComparisonActivity
  | PresentationActivity;

export type ReviewSeedV2 = {
  id: string;
  sourceLessonId: string;
  kind: 'word' | 'collocation' | 'phrasal_verb' | 'idiom' | 'discourse_marker' | 'grammar_pattern' | 'functional_phrase';
  term: string;
  meaning: string;
  example: string;
  tags?: string[];
};

export type LessonV2 = {
  schemaVersion: 2;
  contentVersion: string;
  id: string;
  level: CEFRLevel;
  unitId: string;
  title: string;
  objective: string;
  primarySkill: Skill;
  skills: Skill[];
  minutes: number;
  canDo: CanDoDescriptor[];
  prerequisites: { lessonIds?: string[]; skillMinimums?: Partial<Record<Skill, CEFRLevel>> };
  activities: ActivityV2[];
  reviewSeeds?: ReviewSeedV2[];
  assessment: { completionPolicy: 'all_required' | 'weighted'; masteryThreshold: number; requiredActivityIds: string[] };
};

export type UnitV2 = {
  schemaVersion: 2;
  id: string;
  level: CEFRLevel;
  title: string;
  icon: string;
  lessonIds: string[];
  canDoIds: string[];
};

export const cefrCapabilityMatrix: Record<'B1'|'B2'|'C1', Record<Skill,string>> = {
  B1: {
    vocabulary: 'Use a sufficient repertoire for familiar everyday, study and work situations and paraphrase when a word is missing.',
    grammar: 'Maintain reasonable control of frequent patterns while communicating connected meaning.',
    reading: 'Understand the main points and relevant detail in clear texts on familiar matters.',
    listening: 'Understand the main points of clear standard speech on familiar matters.',
    spoken_interaction: 'Enter, maintain and close familiar conversations, ask for clarification and exchange opinions.',
    spoken_production: 'Produce connected speech about experiences, plans, reasons and opinions.',
    writing: 'Write simple connected texts such as emails, reviews, narratives and short opinion texts.',
    pronunciation: 'Remain generally intelligible while improving stress, rhythm and common sound contrasts.',
    mediation: 'Relay and summarise the main points of clear, structured and familiar information.',
  },
  B2: {
    vocabulary: 'Use a broad repertoire, common collocations and discourse markers to express viewpoints with precision.',
    grammar: 'Maintain relatively high grammatical control in complex connected discourse.',
    reading: 'Understand complex texts, writer stance, argument structure and significant implicit links.',
    listening: 'Follow extended standard speech, presentations and discussions containing complex ideas.',
    spoken_interaction: 'Interact with reasonable fluency, defend viewpoints, negotiate and respond to counterarguments.',
    spoken_production: 'Produce clear detailed extended discourse with organised argument and comparison.',
    writing: 'Produce detailed essays, reports, reviews and professional texts with organised support for a position.',
    pronunciation: 'Use stress, rhythm, linking and intonation to support meaning across extended speech.',
    mediation: 'S synthesise arguments and information from multiple sources and compare viewpoints for a target audience.'.replace('S synthesise','Synthesise'),
  },
  C1: {
    vocabulary: 'Use a broad flexible lexical repertoire with collocational precision, nuance and register control.',
    grammar: 'Maintain consistently high grammatical control across complex structures with rare non-disruptive errors.',
    reading: 'Understand long demanding texts, implicit meaning, rhetorical choices, bias and specialised discourse.',
    listening: 'Understand extended abstract or complex speech and infer stance, relationships and unstated meaning.',
    spoken_interaction: 'Interact fluently and flexibly, manage turns strategically and adapt register to context.',
    spoken_production: 'Produce fluent well-structured extended discourse with nuance, emphasis and precise qualification.',
    writing: 'Write well-structured complex texts for academic, professional and public audiences with appropriate register.',
    pronunciation: 'Control connected-speech prosody, strategic stress and intonation to express stance and nuance.',
    mediation: 'Process, synthesise and adapt complex source material while preserving evidence, nuance and audience needs.',
  },
};

const legacySkillMap: Record<LegacyLesson['skill'], Skill> = {
  Vocabulary: 'vocabulary',
  Grammar: 'grammar',
  Reading: 'reading',
  Speaking: 'spoken_production',
  Listening: 'listening',
  Review: 'vocabulary',
};

export function explicitLevelFromLegacyId(id: string): CEFRLevel {
  if (id.startsWith('a2-')) return 'A2';
  if (id.startsWith('a1-')) return 'A1';
  return 'A1';
}

export function adaptLegacyLesson(lesson: LegacyLesson): LessonV2 {
  const level = explicitLevelFromLegacyId(lesson.id);
  const primarySkill = legacySkillMap[lesson.skill];
  const canDoId = `${lesson.id}-legacy-can-do`;
  return {
    schemaVersion: 2,
    contentVersion: 'legacy-1',
    id: lesson.id,
    level,
    unitId: lesson.unitId,
    title: lesson.title,
    objective: lesson.objective,
    primarySkill,
    skills: [primarySkill],
    minutes: lesson.minutes,
    canDo: [{ id: canDoId, level, mode: primarySkill === 'spoken_production' ? 'production' : primarySkill === 'reading' || primarySkill === 'listening' ? 'reception' : 'production', skill: primarySkill, statement: lesson.objective }],
    prerequisites: {},
    activities: [],
    assessment: { completionPolicy: 'all_required', masteryThreshold: 70, requiredActivityIds: [] },
  };
}

export function isLessonV2(value: unknown): value is LessonV2 {
  return Boolean(value && typeof value === 'object' && (value as { schemaVersion?: unknown }).schemaVersion === 2);
}

export function validateLessonV2(lesson: LessonV2): string[] {
  const errors: string[] = [];
  if (lesson.schemaVersion !== 2) errors.push('schemaVersion must be 2');
  if (!lesson.id.trim()) errors.push('id is required');
  if (!cefrLevels.includes(lesson.level)) errors.push('invalid level');
  if (!lesson.unitId.trim()) errors.push('unitId is required');
  if (lesson.canDo.length === 0) errors.push('at least one canDo descriptor is required');
  if (lesson.activities.length === 0) errors.push('at least one activity is required');
  if (lesson.minutes < 5) errors.push('minutes must be at least 5');
  const activityIds = lesson.activities.map(activity => activity.id);
  if (new Set(activityIds).size !== activityIds.length) errors.push('activity ids must be unique');
  for (const activity of lesson.activities) {
    if (activity.level !== lesson.level) errors.push(`activity ${activity.id} level must match lesson level`);
    if (!activity.canDoIds.every(id => lesson.canDo.some(item => item.id === id))) errors.push(`activity ${activity.id} references unknown canDo id`);
  }
  if (!lesson.assessment.requiredActivityIds.every(id => activityIds.includes(id))) errors.push('assessment references unknown activity id');
  return errors;
}
