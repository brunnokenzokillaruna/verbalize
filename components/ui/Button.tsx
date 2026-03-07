import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'google';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'text-white font-semibold shadow-sm active:scale-95',
  secondary:
    'font-medium border active:scale-95',
  ghost:
    'font-medium active:scale-95',
  danger:
    'text-white font-semibold active:scale-95',
  google:
    'font-medium border shadow-sm active:scale-95 flex items-center justify-center gap-3',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-3 text-base rounded-2xl',
  lg: 'px-6 py-4 text-base rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const baseStyle: React.CSSProperties =
      variant === 'primary'
        ? {
            backgroundColor: isDisabled
              ? 'var(--color-surface-raised)'
              : 'var(--color-primary)',
            color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
            transition: 'background-color 150ms, transform 150ms',
          }
        : variant === 'secondary'
          ? {
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)',
              transition: 'background-color 150ms, transform 150ms',
            }
          : variant === 'danger'
            ? {
                backgroundColor: 'var(--color-error)',
                color: 'var(--color-text-inverse)',
                transition: 'background-color 150ms, transform 150ms',
              }
            : variant === 'google'
              ? {
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  transition: 'background-color 150ms, transform 150ms',
                }
              : {
                  color: 'var(--color-primary)',
                  transition: 'opacity 150ms, transform 150ms',
                };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...baseStyle, ...style }}
        {...rest}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
