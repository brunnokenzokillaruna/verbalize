import type { ReactNode } from 'react';

interface AuthFormHeaderProps {
  title: string;
  description: string;
}

export function AuthFormHeader({ title, description }: AuthFormHeaderProps) {
  return (
    <>
      <div className="mb-4 sm:mb-6 flex flex-col items-center text-center">
        <p
          className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          Verbalize
        </p>
        <p
          className="mt-1 text-xs sm:text-sm italic"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Aprenda o mundo.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <h1
          className="font-display text-xl sm:text-2xl md:text-3xl font-semibold leading-snug"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h1>
        <p
          className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      </div>
    </>
  );
}

export function AuthFormFooter({ children }: { children: ReactNode }) {
  return (
    <p
      className="mt-5 sm:mt-6 pt-4 sm:pt-5 text-center text-xs sm:text-sm leading-relaxed border-t border-[var(--color-border)]/40"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {children}
    </p>
  );
}

export function AuthFormDivider() {
  return (
    <div className="my-4 sm:my-5 flex items-center gap-2.5 sm:gap-3">
      <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
      <span
        className="shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          color: 'var(--color-text-muted)',
        }}
      >
        ou com e-mail
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  );
}

export function AuthGoogleButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="card-lift flex w-full items-center justify-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        color: 'var(--color-text-primary)',
      }}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
