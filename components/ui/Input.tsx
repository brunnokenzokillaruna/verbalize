import { type InputHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, id, className = '', ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <span
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Icon size={18} />
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-xl border px-4 py-3 text-base outline-none transition-all duration-150',
              Icon ? 'pl-10' : '',
              error ? '' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: error ? 'var(--color-error)' : 'var(--color-border-strong)',
              color: 'var(--color-text-primary)',
              boxShadow: error ? '0 0 0 3px var(--color-error-bg)' : undefined,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
              }
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                e.currentTarget.style.boxShadow = 'none';
              }
              rest.onBlur?.(e);
            }}
            {...rest}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
