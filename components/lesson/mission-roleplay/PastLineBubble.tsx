import type { DialogueLine } from '@/components/lesson/mission-roleplay/types';

export function PastLineBubble({ line }: { line: DialogueLine }) {
  const isUser = line.isUserLine;

  return (
    <div className={`flex gap-3 opacity-55 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
        style={{
          backgroundColor: isUser ? 'var(--color-primary-light)' : 'var(--color-surface-raised)',
          color: isUser ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {isUser ? 'V' : line.speaker.charAt(0).toUpperCase()}
      </div>
      <div
        className={`rounded-2xl px-3.5 py-2 max-w-[80%] text-xs ${isUser ? '' : 'text-right'}`}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-widest mb-0.5 opacity-70"
          style={{ color: isUser ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          {line.speaker}
        </p>
        {line.text}
      </div>
    </div>
  );
}
