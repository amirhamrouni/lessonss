import { useEffect, useState } from 'react';
import { Check, Palette, X } from 'lucide-react';
import { appThemes, resolveStoredTheme, setAppTheme, type AppTheme } from '../themeSystem';

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(() => resolveStoredTheme());

  useEffect(() => {
    const onTheme = (event: Event) => {
      const next = (event as CustomEvent<AppTheme>).detail;
      if (next) setTheme(next);
    };
    window.addEventListener('english-twin-theme-change', onTheme);
    return () => window.removeEventListener('english-twin-theme-change', onTheme);
  }, []);

  function choose(next: AppTheme) {
    setTheme(next);
    setAppTheme(next);
  }

  return <>
    <button type="button" className="et-theme-fab" aria-label="Change app theme" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {open ? <X /> : <Palette />}
    </button>
    {open ? <div className="et-theme-panel" role="dialog" aria-label="Choose your English Twin theme">
      <div className="et-theme-panel-head"><div><span>YOUR STYLE</span><h2>Choose a theme</h2><p>Same English course. Different atmosphere.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close themes"><X /></button></div>
      <div className="et-theme-grid">
        {appThemes.map(item => <button type="button" key={item.id} className={`et-theme-card ${theme === item.id ? 'active' : ''}`} aria-pressed={theme === item.id} onClick={() => choose(item.id)}>
          <div className={`et-theme-preview theme-${item.id}`} aria-hidden="true"><i/><i/><i/></div>
          <div><b>{item.name}</b><small>{item.tagline}</small></div>
          <span className="et-theme-swatches" aria-hidden="true">{item.swatches.map(color => <i key={color} style={{background:color}} />)}</span>
          {theme === item.id ? <Check className="et-theme-check" /> : null}
        </button>)}
      </div>
    </div> : null}
    {open ? <button type="button" className="et-theme-backdrop" aria-label="Close theme chooser" onClick={() => setOpen(false)} /> : null}
  </>;
}
