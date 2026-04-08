import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertCircle } from 'lucide-react';
import { deleteUserData } from '@/services/firestore';
import { deleteAccount } from '@/services/auth';
import type { User } from 'firebase/auth';

interface DeleteAccountSheetProps {
  user: User;
  onClose: () => void;
  onReset: () => void;
}

export function DeleteAccountSheet({ user, onClose, onReset }: DeleteAccountSheetProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUserData(user.uid);
      await deleteAccount(user);
      onReset();
      router.replace('/');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setDeleteError(
        code === 'auth/requires-recent-login'
          ? 'Por segurança, saia e faça login novamente antes de excluir sua conta.'
          : 'Erro ao excluir conta. Tente novamente.',
      );
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl px-6 pb-10 pt-5 flex flex-col gap-5 md:rounded-3xl md:max-w-sm md:pb-6 animate-slide-up"
        style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
      >
        <div className="mx-auto h-1 w-10 rounded-full md:hidden" style={{ backgroundColor: 'var(--color-border-strong)' }} />

        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--color-error-bg)', border: '1.5px solid rgba(220,38,38,0.2)' }}
        >
          <Trash2 size={24} style={{ color: 'var(--color-error)' }} />
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Excluir conta?
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Todo o seu progresso, vocabulário e histórico de lições serão apagados permanentemente. Essa ação não pode ser desfeita.
          </p>
        </div>

        {deleteError && (
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm animate-scale-in"
            style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(220,38,38,0.2)' }}
          >
            <AlertCircle size={15} className="shrink-0" />
            {deleteError}
          </div>
        )}

        <button
          type="button"
          disabled={deleting}
          onClick={handleDeleteAccount}
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: '0 6px 20px rgba(220,38,38,0.3)' }}
        >
          {deleting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Excluindo…
            </span>
          ) : 'Excluir definitivamente'}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-center text-sm font-semibold py-1 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
