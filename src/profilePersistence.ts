import type { SupportedLanguage } from './languageSupport';

export type PersistedLearnerProfile = {
  displayName: string;
  interfaceLanguage: SupportedLanguage;
  nativeLanguage: SupportedLanguage;
  explanationLanguage: SupportedLanguage;
  targetLanguage: 'English';
  learningLanguage: 'English';
  learningGoal: string;
  dailyTargetMinutes: number;
  cefrLevel?: string;
  placementLevel?: string;
  estimatedOverall?: string;
  currentCurriculumLevel?: string;
  onboardingCompleted?: boolean;
};

export function definedProfileFields(profile: PersistedLearnerProfile): Record<string, string | number | boolean> {
  const entries = Object.entries(profile).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Record<string, string | number | boolean>;
}
