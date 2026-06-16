import { Mic } from 'lucide-react';
import { MissionStepGuide } from './MissionStepGuide';

type MissionRolePlayHeaderProps = {
  currentStep: number;
  totalSteps: number;
  spokenCount: number;
  totalSpeakable: number;
};

export function MissionRolePlayHeader({
  currentStep,
  totalSteps,
  spokenCount,
  totalSpeakable,
}: MissionRolePlayHeaderProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <Mic size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-text-primary leading-tight">
              Entre em cena
            </h2>
            <p className="text-xs font-semibold text-text-muted mt-0.5">
              Fale suas falas — você é o protagonista
            </p>
          </div>
        </div>
        <div className="rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 bg-surface border border-border text-text-secondary tabular-nums">
          {currentStep}/{totalSteps}
        </div>
      </div>

      <MissionStepGuide activeStep="scene" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>Progresso da conversa</span>
          {totalSpeakable > 0 && (
            <span className="tabular-nums">
              Falas suas: {spokenCount}/{totalSpeakable}
            </span>
          )}
        </div>
        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
