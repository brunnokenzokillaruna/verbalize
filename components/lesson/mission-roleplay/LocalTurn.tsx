import { Volume2, ChevronRight } from 'lucide-react';
import { LanguageFlag } from '@/components/LanguageFlag';
import type { DialogueLine } from '@/components/lesson/mission-roleplay/types';
import type { SupportedLanguage } from '@/types';

type LocalTurnProps = {
  line: DialogueLine;
  language: SupportedLanguage;
  onReplay: () => void;
  onNext: () => void;
};

export function LocalTurn({ line, language, onReplay, onNext }: LocalTurnProps) {
  return (
    <div className="flex flex-row-reverse items-start gap-2.5 sm:gap-3 animate-slide-up">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border bg-surface shadow-sm">
        <LanguageFlag language={language} size="lg" className="h-full w-full rounded-none object-cover" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-end gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-verb">{line.speaker}</p>

        {line.isConsequenceTone && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-error/80">
            Tom mais tenso — sua resposta anterior não convenceu
          </p>
        )}

        <div className="w-full max-w-[min(100%,20rem)] rounded-2xl rounded-tr-md border border-verb/20 bg-surface px-4 py-3.5 text-right">
          <p className="grammar-body font-semibold text-text-primary leading-relaxed">{line.text}</p>
          {line.translation && (
            <>
              <div className="my-2.5 h-px bg-border" aria-hidden />
              <p className="grammar-secondary text-left sm:text-right">{line.translation}</p>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onReplay}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold border border-border bg-surface text-text-secondary transition active:scale-95 min-h-[44px]"
          >
            <Volume2 size={14} />
            Ouvir de novo
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 min-h-[44px] bg-primary shadow-sm"
          >
            Minha vez
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
