import { Volume2 } from 'lucide-react';
import type { DialogueLine } from '@/components/lesson/mission-roleplay/types';

type LocalTurnProps = {
  line: DialogueLine;
  onReplay: () => void;
  onNext: () => void;
};

export function LocalTurn({ line, onReplay, onNext }: LocalTurnProps) {
  return (
    <div className="flex flex-row-reverse gap-3 animate-slide-up">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
        style={{ backgroundColor: '#ec4899' }}
      >
        {line.speaker.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-right"
          style={{ color: '#ec4899' }}
        >
          {line.speaker}
        </p>
        <div
          className="rounded-2xl p-4 text-right"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid #ec489933',
          }}
        >
          <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {line.text}
          </p>
          {line.translation && (
            <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
              {line.translation}
            </p>
          )}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            <Volume2 size={12} />
            Ouvir de novo
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-white transition active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(29,94,212,0.3)',
            }}
          >
            Minha vez →
          </button>
        </div>
      </div>
    </div>
  );
}
