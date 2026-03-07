import type { SupportedLanguage } from '@/types';

interface GrammarBridgeCardProps {
  rule: string;
  targetExample: string;
  portugueseComparison: string;
  language: SupportedLanguage;
}

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'Francês',
  en: 'Inglês',
};

export function GrammarBridgeCard({
  rule,
  targetExample,
  portugueseComparison,
  language,
}: GrammarBridgeCardProps) {
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: 'var(--color-bridge-bg)',
        border: '1px solid var(--color-border)',
        borderLeft: '4px solid var(--color-bridge)',
        overflow: 'hidden',
      }}
    >
      {/* Header label */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span style={{ fontSize: '18px' }} role="img" aria-label="Ponte gramatical">
          🌉
        </span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-bridge)' }}
        >
          Ponte Gramatical
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Rule explanation */}
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {rule}
        </p>

        {/* Comparison table */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {/* Target language row */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              {LANG_LABEL[language]}
            </span>
            <p
              className="text-base font-medium"
              style={{ color: 'var(--color-primary-dark)', fontStyle: 'italic' }}
            >
              {targetExample}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

          {/* Portuguese row */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--color-bridge)',
                color: 'var(--color-text-inverse)',
              }}
            >
              PT
            </span>
            <p
              className="text-base"
              style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
            >
              {portugueseComparison}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
