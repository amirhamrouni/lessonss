import { BookOpen, Dumbbell, Home, Mic2, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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

const routeGroups = [
  ['/'],
  ['/learn'],
  ['/practice', '/review', '/sentence-builder', '/assessment', '/twin'],
  ['/speak', '/pronunciation', '/speak/live'],
  ['/profile', '/mistakes', '/privacy'],
] as const;

function routeMatches(pathname: string, routes: readonly string[]) {
  return routes.some(route => route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`));
}

export default function AppDock({ language, className = '' }: Props) {
  const supportLanguage = normalizeLanguage(language || 'English');
  const copy = labels[supportLanguage];
  const location = useLocation();
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
        const active = routeMatches(location.pathname, routeGroups[index]);
        return (
          <Link
            key={to}
            to={to}
            className={active ? 'active' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <small>{label}</small>
          </Link>
        );
      })}
    </nav>
  );
}
