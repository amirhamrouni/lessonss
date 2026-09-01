export type EntryProfile = {
  onboardingCompleted?: boolean;
  nativeLanguage?: string;
  beginnerFoundationCompleted?: boolean;
};

export type EntryState = {
  authenticated: boolean;
  profile?: EntryProfile | null;
};

export function resolveEntryRoute(state: EntryState): '/welcome' | '/setup' | '/' {
  if (!state.authenticated) return '/welcome';
  const profile = state.profile;
  if (!profile?.onboardingCompleted || !profile?.nativeLanguage) return '/setup';
  return '/';
}

export function resolveFirstLearningRoute(profile?: EntryProfile | null): '/setup' | '/start' | '/learn' {
  if (!profile?.onboardingCompleted || !profile?.nativeLanguage) return '/setup';
  if (!profile.beginnerFoundationCompleted) return '/start';
  return '/learn';
}
