const FLOATING_WORDS = [
  { text: 'bonjour', x: '8%', y: '12%', opacity: 0.09, rotate: -14, size: '2rem' },
  { text: 'hello', x: '62%', y: '7%', opacity: 0.07, rotate: 6, size: '1.6rem' },
  { text: 'bom dia', x: '38%', y: '22%', opacity: 0.06, rotate: -5, size: '1.2rem' },
  { text: 'merci', x: '14%', y: '42%', opacity: 0.08, rotate: 9, size: '1.9rem' },
  { text: 'obrigado', x: '54%', y: '38%', opacity: 0.06, rotate: -16, size: '1.1rem' },
  { text: 'beautiful', x: '22%', y: '62%', opacity: 0.06, rotate: 11, size: '1.4rem' },
  { text: 'café', x: '68%', y: '57%', opacity: 0.09, rotate: -7, size: '2.3rem' },
  { text: 'amour', x: '9%', y: '78%', opacity: 0.07, rotate: 5, size: '1.7rem' },
  { text: 'freedom', x: '48%', y: '73%', opacity: 0.06, rotate: -3, size: '1.3rem' },
  { text: 'bienvenue', x: '27%', y: '87%', opacity: 0.07, rotate: 13, size: '1.1rem' },
  { text: 'welcome', x: '70%', y: '83%', opacity: 0.06, rotate: -8, size: '1.4rem' },
  { text: 'voilà', x: '78%', y: '28%', opacity: 0.08, rotate: 8, size: '2rem' },
  { text: 'merveilleux', x: '42%', y: '50%', opacity: 0.05, rotate: -20, size: '1rem' },
  { text: 'língua', x: '5%', y: '55%', opacity: 0.06, rotate: 3, size: '1.5rem' },
  { text: 'lumière', x: '83%', y: '46%', opacity: 0.07, rotate: -4, size: '1.3rem' },
];

export function BrandPanel() {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
      style={{ backgroundColor: '#0a1628' }}
    >
      {/* Radial warm glow — bottom right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 80% 80%, rgba(217,119,6,0.18) 0%, transparent 70%)',
        }}
      />
      {/* Top left soft glow */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(29,94,212,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Floating words — typographic texture */}
      {FLOATING_WORDS.map((w) => (
        <span
          key={w.text}
          className="pointer-events-none absolute select-none font-display"
          style={{
            left: w.x,
            top: w.y,
            opacity: w.opacity,
            transform: `rotate(${w.rotate}deg)`,
            fontSize: w.size,
            color: '#ffffff',
            fontStyle: 'italic',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {w.text}
        </span>
      ))}

      {/* Logo */}
      <div className="relative z-10">
        <h1
          className="font-display text-5xl font-bold tracking-tight"
          style={{ color: '#ffffff' }}
        >
          Verbalize
        </h1>
        <p
          className="mt-3 text-lg font-light italic"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Aprenda o mundo.
        </p>
      </div>

      {/* Bottom quote */}
      <blockquote className="relative z-10">
        <p
          className="text-base leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          &ldquo;Uma língua diferente é uma visão diferente da vida.&rdquo;
        </p>
        <footer className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
          — Federico Fellini
        </footer>
      </blockquote>
    </div>
  );
}
