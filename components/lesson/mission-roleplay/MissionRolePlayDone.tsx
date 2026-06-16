import { CheckCircle2, Sparkles } from 'lucide-react';
import { MissionStepGuide } from './MissionStepGuide';

type MissionRolePlayDoneProps = {
  spokenCount: number;
  totalSpeakable: number;
};

export function MissionRolePlayDone({ spokenCount, totalSpeakable }: MissionRolePlayDoneProps) {
  const allSpoken = totalSpeakable > 0 && spokenCount >= totalSpeakable;

  return (
    <div className="flex flex-col gap-4 animate-scale-in">
      <MissionStepGuide activeStep="practice" />

      <div
        className="rounded-2xl p-5 flex flex-col gap-3 border-2 border-success"
        style={{ backgroundColor: 'var(--color-success-bg)' }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="text-success shrink-0" strokeWidth={2.5} />
          <div>
            <p className="grammar-body font-black text-success">Conversa encerrada!</p>
            <p className="grammar-secondary mt-1">
              {allSpoken
                ? 'Você falou todas as suas falas. Avance para fixar o conteúdo na prática.'
                : `Você falou ${spokenCount} de ${totalSpeakable} falas. Avance quando estiver pronto.`}
            </p>
          </div>
        </div>

        {allSpoken && (
          <p className="text-sm font-semibold text-success flex items-center gap-1.5">
            <Sparkles size={14} />
            Missão em cena concluída
          </p>
        )}
      </div>
    </div>
  );
}
