export type TwinRole = 'learner' | 'twin';

export type TwinMemoryMessage = {
  role: TwinRole;
  text: string;
};

export type TwinMistake = {
  original?: string;
  corrected?: string;
  reason?: string;
  skill?: string;
  source?: string;
  timesSeen?: number;
};

export type TwinReviewCard = {
  term: string;
  dueAt: number;
  mistakeBoosts?: number;
};

export type TwinProgress = {
  lessonId: string;
  completed?: boolean;
  score?: number;
};

export type TwinLearnerSnapshot = {
  completedLessons: string[];
  weakSkills: Array<{ skill: string; weight: number }>;
  recentMistakes: Array<{ original: string; corrected: string; reason: string; timesSeen: number }>;
  dueReviewTerms: string[];
  recentConversation: TwinMemoryMessage[];
};

function clean(value: unknown, max = 220) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

export function trimTwinConversation(messages: TwinMemoryMessage[], limit = 10): TwinMemoryMessage[] {
  return messages
    .filter(message => (message.role === 'learner' || message.role === 'twin') && clean(message.text))
    .slice(-limit)
    .map(message => ({ role: message.role, text: clean(message.text, 500) }));
}

export function rankWeakSkills(mistakes: TwinMistake[], limit = 5) {
  const weights = new Map<string, number>();
  for (const mistake of mistakes) {
    const skill = clean(mistake.skill || mistake.source || 'general', 60).toLowerCase();
    if (!skill) continue;
    const weight = Math.max(1, Math.min(20, Number(mistake.timesSeen) || 1));
    weights.set(skill, (weights.get(skill) || 0) + weight);
  }
  return [...weights.entries()]
    .map(([skill, weight]) => ({ skill, weight }))
    .sort((a, b) => b.weight - a.weight || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

export function buildTwinSnapshot(input: {
  progress?: TwinProgress[];
  mistakes?: TwinMistake[];
  reviewCards?: TwinReviewCard[];
  conversation?: TwinMemoryMessage[];
  now?: Date;
}): TwinLearnerSnapshot {
  const now = input.now?.getTime() ?? Date.now();
  const mistakes = input.mistakes || [];
  const completedLessons = (input.progress || [])
    .filter(item => item.completed)
    .map(item => clean(item.lessonId, 100))
    .filter(Boolean)
    .slice(-30);

  const recentMistakes = mistakes
    .map(mistake => ({
      original: clean(mistake.original),
      corrected: clean(mistake.corrected),
      reason: clean(mistake.reason),
      timesSeen: Math.max(1, Math.min(50, Number(mistake.timesSeen) || 1)),
    }))
    .filter(mistake => mistake.original || mistake.corrected)
    .sort((a, b) => b.timesSeen - a.timesSeen)
    .slice(0, 8);

  const dueReviewTerms = (input.reviewCards || [])
    .filter(card => Number.isFinite(card.dueAt) && card.dueAt <= now)
    .sort((a, b) => (b.mistakeBoosts || 0) - (a.mistakeBoosts || 0) || a.dueAt - b.dueAt)
    .map(card => clean(card.term, 80))
    .filter(Boolean)
    .slice(0, 10);

  return {
    completedLessons,
    weakSkills: rankWeakSkills(mistakes),
    recentMistakes,
    dueReviewTerms,
    recentConversation: trimTwinConversation(input.conversation || []),
  };
}
