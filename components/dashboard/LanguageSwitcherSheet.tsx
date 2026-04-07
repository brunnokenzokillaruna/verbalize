import { Check } from 'lucide-react';
import type { SupportedLanguage } from '@/types';

interface LanguageSwitcherSheetProps {
  currentTargetLanguage: string;
  switchingLang: boolean;
  onSwitchLanguage: (lang: SupportedLanguage) => void;
  onClose: () => void;
}

export function LanguageSwitcherSheet({
  currentTargetLanguage,
  switchingLang,
  onSwitchLanguage,
  onClose,
}: LanguageSwitcherSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl px-6 pb-10 pt-5 flex flex-col gap-5 md:rounded-3xl md:max-w-sm md:pb-6 animate-slide-up"
        style={{
          backgroundColor: 'var(--color-surface)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Handle */}
        <div
          className="mx-auto h-1 w-10 rounded-full md:hidden"
          style={{ backgroundColor: 'var(--color-border-strong)' }}
        />

        <div>
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Trocar idioma
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Escolha o idioma que deseja praticar.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {(
            [
              { lang: 'fr', countryCode: 'fr', name: 'Francês', sub: 'Français' },
              { lang: 'en', countryCode: 'gb', name: 'Inglês', sub: 'English' },
            ] as const
          ).map(({ lang: l, countryCode, name, sub }) => {
            const isCurrent = currentTargetLanguage === l;
            return (
              <button
                key={l}
                type="button"
                disabled={switchingLang}
                onClick={() => onSwitchLanguage(l as SupportedLanguage)}
                className="flex items-center gap-4 rounded-2xl p-4 text-left transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  backgroundColor: isCurrent ? 'var(--color-primary-light)' : 'var(--color-surface-raised)',
                  border: `2px solid ${isCurrent ? 'var(--color-primary)' : 'transparent'}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                  alt={name}
                  className="h-8 w-auto object-contain rounded-sm shrink-0"
                />
                <div className="flex-1">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                  >
                    {name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
                </div>
                {isCurrent && (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), #60a5fa)' }}
                  >
                    <Check size={13} color="white" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-center text-sm font-semibold py-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
