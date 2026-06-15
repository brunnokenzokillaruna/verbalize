import { ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { SectionLabel } from '@/components/profile/SectionLabel';

type ProfileAccountSectionProps = {
  onLogout: () => void;
  onDelete: () => void;
};

export function ProfileAccountSection({ onLogout, onDelete }: ProfileAccountSectionProps) {
  return (
    <section className="flex flex-col gap-4 animate-slide-up-spring">
      <div
        className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-2"
      >
        <SectionLabel>Sessão</SectionLabel>
        <p className="text-xs text-text-muted -mt-1 mb-1">
          Gerencie o acesso à sua conta neste dispositivo.
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all active:scale-[0.98] cursor-pointer border border-border bg-bg hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <LogOut size={16} className="text-text-muted" />
          </span>
          <span className="flex-1 font-bold text-sm text-text-primary">Sair da conta</span>
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      </div>

      <div
        className="rounded-2xl border p-5 flex flex-col gap-2"
        style={{
          backgroundColor: 'var(--color-error-bg)',
          borderColor: 'rgba(220, 38, 38, 0.2)',
        }}
      >
        <SectionLabel>Zona de perigo</SectionLabel>
        <p className="text-xs text-text-secondary -mt-1 mb-1 leading-relaxed">
          Excluir a conta apaga progresso, vocabulário e histórico de forma permanente.
        </p>

        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all active:scale-[0.98] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'rgba(220, 38, 38, 0.3)',
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.12)' }}
          >
            <Trash2 size={16} className="text-error" />
          </span>
          <span className="flex-1 font-bold text-sm text-error">Excluir conta</span>
          <ChevronRight size={16} className="text-error opacity-60" />
        </button>
      </div>
    </section>
  );
}
