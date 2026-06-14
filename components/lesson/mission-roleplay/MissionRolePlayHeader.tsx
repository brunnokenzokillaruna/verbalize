import { Mic } from 'lucide-react';

type MissionRolePlayHeaderProps = {
  currentStep: number;
  totalSteps: number;
};

export function MissionRolePlayHeader({ currentStep, totalSteps }: MissionRolePlayHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
        >
          <Mic size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2
            className="font-display text-xl font-black tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Entre em cena
          </h2>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Fale suas falas — você é o protagonista
          </p>
        </div>
      </div>
      <div
        className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shrink-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        {currentStep} / {totalSteps}
      </div>
    </div>
  );
}
