'use client';

export interface SegmentedOption<T extends string> {
  value: T;
  labelPt: string;
}

export function SegmentedControl<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex gap-1 rounded-2xl p-1"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className="flex-1 rounded-xl px-2 py-2 text-xs font-bold transition-colors cursor-pointer"
              style={{
                backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {option.labelPt}
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-[11px] leading-snug text-text-muted">{hint}</p> : null}
    </div>
  );
}
