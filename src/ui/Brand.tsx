import { useNavigate } from 'react-router-dom';

type BrandProps = {
  compact?: boolean;
  showProfile?: boolean;
  profileInitial?: string;
};

export default function Brand({ compact = false, showProfile = false, profileInitial = 'A' }: BrandProps) {
  const nav = useNavigate();
  return (
    <header className={`et-brand ${compact ? 'compact' : ''}`.trim()}>
      <button className="et-brand-home" type="button" onClick={() => nav('/')} aria-label="English Twin home">
        <span className="et-brand-glyph" aria-hidden="true"><i /><i /></span>
        <span className="et-brand-name">English <b>Twin</b></span>
      </button>
      <span className="et-brand-subtitle">Personal English Coach</span>
      {showProfile && (
        <button className="et-profile-dot" type="button" onClick={() => nav('/profile')} aria-label="Profile">
          {profileInitial.slice(0, 1).toUpperCase()}
        </button>
      )}
    </header>
  );
}
