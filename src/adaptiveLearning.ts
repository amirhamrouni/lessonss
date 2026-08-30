export type SkillName = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'pronunciation';

export type SkillLevels = Record<SkillName, string>;

export type PlanInput = {
  dailyTargetMinutes: number;
  dueReviews: number;
  nextLessonId?: string | null;
  weakestSkill?: SkillName | null;
  speakingAvailable?: boolean;
};

export type PlanItem = {
  id: 'review' | 'lesson' | 'weak-skill' | 'speaking';
  minutes: number;
  reason: string;
  lessonId?: string;
  skill?: SkillName;
};

export function buildDailyPlan(input: PlanInput): PlanItem[] {
  const budget = Math.max(5, Math.min(60, Math.round(input.dailyTargetMinutes || 15)));
  const items: PlanItem[] = [];
  let remaining = budget;

  if (input.dueReviews > 0 && remaining >= 3) {
    const minutes = Math.min(remaining, Math.max(3, Math.min(8, Math.ceil(input.dueReviews / 2))));
    items.push({ id: 'review', minutes, reason: `${input.dueReviews} review item${input.dueReviews === 1 ? '' : 's'} due` });
    remaining -= minutes;
  }

  if (input.nextLessonId && remaining >= 5) {
    const minutes = Math.min(remaining, Math.max(5, Math.min(12, Math.round(budget * 0.5))));
    items.push({ id: 'lesson', minutes, reason: 'Continue the next curriculum step', lessonId: input.nextLessonId });
    remaining -= minutes;
  }

  if (input.weakestSkill && remaining >= 4) {
    const minutes = Math.min(remaining, Math.max(4, Math.min(8, remaining)));
    items.push({ id: 'weak-skill', minutes, reason: `Reinforce your weakest measured skill: ${input.weakestSkill}`, skill: input.weakestSkill });
    remaining -= minutes;
  }

  if (input.speakingAvailable && remaining >= 3) {
    items.push({ id: 'speaking', minutes: remaining, reason: 'Turn knowledge into real-time production' });
    remaining = 0;
  }

  if (!items.length && input.nextLessonId) {
    items.push({ id: 'lesson', minutes: budget, reason: 'Continue the next curriculum step', lessonId: input.nextLessonId });
  }

  return items;
}

export function weakestMeasuredSkill(levels?: Partial<SkillLevels> | null): SkillName | null {
  if (!levels) return null;
  const order: SkillName[] = ['speaking','listening','pronunciation','writing','reading','grammar','vocabulary'];
  const rank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
  const measured = order.filter(skill => Boolean(levels[skill] && rank[levels[skill] as string]));
  if (!measured.length) return null;
  return measured.reduce((lowest, skill) => (rank[levels[skill] as string] < rank[levels[lowest] as string] ? skill : lowest));
}
