export type PlacementLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PlacementQuestion = {
  id: string;
  level: PlacementLevel;
  skill: 'Vocabulary' | 'Grammar' | 'Reading';
  prompt: string;
  options: string[];
  answer: string;
};

export const placementQuestions: PlacementQuestion[] = [
  { id: 'q1', level: 'A1', skill: 'Grammar', prompt: 'I ___ from Tunisia.', options: ['am', 'is', 'are', 'be'], answer: 'am' },
  { id: 'q2', level: 'A1', skill: 'Vocabulary', prompt: 'Which word means the first meal of the day?', options: ['lunch', 'breakfast', 'dinner', 'snack'], answer: 'breakfast' },
  { id: 'q3', level: 'A2', skill: 'Grammar', prompt: 'She usually ___ to work by bus.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes' },
  { id: 'q4', level: 'A2', skill: 'Reading', prompt: '“The shop closes at 6, but I arrive at 6:15.” What is true?', options: ['I am early', 'The shop is still open', 'I arrive too late', 'The shop opens at 6:15'], answer: 'I arrive too late' },
  { id: 'q5', level: 'B1', skill: 'Grammar', prompt: 'If it rains tomorrow, we ___ at home.', options: ['stay', 'stayed', 'will stay', 'would stay'], answer: 'will stay' },
  { id: 'q6', level: 'B1', skill: 'Vocabulary', prompt: 'Choose the closest meaning to “reliable”.', options: ['easy to break', 'can be trusted', 'very expensive', 'hard to find'], answer: 'can be trusted' },
  { id: 'q7', level: 'B2', skill: 'Grammar', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'was starting tomorrow'], answer: 'had started' },
  { id: 'q8', level: 'B2', skill: 'Reading', prompt: '“Although the proposal was ambitious, the team approved it because the risks were manageable.” Why was it approved?', options: ['It had no risks', 'It was cheap', 'The risks were considered manageable', 'It was not ambitious'], answer: 'The risks were considered manageable' },
  { id: 'q9', level: 'C1', skill: 'Vocabulary', prompt: 'Choose the best synonym for “mitigate” in: “We need to mitigate the impact.”', options: ['increase', 'reduce', 'ignore', 'predict'], answer: 'reduce' },
  { id: 'q10', level: 'C1', skill: 'Grammar', prompt: 'Rarely ___ such a convincing argument.', options: ['I have heard', 'have I heard', 'I heard have', 'heard I'], answer: 'have I heard' },
  { id: 'q11', level: 'C2', skill: 'Reading', prompt: '“His praise was so qualified that it sounded almost like criticism.” What does “qualified” imply here?', options: ['unreserved', 'limited by reservations', 'professionally certified', 'loudly expressed'], answer: 'limited by reservations' },
  { id: 'q12', level: 'C2', skill: 'Vocabulary', prompt: 'Which word best completes: “The evidence was compelling, but not entirely ___.”', options: ['conclusive', 'concluding', 'concluded', 'conclusion'], answer: 'conclusive' },
];

const levelOrder: PlacementLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type PlacementResult = {
  level: PlacementLevel;
  correct: number;
  total: number;
  percent: number;
  skillScores: Record<'Vocabulary' | 'Grammar' | 'Reading', number>;
  skillLevels: Record<'Vocabulary' | 'Grammar' | 'Reading', PlacementLevel>;
};

function estimateSkillLevel(skillName: PlacementQuestion['skill'], answers: Record<string, string>): PlacementLevel {
  const questions = placementQuestions.filter(question => question.skill === skillName);
  let level: PlacementLevel = 'A1';
  for (const candidate of levelOrder) {
    const evidence = questions.filter(question => levelOrder.indexOf(question.level) <= levelOrder.indexOf(candidate));
    if (!evidence.length) continue;
    const answered = evidence.filter(question => answers[question.id] !== undefined);
    if (answered.length !== evidence.length) break;
    const accuracy = answered.filter(question => answers[question.id] === question.answer).length / answered.length;
    if (accuracy >= 0.6) level = candidate;
    else break;
  }
  return level;
}

export function scorePlacement(answers: Record<string, string>): PlacementResult {
  let correct = 0;
  const skill = {
    Vocabulary: { correct: 0, total: 0 },
    Grammar: { correct: 0, total: 0 },
    Reading: { correct: 0, total: 0 },
  };
  const levelBuckets = new Map<PlacementLevel, { correct: number; total: number }>();

  for (const question of placementQuestions) {
    const ok = answers[question.id] === question.answer;
    if (ok) correct += 1;
    skill[question.skill].total += 1;
    if (ok) skill[question.skill].correct += 1;
    const bucket = levelBuckets.get(question.level) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (ok) bucket.correct += 1;
    levelBuckets.set(question.level, bucket);
  }

  let level: PlacementLevel = 'A1';
  for (const candidate of levelOrder) {
    const index = levelOrder.indexOf(candidate);
    const requiredLevels = levelOrder.slice(0, index + 1);
    const passed = requiredLevels.every(current => {
      const bucket = levelBuckets.get(current);
      return bucket ? bucket.correct / bucket.total >= 0.5 : false;
    });
    if (passed) level = candidate;
    else break;
  }

  const toPercent = (value: { correct: number; total: number }) => value.total ? Math.round((value.correct / value.total) * 100) : 0;
  return {
    level,
    correct,
    total: placementQuestions.length,
    percent: Math.round((correct / placementQuestions.length) * 100),
    skillScores: {
      Vocabulary: toPercent(skill.Vocabulary),
      Grammar: toPercent(skill.Grammar),
      Reading: toPercent(skill.Reading),
    },
    skillLevels: {
      Vocabulary: estimateSkillLevel('Vocabulary', answers),
      Grammar: estimateSkillLevel('Grammar', answers),
      Reading: estimateSkillLevel('Reading', answers),
    },
  };
}
