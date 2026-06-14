import type { RefObject } from 'react';
import Link from 'next/link';
import {
  LogOut, Sun, Moon, Flame, Zap, X, User as UserIcon, Volume2, VolumeX,
} from 'lucide-react';
import type { UserDocument } from '@/types';
import type { User } from 'firebase/auth';
import { useFocusTrap } from '@/hooks/useFocusTrap';

type DashboardProfileDrawerProps = {
  isOpen: boolean;
  drawerRef: RefObject<HTMLDivElement | null>;
  profile: UserDocument;
  user: User | null;
  firstName: string;
  currentStreak: number;
  theme: string;
  isMuted: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onLogout: () => void;
};

export function DashboardProfileDrawer({
  isOpen,
  drawerRef,
  profile,
  user,
  firstName,
  currentStreak,
  theme,
  isMuted,
  onClose,
  onToggleTheme,
  onToggleMute,
  onLogout,
}: DashboardProfileDrawerProps) {
  useFocusTrap(drawerRef, isOpen);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar perfil"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in cursor-default focus:outline-none"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 shadow-2xl flex flex-col justify-between animate-drawer-slide"
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-extrabold text-text-primary">Perfil</h2>
            <button
              onClick={onClose}
              className="duo-icon-btn h-8 w-8 flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 cursor-pointer border border-border bg-surface"
              aria-label="Fechar Perfil"
            >
              <X size={16} className="text-text-muted" />
            </button>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl p-4 border border-primary-light mb-6 flex items-center gap-3.5"
            style={{
              background: 'linear-gradient(to right, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              boxShadow: '0 4px 12px rgba(29, 94, 212, 0.1)',
            }}
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-primary/25 rounded-full blur-xl pointer-events-none" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 shadow-sm">
              <span className="font-display text-lg font-extrabold text-white">{firstName ? firstName[0] : 'U'}</span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold text-white leading-tight truncate">{profile.name}</p>
              <p className="text-[10px] text-white/50 mt-0.5 truncate font-medium">{profile.email || user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Progresso Geral</h4>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3.5 rounded-xl text-center border"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: '0 2px 0 var(--color-border)',
                }}
              >
                <Flame size={20} className="mx-auto mb-1 text-amber-500 animate-float" />
                <span className="block text-lg font-extrabold tabular-nums text-text-primary font-display">{currentStreak}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-text-muted">Dias Seguidos</span>
              </div>
              <div
                className="p-3.5 rounded-xl text-center border"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: '0 2px 0 var(--color-border)',
                }}
              >
                <Zap size={18} className="mx-auto mb-1 text-primary animate-float" style={{ animationDelay: '0.3s' }} />
                <span className="block text-lg font-extrabold tabular-nums text-text-primary font-display">{profile.totalLessonsCompleted}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-text-muted">Lições Feitas</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Configurações</h4>

            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer border bg-surface"
              style={{
                borderColor: 'var(--color-border)',
                boxShadow: '0 3px 0 var(--color-border)',
              }}
            >
              <span className="flex items-center gap-2 text-text-primary">
                {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-text-muted" />}
                {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
              </span>
              <span className="text-[10px] font-black uppercase text-primary">Alterar</span>
            </button>

            <button
              onClick={onToggleMute}
              className="w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer border bg-surface"
              style={{
                borderColor: 'var(--color-border)',
                boxShadow: '0 3px 0 var(--color-border)',
              }}
            >
              <span className="flex items-center gap-2 text-text-primary">
                {isMuted ? <VolumeX size={16} className="text-text-muted" /> : <Volume2 size={16} className="text-primary" />}
                {isMuted ? 'Sons desativados' : 'Sons ativados'}
              </span>
              <span className="text-[10px] font-black uppercase text-primary">
                {isMuted ? 'Ativar' : 'Desativar'}
              </span>
            </button>

            <Link
              href="/profile"
              onClick={onClose}
              className="w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer border bg-surface"
              style={{
                borderColor: 'var(--color-border)',
                boxShadow: '0 3px 0 var(--color-border)',
              }}
            >
              <span className="flex items-center gap-2 text-text-primary">
                <UserIcon size={16} className="text-text-muted" />
                Ajustes de Perfil
              </span>
              <span className="text-[10px] font-black uppercase text-primary">Acessar</span>
            </Link>
          </div>
        </div>

        <div>
          <button
            onClick={onLogout}
            className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer active:translate-y-[2px]"
          >
            <div
              className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-200"
              style={{ backgroundColor: 'var(--color-error)', borderBottom: '3px solid var(--color-error)' }}
            >
              <LogOut size={16} />
              Sair da Conta
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
