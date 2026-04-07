import React from 'react';

export function StatChip({
  icon,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: bg, color }}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}
