import { describe, expect, it } from 'vitest';
import { definedProfileFields } from '../profilePersistence';

describe('learner profile persistence payload', () => {
  it('drops undefined optional fields before writing to Firestore', () => {
    const payload = definedProfileFields({
      displayName: 'Learner',
      interfaceLanguage: 'French',
      nativeLanguage: 'French',
      explanationLanguage: 'French',
      targetLanguage: 'English',
      learningLanguage: 'English',
      learningGoal: 'Work',
      dailyTargetMinutes: 15,
      cefrLevel: 'B1',
      placementLevel: undefined,
      estimatedOverall: undefined,
      currentCurriculumLevel: undefined,
      onboardingCompleted: undefined,
    });

    expect(payload).toEqual({
      displayName: 'Learner',
      interfaceLanguage: 'French',
      nativeLanguage: 'French',
      explanationLanguage: 'French',
      targetLanguage: 'English',
      learningLanguage: 'English',
      learningGoal: 'Work',
      dailyTargetMinutes: 15,
      cefrLevel: 'B1',
    });
    expect(Object.values(payload)).not.toContain(undefined);
  });
});
