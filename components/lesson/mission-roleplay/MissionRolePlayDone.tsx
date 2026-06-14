import { CheckCircle2 } from 'lucide-react';

type MissionRolePlayDoneProps = {
  spokenCount: number;
  totalSpeakable: number;
};

export function MissionRolePlayDone({ spokenCount, totalSpeakable }: MissionRolePlayDoneProps) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-3 animate-scale-in"
      style={{
        backgroundColor: 'var(--color-success-bg)',
        border: '2px solid var(--color-success)',
      }}
    >
      <CheckCircle2 size={22} style={{ color: 'var(--color-success)' }} strokeWidth={2.5} />
      <div className="flex-1">
        <p className="text-sm font-black" style={{ color: 'var(--color-success)' }}>
          Conversa encerrada!
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Você falou {spokenCount} de {totalSpeakable} falas. Avance para a prática quando estiver pronto.
        </p>
      </div>
    </div>
  );
}
