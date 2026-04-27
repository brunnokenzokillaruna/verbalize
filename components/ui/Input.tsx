import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, id, className = '', type, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const resolvedType = isPasswordField && showPassword ? 'text' : type;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {Icon && (
            <span
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Icon size={17} />
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={[
              'w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all duration-150',
              Icon ? 'pl-10' : '',
              isPasswordField ? 'pr-11' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
              color: 'var(--color-text-primary)',
              boxShadow: error
                ? '0 0 0 3px var(--color-error-bg)'
                : undefined,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
              }
              // Tint the icon on focus
              const icon = e.currentTarget.previousElementSibling as HTMLElement | null;
              if (icon) icon.style.color = 'var(--color-primary)';
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
              }
              const icon = e.currentTarget.previousElementSibling as HTMLElement | null;
              if (icon) icon.style.color = 'var(--color-text-muted)';
              rest.onBlur?.(e);
            }}
            {...rest}
          />

          {isPasswordField && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg p-0.5 transition-colors duration-150 hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
