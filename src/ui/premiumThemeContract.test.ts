import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('English Twin premium blue visual direction', () => {
  it('loads the approved v13 layer after the existing stable product layers', () => {
    const main = source('../main.tsx');
    const stable = main.indexOf("import './product-system-v12.css';");
    const advanced = main.indexOf("import './advanced-learning-v12.css';");
    const premium = main.indexOf("import './product-system-v13.css';");
    expect(stable).toBeGreaterThanOrEqual(0);
    expect(advanced).toBeGreaterThan(stable);
    expect(premium).toBeGreaterThan(advanced);
  });

  it('keeps a premium white and blue learning hierarchy without changing app behavior', () => {
    const css = source('../product-system-v13.css');
    expect(css).toContain('--et-bg: #f6f9ff');
    expect(css).toContain('--et-brand: #1268ee');
    expect(css).toContain('.et-recommendation');
    expect(css).toContain('.et-cefr-tabs');
    expect(css).toContain('.et-activity');
    expect(css).toContain('.et-profile-overview');
    expect(css).toContain('.et-language-pair');
    expect(css).toContain('@media (max-width: 360px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('[dir="rtl"]');
  });

  it('keeps PWA and browser chrome aligned with the approved canvas', () => {
    const html = source('../../index.html');
    const manifest = source('../../public/manifest.webmanifest');
    expect(html).toContain('name="theme-color" content="#f6f9ff"');
    expect(manifest).toContain('"background_color": "#f6f9ff"');
    expect(manifest).toContain('"theme_color": "#f6f9ff"');
  });
});
