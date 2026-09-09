import type {
  ActivityV2,
  CanDoDescriptor,
  CEFRLevel,
  LessonV2,
  ReviewSeedV2,
  SourceBlock,
  UnitV2,
} from './curriculumV2';

export type AdvancedLexicalItem = {
  term: string;
  meaning: string;
  example: string;
  kind?: ReviewSeedV2['kind'];
};

export type AdvancedUnitSpec = {
  slug: string;
  title: string;
  icon: string;
  theme: string;
  lexical: AdvancedLexicalItem[];
  listeningText: string;
  readingTitle: string;
  readingText: string;
  inferenceQuestion: { prompt: string; options: string[]; answer: string; explanation: string };
  grammarFocus: string;
  grammarWrong: string;
  grammarCorrect: string;
  grammarExplanation: string;
  speakingScenario: string;
  learnerRole: string;
  counterpartRole: string;
  proposition: string;
  writingPrompt: string;
  synthesisSources: Array<{ id: string; title: string; text: string }>;
};

export type AdvancedCurriculum = {
  level: 'B1'|'B2'|'C1';
  units: UnitV2[];
  compatibleUnits: Array<{ id: string; title: string; icon: string; lessons: string[] }>;
  lessons: LessonV2[];
};

const plain = (value: string) => ({ format: 'plain_text' as const, value });
const activityId = (lessonId: string, index: number) => `${lessonId}-a${index}`;

function levelWritingRange(level: 'B1'|'B2'|'C1') {
  if (level === 'B1') return { min: 120, max: 200 };
  if (level === 'B2') return { min: 180, max: 300 };
  return { min: 250, max: 450 };
}

function canDo(level: 'B1'|'B2'|'C1', unitId: string, skill: CanDoDescriptor['skill'], mode: CanDoDescriptor['mode'], suffix: string, statement: string): CanDoDescriptor {
  return { id: `${unitId}-${suffix}`, level, skill, mode, statement };
}

function makeLexicalLesson(level: 'B1'|'B2'|'C1', unitId: string, spec: AdvancedUnitSpec): LessonV2 {
  const id = `${unitId}-l1`;
  const descriptors = [
    canDo(level, unitId, 'vocabulary', 'production', 'lexical', `Can use topic-specific vocabulary and useful lexical chunks to communicate about ${spec.theme}.`),
    canDo(level, unitId, 'listening', 'reception', 'listen', `Can follow the key message and relevant detail in a spoken text about ${spec.theme}.`),
  ];
  const activities: ActivityV2[] = spec.lexical.slice(0, 4).map((item, index) => ({
    id: activityId(id, index + 1), type: 'lexical_item', level, skills: ['vocabulary'], instruction: plain('Study the item in context, then say or write your own example.'), required: true, canDoIds: [descriptors[0].id], estimatedMinutes: 2,
    evaluation: { mode: 'deterministic', kind: 'structural' },
    term: item.term, definition: item.meaning, example: item.example,
    lexicalKind: item.kind === 'collocation' ? 'collocation' : item.kind === 'phrasal_verb' ? 'phrasal_verb' : item.kind === 'idiom' ? 'idiom' : item.kind === 'discourse_marker' ? 'discourse_marker' : item.kind === 'functional_phrase' ? 'functional_phrase' : 'word',
  }));
  activities.push({
    id: activityId(id, activities.length + 1), type: 'listening_comprehension', level, skills: ['listening','vocabulary'], instruction: plain('Listen to the short talk and choose the best answer.'), required: true, canDoIds: [descriptors[1].id], estimatedMinutes: 5,
    evaluation: { mode: 'deterministic', kind: 'choice' }, audioText: spec.listeningText,
    questions: [{ id: `${id}-q1`, prompt: 'What is the speaker mainly trying to communicate?', options: [`A practical point about ${spec.theme}`,'An unrelated historical fact','A list of isolated words'], answer: `A practical point about ${spec.theme}`, explanation: 'The talk is organised around one practical message in the unit theme.' }],
  });
  return {
    schemaVersion: 2, contentVersion: `${level.toLowerCase()}.1.0`, id, level, unitId, title: `${spec.title}: language in context`, objective: `Build useful language and listening control for ${spec.theme}.`, primarySkill: 'vocabulary', skills: ['vocabulary','listening'], minutes: 15, canDo: descriptors, prerequisites: {}, activities,
    reviewSeeds: spec.lexical.map((item, index) => ({ id: `${id}-seed-${index + 1}`, sourceLessonId: id, kind: item.kind || 'word', term: item.term, meaning: item.meaning, example: item.example, tags: [level, spec.slug] })),
    assessment: { completionPolicy: 'all_required', masteryThreshold: 70, requiredActivityIds: activities.map(item => item.id) },
  };
}

function makeLanguageLesson(level: 'B1'|'B2'|'C1', unitId: string, spec: AdvancedUnitSpec): LessonV2 {
  const id = `${unitId}-l2`;
  const descriptor = canDo(level, unitId, 'grammar', 'production', 'control', `Can use ${spec.grammarFocus} with enough control to support connected communication.`);
  const activities: ActivityV2[] = [
    { id: activityId(id,1), type:'error_correction', level, skills:['grammar'], instruction:plain(`Focus: ${spec.grammarFocus}`), required:true, canDoIds:[descriptor.id], estimatedMinutes:4, evaluation:{mode:'deterministic',kind:'exact',answer:spec.grammarCorrect}, prompt:'Correct the sentence.', sentence:spec.grammarWrong, answer:spec.grammarCorrect, explanation:spec.grammarExplanation },
    { id: activityId(id,2), type:'paraphrase', level, skills:['grammar','writing'], instruction:plain(`Rewrite the sentence while keeping the meaning. Use ${spec.grammarFocus}.`), required:true, canDoIds:[descriptor.id], estimatedMinutes:5, evaluation:{mode:'hybrid',rubricId:`paraphrase-${level.toLowerCase()}-v1`,rubricVersion:'1',minimumWords:5,maximumWords:60}, sourceText:spec.grammarCorrect, constraints:[`Use ${spec.grammarFocus}`], minimumWords:5, maximumWords:60 },
    { id: activityId(id,3), type:'guided_writing', level, skills:['grammar','writing'], instruction:plain('Write a short connected response using the target pattern naturally.'), required:true, canDoIds:[descriptor.id], estimatedMinutes:7, evaluation:{mode:'hybrid',rubricId:`guided-writing-${level.toLowerCase()}-v1`,rubricVersion:'1',minimumWords:70,maximumWords:160}, prompt:`Explain a realistic situation related to ${spec.theme} and use ${spec.grammarFocus} at least twice.`, scaffolds:['Context','Main point','Example','Closing sentence'], minimumWords:70, maximumWords:160 },
  ];
  return { schemaVersion:2, contentVersion:`${level.toLowerCase()}.1.0`, id, level, unitId, title:`${spec.grammarFocus} in context`, objective:`Use ${spec.grammarFocus} accurately inside connected communication.`, primarySkill:'grammar', skills:['grammar','writing'], minutes:17, canDo:[descriptor], prerequisites:{lessonIds:[`${unitId}-l1`]}, activities, reviewSeeds:[{id:`${id}-pattern`,sourceLessonId:id,kind:'grammar_pattern',term:spec.grammarFocus,meaning:spec.grammarExplanation,example:spec.grammarCorrect,tags:[level,spec.slug]}], assessment:{completionPolicy:'all_required',masteryThreshold:70,requiredActivityIds:activities.map(item=>item.id)} };
}

function makeReadingLesson(level: 'B1'|'B2'|'C1', unitId: string, spec: AdvancedUnitSpec): LessonV2 {
  const id = `${unitId}-l3`;
  const descriptors = [
    canDo(level, unitId, 'reading', 'reception', 'reading', level === 'B1' ? `Can understand the main points and relevant detail in a clear text about ${spec.theme}.` : level === 'B2' ? `Can identify argument, evidence and writer stance in a detailed text about ${spec.theme}.` : `Can interpret complex argument, implication, stance and rhetorical choices in a demanding text about ${spec.theme}.`),
    canDo(level, unitId, 'mediation', 'mediation', 'process-text', `Can process the important meaning of a text about ${spec.theme} for a defined purpose.`),
  ];
  const activities: ActivityV2[] = [
    { id:activityId(id,1), type:'extended_reading', level, skills:['reading'], instruction:plain('Read for overall meaning first, then answer the detail question.'), required:true, canDoIds:[descriptors[0].id], estimatedMinutes:7, evaluation:{mode:'deterministic',kind:'choice'}, passage:plain(spec.readingText), questions:[{id:`${id}-q1`,prompt:'Which statement best captures the central message?',options:[`The text develops a practical perspective on ${spec.theme}`,'The text rejects every possible viewpoint','The text is only a dictionary definition'],answer:`The text develops a practical perspective on ${spec.theme}`,explanation:'The passage develops a connected perspective with reasons and examples.'}] },
    { id:activityId(id,2), type:'reading_inference', level, skills:['reading'], instruction:plain('Choose the inference best supported by the passage.'), required:true, canDoIds:[descriptors[0].id], estimatedMinutes:4, evaluation:{mode:'deterministic',kind:'choice'}, passage:plain(spec.readingText), prompt:spec.inferenceQuestion.prompt, options:spec.inferenceQuestion.options, answer:spec.inferenceQuestion.answer, explanation:spec.inferenceQuestion.explanation },
    { id:activityId(id,3), type:'critical_reading', level, skills:['reading','mediation'], instruction:plain(level === 'B1' ? 'Identify the writer’s main point and one supporting detail.' : level === 'B2' ? 'Identify the main claim, evidence and one limitation.' : 'Evaluate the claim, evidence, assumptions, stance and one implicit implication.'), required:true, canDoIds:descriptors.map(item=>item.id), estimatedMinutes:8, evaluation:{mode:'hybrid',rubricId:`critical-reading-${level.toLowerCase()}-v1`,rubricVersion:'1',minimumWords:level==='B1'?80:level==='B2'?100:140,maximumWords:level==='B1'?160:level==='B2'?220:300,requiredEvidenceReferences:level==='B1'?1:2}, source:plain(spec.readingText), prompt:level === 'B1' ? 'State the main point and support it with one detail from the text.' : level === 'B2' ? 'State the writer’s main claim, cite two supporting details and identify one limitation.' : 'Evaluate the writer’s position using evidence, identify one assumption and explain one implication that is not stated directly.', response:{mode:'structured_text',minimumWords:level==='B1'?80:level==='B2'?100:140,maximumWords:level==='B1'?160:level==='B2'?220:300,requiredEvidenceReferences:level==='B1'?1:2} },
  ];
  return { schemaVersion:2, contentVersion:`${level.toLowerCase()}.1.0`, id, level, unitId, title:spec.readingTitle, objective:`Read extended material about ${spec.theme} and process its meaning critically.`, primarySkill:'reading', skills:['reading','mediation'], minutes:20, canDo:descriptors, prerequisites:{lessonIds:[`${unitId}-l2`]}, activities, assessment:{completionPolicy:'all_required',masteryThreshold:70,requiredActivityIds:activities.map(item=>item.id)} };
}

function makeSpeakingLesson(level: 'B1'|'B2'|'C1', unitId: string, spec: AdvancedUnitSpec): LessonV2 {
  const id = `${unitId}-l4`;
  const descriptors = [
    canDo(level, unitId, 'spoken_interaction', 'interaction', 'interaction', level === 'B1' ? `Can manage a familiar interaction about ${spec.theme}, clarify and give reasons.` : level === 'B2' ? `Can negotiate, defend a viewpoint and respond to counterarguments about ${spec.theme}.` : `Can manage a complex interaction about ${spec.theme} with fluency, nuance and register control.`),
    canDo(level, unitId, 'spoken_production', 'production', 'extended-speaking', `Can produce an organised spoken response about ${spec.theme} appropriate to ${level}.`),
  ];
  const activities: ActivityV2[] = [
    { id:activityId(id,1), type:'roleplay', level, skills:['spoken_interaction'], instruction:plain('Read the situation, then respond as if the other person were present.'), required:true, canDoIds:[descriptors[0].id], estimatedMinutes:6, evaluation:{mode:'structured_ai',rubricId:`roleplay-${level.toLowerCase()}-v1`,rubricVersion:'1'}, scenario:spec.speakingScenario, learnerRole:spec.learnerRole, counterpartRole:spec.counterpartRole, successCriteria:level==='B1'?['state the problem or goal','ask or answer a clarification question','give at least one reason']:level==='B2'?['state a clear position','respond to a counterpoint','negotiate a practical outcome','use polite interaction language']:['manage turns strategically','qualify claims','adapt register','respond to nuance','close with a precise outcome'] },
    { id:activityId(id,2), type:'open_speaking', level, skills:['spoken_production','pronunciation'], instruction:plain('Give an extended spoken response. Aim for clear organisation and intelligibility, not a particular accent.'), required:true, canDoIds:[descriptors[1].id], estimatedMinutes:7, evaluation:{mode:'structured_ai',rubricId:`open-speaking-${level.toLowerCase()}-v1`,rubricVersion:'1'}, prompt:`Speak about this question: ${spec.proposition}`, preparationSeconds:level==='B1'?30:45, targetSeconds:level==='B1'?{min:45,max:90}:level==='B2'?{min:75,max:150}:{min:120,max:240}, successCriteria:level==='B1'?['connected answer','clear reasons','generally intelligible pronunciation']:level==='B2'?['clear position','developed reasons','coherent discourse','effective stress and intonation']:['nuanced position','precise qualification','cohesive extended discourse','strategic prosody and register'] },
    { id:activityId(id,3), type:'argument_builder', level, skills:['spoken_production','writing'], instruction:plain('Build the argument before you speak or write it.'), required:true, canDoIds:[descriptors[1].id], estimatedMinutes:6, evaluation:{mode:'hybrid',rubricId:`argument-${level.toLowerCase()}-v1`,rubricVersion:'1',minimumWords:level==='B1'?80:120,maximumWords:level==='B1'?160:240}, proposition:spec.proposition, requiredParts:level==='B1'?['position','reason','evidence','conclusion']:level==='B2'?['position','reason','evidence','counterargument','rebuttal','conclusion']:['position','reason','evidence','counterargument','rebuttal','conclusion'], minimumWords:level==='B1'?80:120, maximumWords:level==='B1'?160:240 },
  ];
  return { schemaVersion:2, contentVersion:`${level.toLowerCase()}.1.0`, id, level, unitId, title:`Speak: ${spec.title}`, objective:`Interact and speak at ${level} about ${spec.theme}.`, primarySkill:'spoken_interaction', skills:['spoken_interaction','spoken_production','pronunciation'], minutes:19, canDo:descriptors, prerequisites:{lessonIds:[`${unitId}-l3`]}, activities, assessment:{completionPolicy:'all_required',masteryThreshold:70,requiredActivityIds:activities.map(item=>item.id)} };
}

function makeIntegratedLesson(level: 'B1'|'B2'|'C1', unitId: string, spec: AdvancedUnitSpec): LessonV2 {
  const id = `${unitId}-l5`;
  const range = levelWritingRange(level);
  const descriptors = [
    canDo(level, unitId, 'writing', 'production', 'writing', level === 'B1' ? `Can write a connected text about ${spec.theme} with reasons and relevant detail.` : level === 'B2' ? `Can write a detailed organised text about ${spec.theme}, supporting and evaluating a position.` : `Can write a well-structured complex text about ${spec.theme} with nuance, evidence and appropriate register.`),
    canDo(level, unitId, 'mediation', 'mediation', 'synthesis', level === 'B1' ? `Can summarise and relay the main points of clear sources about ${spec.theme}.` : level === 'B2' ? `Can synthesise and compare information and arguments from multiple sources about ${spec.theme}.` : `Can synthesise complex sources about ${spec.theme}, preserving nuance and adapting the result to an audience.`),
  ];
  const sources: SourceBlock[] = spec.synthesisSources.map(source => ({id:source.id,title:source.title,content:plain(source.text)}));
  const activities: ActivityV2[] = [
    { id:activityId(id,1), type:'summarization', level, skills:['mediation','writing'], instruction:plain('Summarise the first source without copying long phrases.'), required:true, canDoIds:[descriptors[1].id], estimatedMinutes:6, evaluation:{mode:'hybrid',rubricId:`summary-${level.toLowerCase()}-v1`,rubricVersion:'1',minimumWords:level==='B1'?60:80,maximumWords:level==='B1'?120:160}, source:sources[0].content, prompt:'Summarise the main message and the most important supporting point.', minimumWords:level==='B1'?60:80, maximumWords:level==='B1'?120:160 },
    level === 'B1'
      ? { id:activityId(id,2), type:'mediation', level, skills:['mediation','writing'], instruction:plain('Relay the useful information to a person who has not read the sources.'), required:true, canDoIds:[descriptors[1].id], estimatedMinutes:8, evaluation:{mode:'hybrid',rubricId:'mediation-b1-v1',rubricVersion:'1',minimumWords:90,maximumWords:180}, sources, prompt:`Explain the most useful information from the sources to someone making a decision about ${spec.theme}.`, audience:'A friend or colleague who needs a clear practical explanation.', minimumWords:90, maximumWords:180 }
      : { id:activityId(id,2), type:'paragraph_synthesis', level, skills:['mediation','writing','reading'], instruction:plain(level==='B2'?'Combine the sources into one coherent paragraph. Compare rather than list them separately.':'S synthesise the sources into a precise paragraph that preserves nuance, contrasts evidence and avoids unsupported claims.'.replace('S synthesise','Synthesise')), required:true, canDoIds:[descriptors[1].id], estimatedMinutes:10, evaluation:{mode:'hybrid',rubricId:`synthesis-${level.toLowerCase()}-v1`,rubricVersion:'1',minimumWords:level==='B2'?130:180,maximumWords:level==='B2'?240:320,requiredEvidenceReferences:2}, sources, prompt:level==='B2'?'S synthesise the two sources, explain where they agree or differ, and support the synthesis with both source IDs.'.replace('S synthesise','Synthesise'):'S synthesise the sources, evaluate the strongest evidence, preserve qualification and explain one important tension between the positions.'.replace('S synthesise','Synthesise'), minimumWords:level==='B2'?130:180, maximumWords:level==='B2'?240:320, requiredSourceIds:sources.map(source=>source.id) },
    { id:activityId(id,3), type:'free_writing', level, skills:['writing','grammar','vocabulary'], instruction:plain('Write the final unit task. Plan, draft and revise before submitting.'), required:true, canDoIds:[descriptors[0].id], estimatedMinutes:12, evaluation:{mode:'structured_ai',rubricId:`extended-writing-${level.toLowerCase()}-v1`,rubricVersion:'1'}, prompt:spec.writingPrompt, minimumWords:range.min, maximumWords:range.max, audience:level==='B1'?'An informed general reader':level==='B2'?'A professional or educated general reader':'A professional, academic or public audience', register:level==='B1'?'neutral':level==='B2'?'neutral-to-formal':'context-appropriate and deliberately controlled' },
  ];
  if (level === 'C1') activities.push({ id:activityId(id,4), type:'presentation', level, skills:['spoken_production','pronunciation','mediation'], instruction:plain('Prepare and deliver a concise presentation based on the unit evidence.'), required:false, canDoIds:descriptors.map(item=>item.id), estimatedMinutes:10, evaluation:{mode:'structured_ai',rubricId:'presentation-c1-v1',rubricVersion:'1'}, topic:spec.proposition, outlineRequirements:['opening position','evidence from the unit','qualification or limitation','clear conclusion'], targetSeconds:{min:180,max:300}, successCriteria:['coherent structure','evidence use','precise register','strategic stress and intonation','fluent delivery'] });
  return { schemaVersion:2, contentVersion:`${level.toLowerCase()}.1.0`, id, level, unitId, title:`Integrate: ${spec.title}`, objective:`Integrate reading, mediation and writing for ${spec.theme}.`, primarySkill:'writing', skills:['writing','mediation','reading'], minutes:level==='C1'?30:26, canDo:descriptors, prerequisites:{lessonIds:[`${unitId}-l4`]}, activities, assessment:{completionPolicy:'all_required',masteryThreshold:70,requiredActivityIds:activities.filter(item=>item.required).map(item=>item.id)} };
}

export function buildAdvancedCurriculum(level: 'B1'|'B2'|'C1', specs: AdvancedUnitSpec[]): AdvancedCurriculum {
  if (specs.length !== 8) throw new Error(`${level} curriculum must define exactly eight units`);
  const units: UnitV2[] = [];
  const compatibleUnits: AdvancedCurriculum['compatibleUnits'] = [];
  const lessons: LessonV2[] = [];

  specs.forEach((spec, index) => {
    const unitId = `${level.toLowerCase()}-u${index + 1}`;
    const lessonSet = [
      makeLexicalLesson(level, unitId, spec),
      makeLanguageLesson(level, unitId, spec),
      makeReadingLesson(level, unitId, spec),
      makeSpeakingLesson(level, unitId, spec),
      makeIntegratedLesson(level, unitId, spec),
    ];
    lessons.push(...lessonSet);
    const canDoIds = lessonSet.flatMap(lesson => lesson.canDo.map(item => item.id));
    units.push({ schemaVersion:2, id:unitId, level, title:`${level} · ${spec.title}`, icon:spec.icon, lessonIds:lessonSet.map(lesson=>lesson.id), canDoIds });
    compatibleUnits.push({ id:unitId, title:`${level} · ${spec.title}`, icon:spec.icon, lessons:lessonSet.map(lesson=>lesson.id) });
  });

  return { level, units, compatibleUnits, lessons };
}
