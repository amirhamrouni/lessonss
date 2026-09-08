import { BookOpen, Dumbbell, Home, Mic2, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { normalizeLanguage, SupportedLanguage } from './languageSupport';

type Props = {
  language?: string | null;
  className?: string;
};

const labels: Record<SupportedLanguage, [string, string, string, string, string]> = {
  English: ['Home', 'Learn', 'Practice', 'Speak', 'Me'],
  Arabic: ['الرئيسية', 'تعلّم', 'تدرّب', 'تحدّث', 'أنا'],
  Dutch: ['Home', 'Leren', 'Oefenen', 'Spreken', 'Ik'],
  French: ['Accueil', 'Apprendre', 'Pratique', 'Parler', 'Moi'],
  German: ['Start', 'Lernen', 'Üben', 'Sprechen', 'Ich'],
  Spanish: ['Inicio', 'Aprender', 'Practicar', 'Hablar', 'Yo'],
};

const icons = [Home, BookOpen, Dumbbell, Mic2, UserRound] as const;

export default function AppDock({ language, className = '' }: Props) {
  const supportLanguage = normalizeLanguage(language || 'English');
  const copy = labels[supportLanguage];
  const items = [
    ['/', copy[0]],
    ['/learn', copy[1]],
    ['/practice', copy[2]],
    ['/speak', copy[3]],
    ['/profile', copy[4]],
  ] as const;

  return (
    <nav className={`dock reference-dock ${className}`.trim()} aria-label="Primary navigation">
      {items.map(([to, label], index) => {
        const Icon = icons[index];
        return (
          <NavLink end={to === '/'} key={to} to={to}>
            <Icon aria-hidden="true" />
            <small>{label}</small>
          </NavLink>
        );
      })}
    </nav>
  );
}
