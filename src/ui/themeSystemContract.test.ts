import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path:string){return readFileSync(new URL(path,import.meta.url),'utf8');}

describe('English Twin runtime theme system',()=>{
  it('ships the five approved themes as real runtime choices',()=>{
    const themes=source('../themeSystem.ts');
    for(const theme of ['minimal','nature','neon','cozy','royal']) expect(themes).toContain(`id: '${theme}'`);
    expect(themes).toContain('english-twin-theme-v1');
    expect(themes).toContain('document.documentElement.dataset.theme');
  });
  it('initializes the saved theme before the app renders',()=>{
    const main=source('../main.tsx');
    expect(main).toContain("import { initTheme } from './themeSystem';");
    expect(main).toContain("import './product-themes-v14.css';");
    expect(main.indexOf('initTheme();')).toBeLessThan(main.indexOf('ReactDOM.createRoot'));
  });
  it('mounts an interactive theme chooser on learning shells',()=>{
    const ui=source('./LearningUI.tsx');
    const picker=source('./ThemeSwitcher.tsx');
    expect(ui).toContain('<ThemeSwitcher />');
    expect(picker).toContain('appThemes.map');
    expect(picker).toContain('setAppTheme(next)');
  });
  it('provides visibly distinct palettes rather than a single blue recolor',()=>{
    const css=source('../product-themes-v14.css');
    for(const theme of ['minimal','nature','neon','cozy','royal']) expect(css).toContain(`data-theme='${theme}'`);
    expect(css).toContain('#070b1f');
    expect(css).toContain('#fff5e8');
    expect(css).toContain('#071120');
    expect(css).toContain('#0b8f68');
  });
});
