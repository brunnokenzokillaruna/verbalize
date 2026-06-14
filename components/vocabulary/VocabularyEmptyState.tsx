import { BookOpen, Brain, Sparkles } from 'lucide-react';

export function VocabularyEmptyState() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center pb-24"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary-light))',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <BookOpen size={36} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Nenhuma palavra ainda
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed max-w-xs mx-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Conclua sua primeira lição e as palavras que você aprender aparecerão aqui.
        </p>
      </div>
      <div className="flex gap-2 mt-2">
        {[
          <BookOpen key="book" size={18} style={{ color: 'var(--color-primary)' }} />,
          <Brain key="brain" size={18} style={{ color: 'var(--color-verb)' }} />,
          <Sparkles key="sparkles" size={18} style={{ color: 'var(--color-warning)' }} />,
        ].map((icon, i) => (
          <span
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-xl animate-float"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
}
