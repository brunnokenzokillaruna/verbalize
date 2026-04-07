import React from 'react';

export const SRS_LABELS = ['Iniciante', 'Básico', 'Aprendendo', 'Bom', 'Ótimo', 'Dominado'];

export const SRS_BAR_COLOR = [
  '#ef4444', // 0 — red
  '#f97316', // 1 — orange
  '#eab308', // 2 — yellow
  '#3b82f6', // 3 — blue
  '#10b981', // 4 — emerald
  '#059669', // 5 — green
];

export function formatNextReview(ts: { toDate?: () => Date } | Date | null | undefined): string {
  if (!ts) return '';
  const date =
    typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : ts instanceof Date
        ? ts
        : new Date();
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Para revisar hoje';
  if (diffDays === 1) return 'Amanhã';
  return `Em ${diffDays} dias`;
}

export function SrsBar({ level }: { level: number }) {
  const color = SRS_BAR_COLOR[Math.min(level, 5)];
  return (
    <div className="flex gap-0.5" role="progressbar" aria-valuenow={level} aria-valuemax={5}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ backgroundColor: i < level ? color : 'var(--color-border)' }}
        />
      ))}
    </div>
  );
}
