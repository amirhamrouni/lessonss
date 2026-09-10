import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path:string){return readFileSync(new URL(path,import.meta.url),'utf8');}

describe('theme mobile screenshot regressions',()=>{
  it('loads the mobile theme hotfix after the theme system',()=>{
    const main=source('../main.tsx');
    expect(main).toContain("import './product-themes-v14.css';");
    expect(main).toContain("import './product-theme-mobile-hotfix-v14.css';");
    expect(main.indexOf("product-theme-mobile-hotfix-v14.css")).toBeGreaterThan(main.indexOf("product-themes-v14.css"));
  });

  it('keeps the theme trigger away from the mobile header',()=>{
    const css=source('../product-theme-mobile-hotfix-v14.css');
    expect(css).toContain('top:auto!important');
    expect(css).toContain('bottom:calc(var(--et-nav-h) + 14px + env(safe-area-inset-bottom))!important');
    expect(css).toContain(".et-shell[dir='rtl'] .et-theme-fab");
  });

  it('hardens Royal and Neon example contrast and mixed-script names',()=>{
    const css=source('../product-theme-mobile-hotfix-v14.css');
    expect(css).toContain("data-theme='royal'");
    expect(css).toContain("data-theme='neon'");
    expect(css).toContain('.et-language-pair .et-target strong');
    expect(css).toContain('unicode-bidi:plaintext');
    expect(css).toContain('.et-level-chip');
  });
});
