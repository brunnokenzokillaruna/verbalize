import { normalizeText } from '@/components/lesson/mission-roleplay/utils';

export function WordDiff({ target, transcript }: { target: string; transcript: string }) {
  const spokenWords = new Set(normalizeText(transcript).split(' '));
  const targetWords = target.split(/\s+/);

  return (
    <p className="text-xs leading-relaxed flex flex-wrap gap-x-1">
      {targetWords.map((word, i) => {
        const matched = spokenWords.has(normalizeText(word));
        return (
          <span
            key={i}
            className="font-semibold"
            style={{
              color: matched ? 'var(--color-success)' : 'var(--color-error)',
              textDecoration: matched ? 'none' : 'underline',
              textDecorationStyle: matched ? undefined : 'wavy',
              textUnderlineOffset: '3px',
            }}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}
