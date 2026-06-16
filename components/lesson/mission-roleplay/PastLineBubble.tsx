import type { DialogueLine } from '@/components/lesson/mission-roleplay/types';

export function PastLineBubble({ line }: { line: DialogueLine }) {
  const isUser = line.isUserLine;

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isUser ? 'bg-primary/15 text-primary' : 'bg-surface-raised text-text-secondary border border-border',
        ].join(' ')}
      >
        {isUser ? 'V' : line.speaker.charAt(0).toUpperCase()}
      </div>
      <div
        className={[
          'rounded-2xl px-3.5 py-2.5 max-w-[85%] sm:max-w-[80%] border border-border/60 bg-surface/80',
          isUser ? 'rounded-bl-md' : 'rounded-br-md text-right',
        ].join(' ')}
      >
        <p
          className={[
            'text-[10px] font-bold uppercase tracking-wide mb-1',
            isUser ? 'text-primary' : 'text-text-muted',
          ].join(' ')}
        >
          {isUser ? 'Você' : line.speaker}
        </p>
        <p className="grammar-secondary text-text-secondary line-clamp-3">{line.text}</p>
      </div>
    </div>
  );
}
