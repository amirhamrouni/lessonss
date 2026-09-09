import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import AppDock from '../AppDock';

export function LearningShell({
  children,
  language,
  dir = 'ltr',
  className = '',
  showDock = true,
}: {
  children: ReactNode;
  language?: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
  showDock?: boolean;
}) {
  return (
    <div className={`app-shell et-shell ${className}`.trim()} dir={dir}>
      <div className="phone et-phone">
        <main className="page et-page">{children}</main>
        {showDock ? <AppDock language={language} /> : null}
      </div>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="et-page-title">
      <div>
        {eyebrow ? <span className="et-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="et-page-title-action">{action}</div> : null}
    </header>
  );
}

export function SectionTitle({
  title,
  meta,
  action,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="et-section-title">
      <div>
        <h2>{title}</h2>
        {meta ? <p>{meta}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="et-progress-group">
      {label ? <div className="et-progress-label"><span>{label}</span><b>{Math.round(safe)}%</b></div> : null}
      <div className="et-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)}>
        <i style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

export function Surface({
  children,
  className = '',
  tone = 'default',
  ...rest
}: HTMLAttributes<HTMLElement> & { tone?: 'default' | 'soft' | 'blue' | 'teal' | 'danger' }) {
  return <section className={`et-surface et-surface-${tone} ${className}`.trim()} {...rest}>{children}</section>;
}

export function ETButton({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' }) {
  return <button className={`et-button et-button-${variant} ${className}`.trim()} {...rest}>{children}</button>;
}

export function LanguagePair({
  english,
  support,
  supportLabel,
  compact = false,
}: {
  english: ReactNode;
  support?: ReactNode;
  supportLabel?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`et-language-pair ${compact ? 'compact' : ''}`}>
      <div className="et-target" dir="ltr">
        <span>English</span>
        <strong>{english}</strong>
      </div>
      {support ? (
        <div className="et-support">
          <span>{supportLabel || 'Support'}</span>
          <p>{support}</p>
        </div>
      ) : null}
    </div>
  );
}

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong';

export function ChoiceButton({
  state = 'idle',
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { state?: ChoiceState }) {
  return <button className={`et-choice et-choice-${state} ${className}`.trim()} {...rest}>{children}</button>;
}

export function FeedbackBanner({
  ok,
  title,
  children,
}: {
  ok: boolean;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`et-feedback ${ok ? 'ok' : 'bad'}`} role="status">
      <span className="et-feedback-icon">{ok ? <CheckCircle2 /> : <XCircle />}</span>
      <div><b>{title}</b>{children ? <div className="et-feedback-copy">{children}</div> : null}</div>
    </div>
  );
}

export function TaskRow({
  icon,
  title,
  meta,
  action,
  complete = false,
}: {
  icon: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  complete?: boolean;
}) {
  return (
    <div className={`et-task-row ${complete ? 'complete' : ''}`}>
      <span className="et-task-icon">{icon}</span>
      <div className="et-task-copy"><b>{title}</b>{meta ? <small>{meta}</small> : null}</div>
      {action ? <div className="et-task-action">{action}</div> : null}
    </div>
  );
}
