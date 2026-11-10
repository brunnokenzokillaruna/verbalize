import { CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { MissionStepGuide } from './MissionStepGuide';
import type { MissionRoleFlipCopy } from '@/lib/pedagogy/dialogueRoles';

type MissionRolePlayDoneProps = {
  spokenCount: number;
  totalSpeakable: number;
  /** When set, primary visitor round finished — offer professional flip. */
  flipOffer?: MissionRoleFlipCopy | null;
  onStartFlip?: () => void;
  onSkipFlip?: () => void;
  invertedRoundComplete?: boolean;
};

export function MissionRolePlayDone({
  spokenCount,
  totalSpeakable,
  flipOffer,
  onStartFlip,
  onSkipFlip,
  invertedRoundComplete = false,
}: MissionRolePlayDoneProps) {
  const allSpoken = totalSpeakable > 0 && spokenCount >= totalSpeakable;
  const offeringFlip = Boolean(flipOffer && onStartFlip && onSkipFlip);

  return (
    <div className="flex flex-col gap-4 animate-scale-in">
      <MissionStepGuide activeStep={offeringFlip ? 'scene' : 'practice'} />

      <div
        className="rounded-2xl p-5 flex flex-col gap-3 border-2 border-success"
        style={{ backgroundColor: 'var(--color-success-bg)' }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="text-success shrink-0" strokeWidth={2.5} />
          <div>
            <p className="grammar-body font-black text-success">
              {offeringFlip
                ? 'Primeiro lado concluído!'
                : invertedRoundComplete
                  ? 'Os dois lados concluídos!'
                  : 'Conversa encerrada!'}
            </p>
            <p className="grammar-secondary mt-1">
              {offeringFlip
                ? flipOffer!.body
                : allSpoken
                  ? 'Você falou todas as suas falas. Avance para fixar o conteúdo na prática.'
                  : `Você falou ${spokenCount} de ${totalSpeakable} falas. Avance quando estiver pronto.`}
            </p>
          </div>
        </div>

        {!offeringFlip && allSpoken && (
          <p className="text-sm font-semibold text-success flex items-center gap-1.5">
            <Sparkles size={14} />
            Missão em cena concluída
          </p>
        )}
      </div>

      {offeringFlip && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onStartFlip}
            className="flex items-center justify-center gap-2 rounded-xl border border-b-[3px] border-primary bg-primary px-4 py-3.5 text-sm font-bold text-white transition-all active:translate-y-[2px] min-h-[48px]"
          >
            <RefreshCw size={16} />
            {flipOffer!.startCta}
          </button>
          <button
            type="button"
            onClick={onSkipFlip}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary transition active:scale-[0.99] min-h-[44px]"
          >
            {flipOffer!.skipCta}
          </button>
        </div>
      )}
    </div>
  );
}
