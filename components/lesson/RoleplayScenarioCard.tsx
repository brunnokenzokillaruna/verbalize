import { MapPin, UserRound } from 'lucide-react';
import { formatRoleplayContext, getInterlocutorRole } from '@/components/lesson/roleplayUtils';
import type { DialogueRoleSide } from '@/lib/pedagogy/dialogueRoles';

interface RoleplayScenarioCardProps {
  context: string;
  promptLine: string;
  learnerRolePt?: string;
  interlocutorRolePt?: string;
  roleSide?: DialogueRoleSide;
}

function roleSideLabel(side: DialogueRoleSide | undefined): string | null {
  if (side === 'visitor') return 'Papel: cliente / visitante';
  if (side === 'professional') return 'Papel: profissional do local';
  return null;
}

export function RoleplayScenarioCard({
  context,
  promptLine,
  learnerRolePt,
  interlocutorRolePt,
  roleSide,
}: RoleplayScenarioCardProps) {
  const formattedContext = formatRoleplayContext(context);
  const inferred = getInterlocutorRole(formattedContext);
  const interlocutorLabel = interlocutorRolePt?.trim() || inferred.label;
  const sideHint = roleSideLabel(roleSide);
  const learnerLabel = learnerRolePt?.trim();

  return (
    <>
      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <MapPin size={14} className="text-[var(--color-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Cenário da Situação</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed italic">
          &ldquo;{formattedContext}&rdquo;
        </p>
        {(learnerLabel || sideHint) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {learnerLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-primary)]">
                <UserRound size={12} className="text-[var(--color-primary)]" />
                Você é: {learnerLabel}
              </span>
            )}
            {sideHint && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {sideHint}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 mt-1">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-lg shadow-md ring-2 ring-white/10"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            color: '#fff',
          }}
        >
          {inferred.avatar}
        </div>
        <div className="flex flex-col gap-1.5 max-w-[85%]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">
            {interlocutorLabel}
          </span>
          <div
            className="rounded-2xl rounded-tl-none px-4.5 py-3 border border-white/5 shadow-lg relative animate-slide-up-spring"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed">
              {promptLine}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
