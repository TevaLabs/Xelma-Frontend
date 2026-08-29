interface IllustrationProps {
  className?: string;
  size?: number;
}

export const NoRoundsIllustration = ({ className, size = 96 }: IllustrationProps) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <ellipse cx="48" cy="48" rx="38" ry="14" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" transform="rotate(-20 48 48)" />
    <ellipse cx="48" cy="48" rx="28" ry="10" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" strokeOpacity="0.2" transform="rotate(15 48 48)" />
    <circle cx="78" cy="36" r="3" fill="#22D3EE" opacity="0.7" />
    <path d="M48 18 L51 42 L74 46 L50 49 L47 72 L44 49 L20 46 L45 42 Z" stroke="#2C4BFD" strokeWidth="2.5" strokeLinejoin="round" fill="#2C4BFD" fillOpacity="0.15" />
    <path d="M48 26 L50 43 L66 45 L49 47 L47 62 L45 47 L28 45 L46 43 Z" fill="#06B6D4" fillOpacity="0.3" />
    <circle cx="48" cy="45" r="4" fill="#22D3EE" />
  </svg>
);

export const NoHistoryIllustration = ({ className, size = 96 }: IllustrationProps) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="20" y="18" width="56" height="64" rx="8" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#2C4BFD" fillOpacity="0.08" />
    <line x1="32" y1="36" x2="64" y2="36" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
    <line x1="32" y1="46" x2="58" y2="46" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.2" />
    <line x1="32" y1="56" x2="52" y2="56" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.15" />
    <path d="M62 62 L65 68 L72 68 L67 72 L68 80 L62 75 L56 80 L57 72 L52 68 L59 68 Z" fill="#22D3EE" fillOpacity="0.4" />
    <circle cx="62" cy="70" r="2" fill="#22D3EE" opacity="0.8" />
  </svg>
);

export const OfflineIllustration = ({ className, size = 96 }: IllustrationProps) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M28 28 L40 36 L28 44" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" />
    <path d="M68 28 L56 36 L68 44" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" />
    <polyline points="48 66 48 54 40 46" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" />
    <line x1="42" y1="60" x2="56" y2="46" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" strokeOpacity="0.5" />
    <circle cx="28" cy="36" r="4" fill="#2C4BFD" fillOpacity="0.4" />
    <circle cx="68" cy="36" r="4" fill="#2C4BFD" fillOpacity="0.4" />
    <circle cx="48" cy="66" r="4" fill="#6366F1" fillOpacity="0.4" />
    <circle cx="40" cy="46" r="3" fill="#06B6D4" fillOpacity="0.3" />
  </svg>
);

export const ChatOfflineIllustration = ({ className, size = 96 }: IllustrationProps) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path
      d="M20 32c0-7.7 6.3-14 14-14h28c7.7 0 14 6.3 14 14v16c0 7.7-6.3 14-14 14H46l-14 12v-12c-6.6-.6-12-6.3-12-13V32Z"
      stroke="#2C4BFD"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#2C4BFD"
      fillOpacity="0.08"
    />
    <line x1="32" y1="30" x2="56" y2="30" stroke="#2C4BFD" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
    <line x1="32" y1="40" x2="48" y2="40" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.2" />
    <circle cx="70" cy="24" r="10" stroke="#2C4BFD" strokeWidth="2" strokeOpacity="0.2" />
    <line x1="64" y1="18" x2="76" y2="30" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" strokeOpacity="0.55" />
    <circle cx="70" cy="24" r="2.5" fill="#EF4444" fillOpacity="0.5" />
  </svg>
);
