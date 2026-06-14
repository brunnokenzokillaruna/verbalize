function IconPRON({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="11" y="2" width="10" height="17" rx="5" fill="currentColor"/>
      <rect x="12" y="4" width="4" height="7" rx="2" fill="rgba(255,255,255,0.25)"/>
      <line x1="13" y1="10" x2="19" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="19" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M7 16 Q7 25 16 25 Q25 25 25 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <line x1="16" y1="25" x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="11" y1="30" x2="21" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconGRAM({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 8 C13 6 7 6 4 8 L4 26 C7 24 13 24 16 26 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M16 8 C19 6 25 6 28 8 L28 26 C25 24 19 24 16 26 Z" fill="currentColor"/>
      <line x1="16" y1="8" x2="16" y2="26" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <line x1="19" y1="13" x2="25" y2="13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="17" x2="25" y2="17" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="21" x2="23" y2="21" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="17" x2="13" y2="17" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="21" x2="11" y2="21" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconVOC({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3 C10.48 3 6 7.48 6 13 C6 16.7 7.96 19.93 10.9 21.6 L10.9 24.5 L21.1 24.5 L21.1 21.6 C24.04 19.93 26 16.7 26 13 C26 7.48 21.52 3 16 3 Z" fill="currentColor"/>
      <ellipse cx="12.5" cy="9" rx="2.5" ry="3.5" fill="rgba(255,255,255,0.22)" transform="rotate(-20 12.5 9)"/>
      <rect x="11" y="24.5" width="10" height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.75"/>
      <rect x="11.5" y="27.5" width="9"  height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.5"/>
      <path d="M12 13.5 L15 16.5 L20.5 10" stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function IconDIAL({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="14" rx="5" fill="currentColor"/>
      <path d="M5 16 L3 23 L11 17 Z" fill="currentColor"/>
      <circle cx="8"  cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <circle cx="14" cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <circle cx="20" cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <rect x="10" y="18" width="20" height="12" rx="4" fill="currentColor" fillOpacity="0.6"/>
      <path d="M27 30 L30 32 L22 30 Z" fill="currentColor" fillOpacity="0.6"/>
      <line x1="15" y1="24" x2="25" y2="24" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconMISS({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M3 26 L5.5 12 L12 19 L16 8 L20 19 L26.5 12 L29 26 Z" fill="currentColor"/>
      <rect x="3" y="26" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.8"/>
      <circle cx="5.5"  cy="12" r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="16"   cy="8"  r="2.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="26.5" cy="12" r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="16" cy="28" r="1.5" fill="rgba(255,255,255,0.6)"/>
      <circle cx="8"  cy="28" r="1" fill="rgba(255,255,255,0.35)"/>
      <circle cx="24" cy="28" r="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

function IconVERB({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="5" fill="currentColor" />
      <path d="M16 8V5M16 27v-3M8 16H5m22 0h-3M10.3 10.3L8.2 8.2m15.5 15.5l-2.1-2.1m0-11.3l2.1-2.1M8.2 23.8l2.1-2.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 16c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6z" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
    </svg>
  );
}

function IconEXPR({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4C9.4 4 4 8.5 4 14c0 2.2 0.8 4.2 2.3 5.8L4 26l6.5-2.5c1.7 0.9 3.6 1.5 5.5 1.5 6.6 0 12-4.5 12-10s-5.4-10-12-10z" fill="currentColor" fillOpacity="0.4" />
      <path d="M16 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="white" />
      <path d="M22 15l0.5 1 1 0.5-1 0.5-0.5 1-0.5-1-1-0.5 1-0.5 0.5-1z" fill="white" fillOpacity="0.8" />
      <path d="M12 17l0.5 1 1 0.5-1 0.5-0.5 1-0.5-1-1-0.5 1-0.5 0.5-1z" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

function IconCULT({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M26 20c0 4-10 6-10 6s-10-2-10-6c0-4 4-8 10-8s10 4 10 8z" fill="currentColor" />
      <path d="M16 12V8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 8h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

export function getTagIcon(tag: string, size = 30) {
  switch (tag) {
    case 'PRON': return <IconPRON size={size} />;
    case 'GRAM': return <IconGRAM size={size} />;
    case 'VOC':  return <IconVOC  size={size} />;
    case 'DIAL': return <IconDIAL size={size} />;
    case 'MISS': return <IconMISS size={size} />;
    case 'VERB': return <IconVERB size={size} />;
    case 'EXPR': return <IconEXPR size={size} />;
    case 'CULT': return <IconCULT size={size} />;
    default:     return <IconGRAM size={size} />;
  }
}
