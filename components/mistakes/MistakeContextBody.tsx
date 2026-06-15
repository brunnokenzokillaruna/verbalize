import { ArrowRight } from 'lucide-react';
import { MISTAKE_THEME } from './mistakeTheme';
import {
  highlightErrorWord,
  parseMistakeContext,
} from '@/utils/mistakeContextDisplay';

type MistakeContextBodyProps = {
  mistakeContext: string;
  compact?: boolean;
};

export function MistakeContextBody({ mistakeContext, compact = false }: MistakeContextBodyProps) {
  const parsed = parseMistakeContext(mistakeContext);
  const textSize = compact ? 'text-xs' : 'text-sm';

  if (parsed.kind === 'error-correction') {
    const parts = highlightErrorWord(parsed.sentence, parsed.errorWord);

    return (
      <div className={`flex flex-col gap-3 ${textSize}`}>
        <p className="text-text-muted leading-snug">
          Você errou uma palavra nesta frase:
        </p>
        <blockquote
          className="rounded-xl border border-border px-4 py-3 leading-relaxed text-text-primary"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          {parts ? (
            <>
              {parts.before}
              <span className="font-bold text-error underline decoration-wavy decoration-error/60">
                {parts.match}
              </span>
              {parts.after}
            </>
          ) : (
            parsed.sentence
          )}
        </blockquote>
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: MISTAKE_THEME.accentLight }}
        >
          <span className="font-semibold text-error line-through">{parsed.errorWord}</span>
          <ArrowRight size={14} className="text-text-muted shrink-0" aria-hidden />
          <span className="font-bold text-success">{parsed.correctWord}</span>
        </div>
      </div>
    );
  }

  if (parsed.kind === 'context-choice') {
    return (
      <div className={`flex flex-col gap-2 ${textSize}`}>
        <p className="text-text-muted">Resposta correta na lacuna:</p>
        <blockquote
          className="rounded-xl border border-border px-4 py-3 text-text-primary leading-relaxed"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          {parsed.sentence.replace('___', '____')}
        </blockquote>
        <p className="font-bold text-success">{parsed.correctAnswer}</p>
      </div>
    );
  }

  if (parsed.kind === 'reverse-translation') {
    return (
      <div className={`flex flex-col gap-2 ${textSize}`}>
        <p className="text-text-muted">Tradução esperada:</p>
        <p className="text-text-primary leading-relaxed">&ldquo;{parsed.portuguese}&rdquo;</p>
        <div className="flex items-center gap-2">
          <ArrowRight size={14} className="text-text-muted shrink-0" aria-hidden />
          <p className="font-semibold text-text-primary">{parsed.target}</p>
        </div>
      </div>
    );
  }

  if (parsed.kind === 'conjugation-speed') {
    return (
      <div className={`flex flex-col gap-2 ${textSize}`}>
        <p className="text-text-muted">Forma verbal correta:</p>
        <p className="text-text-primary">
          <span className="font-semibold">{parsed.pronoun}</span>
          {' + '}
          <span className="font-semibold">{parsed.verb}</span>
        </p>
        <p className="font-bold text-success">{parsed.correctForm}</p>
      </div>
    );
  }

  if (parsed.kind === 'bridge-choice') {
    return (
      <div className={`flex flex-col gap-2 ${textSize}`}>
        <p className="text-text-muted">{parsed.question}</p>
        <p className="font-semibold text-success leading-relaxed">{parsed.correct}</p>
      </div>
    );
  }

  return (
    <p className={`text-text-secondary leading-relaxed ${textSize}`}>
      {parsed.text}
    </p>
  );
}
