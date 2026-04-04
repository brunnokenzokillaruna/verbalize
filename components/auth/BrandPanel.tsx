const FLOATING_WORDS = [
  { text: 'bonjour',     x: '8%',  y: '12%', opacity: 0.10, rotate: -14, size: '2rem',   delay: '0s' },
  { text: 'hello',       x: '62%', y: '7%',  opacity: 0.08, rotate: 6,   size: '1.6rem', delay: '0.6s' },
  { text: 'bom dia',     x: '38%', y: '22%', opacity: 0.07, rotate: -5,  size: '1.2rem', delay: '1.2s' },
  { text: 'merci',       x: '14%', y: '42%', opacity: 0.09, rotate: 9,   size: '1.9rem', delay: '0.3s' },
  { text: 'obrigado',    x: '54%', y: '38%', opacity: 0.07, rotate: -16, size: '1.1rem', delay: '1.8s' },
  { text: 'beautiful',   x: '22%', y: '62%', opacity: 0.07, rotate: 11,  size: '1.4rem', delay: '0.9s' },
  { text: 'café',        x: '68%', y: '57%', opacity: 0.10, rotate: -7,  size: '2.3rem', delay: '2.1s' },
  { text: 'amour',       x: '9%',  y: '78%', opacity: 0.08, rotate: 5,   size: '1.7rem', delay: '0.4s' },
  { text: 'freedom',     x: '48%', y: '73%', opacity: 0.07, rotate: -3,  size: '1.3rem', delay: '1.5s' },
  { text: 'bienvenue',   x: '27%', y: '87%', opacity: 0.08, rotate: 13,  size: '1.1rem', delay: '2.4s' },
  { text: 'welcome',     x: '70%', y: '83%', opacity: 0.07, rotate: -8,  size: '1.4rem', delay: '0.7s' },
  { text: 'voilà',       x: '78%', y: '28%', opacity: 0.09, rotate: 8,   size: '2rem',   delay: '1.1s' },
  { text: 'merveilleux', x: '42%', y: '50%', opacity: 0.06, rotate: -20, size: '1rem',   delay: '2.8s' },
  { text: 'língua',      x: '5%',  y: '55%', opacity: 0.07, rotate: 3,   size: '1.5rem', delay: '1.7s' },
  { text: 'lumière',     x: '83%', y: '46%', opacity: 0.08, rotate: -4,  size: '1.3rem', delay: '0.2s' },
];

export function BrandPanel() {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
      style={{ backgroundColor: '#080f1e' }}
    >
      {/* ── Layered gradient mesh ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 85% 85%, rgba(217,119,6,0.14) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 60% at 15% 20%, rgba(29,94,212,0.20) 0%, transparent 65%)',
            'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(96,165,250,0.06) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* ── Subtle grid lines ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Floating words with float animation ── */}
      {FLOATING_WORDS.map((w) => (
        <span
          key={w.text}
          className="pointer-events-none absolute select-none font-display animate-float"
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
            '--float-rotate': `${w.rotate}deg`,
            animationDelay: w.delay,
            animationDuration: `${3.5 + Math.abs(w.rotate) * 0.05}s`,
          } as React.CSSProperties}
        >
          {w.text}
        </span>
      ))}

      {/* ── Top: Logo ── */}
      <div className="relative z-10 animate-fade-in">
        {/* Small decorative accent line */}
        <div
          className="mb-5 h-px w-12"
          style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }}
        />
        <h1
          className="font-display text-5xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Verbalize
        </h1>
        <p
          className="mt-3 text-lg font-light italic"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Aprenda o mundo.
        </p>
      </div>

      {/* ── Middle: Feature highlights ── */}
      <div className="relative z-10 flex flex-col gap-4 animate-fade-in delay-150">
        {[
          { icon: '🧠', title: 'Método Ponte Português', desc: 'Aprenda comparando com o que você já sabe.' },
          { icon: '⚡', title: 'Micro-lições de 5 min', desc: 'Encaixe o aprendizado na sua rotina.' },
          { icon: '🔁', title: 'Revisão espaçada', desc: 'Vocabulário que fica na memória de verdade.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {icon}
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom: Quote ── */}
      <blockquote className="relative z-10 animate-fade-in delay-300">
        <div
          className="mb-4 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }}
        />
        <p
          className="text-base leading-relaxed font-display italic"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          &ldquo;Uma língua diferente é uma visão diferente da vida.&rdquo;
        </p>
        <footer className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.18)' }}>
          — Federico Fellini
        </footer>
      </blockquote>
    </div>
  );
}
