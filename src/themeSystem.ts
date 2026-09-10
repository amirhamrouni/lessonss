export type AppTheme = 'minimal' | 'nature' | 'neon' | 'cozy' | 'royal';

export const DEFAULT_THEME: AppTheme = 'minimal';
export const THEME_STORAGE_KEY = 'english-twin-theme-v1';

export const appThemes: Array<{
  id: AppTheme;
  name: string;
  tagline: string;
  swatches: [string, string, string];
}> = [
  { id: 'minimal', name: 'Minimal', tagline: 'Clean · Simple · Focused', swatches: ['#f6f9ff','#1268ee','#10234f'] },
  { id: 'nature', name: 'Nature', tagline: 'Calm · Natural · Balanced', swatches: ['#eff8f3','#0b8f68','#173f34'] },
  { id: 'neon', name: 'Neon', tagline: 'Bold · Modern · Focused', swatches: ['#080d25','#9b5cff','#19e5cb'] },
  { id: 'cozy', name: 'Cozy', tagline: 'Warm · Friendly · Comfortable', swatches: ['#fff6e9','#e77a1f','#6d3b1b'] },
  { id: 'royal', name: 'Royal', tagline: 'Elegant · Premium · Distinctive', swatches: ['#081225','#d4a33b','#f6e7b7'] },
];

export function isAppTheme(value: unknown): value is AppTheme {
  return appThemes.some(theme => theme.id === value);
}

export function resolveStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(stored) ? stored : DEFAULT_THEME;
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'neon' || theme === 'royal' ? 'dark' : 'light';
}

export function setAppTheme(theme: AppTheme) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent('english-twin-theme-change', { detail: theme }));
  }
}

export function initTheme() {
  applyTheme(resolveStoredTheme());
}
