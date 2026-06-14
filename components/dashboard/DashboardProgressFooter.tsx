type DashboardProgressFooterProps = {
  frontierIndex: number;
  totalLessons: number;
  completionPct: number;
};

export function DashboardProgressFooter({
  frontierIndex,
  totalLessons,
  completionPct,
}: DashboardProgressFooterProps) {
  return (
    <div
      className="mx-4 mb-8 text-center animate-fade-in"
      style={{ animationDelay: '500ms', animationFillMode: 'both' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
        {frontierIndex} de {totalLessons} lições concluídas
      </p>
      <div
        className="h-2.5 w-40 mx-auto mt-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${completionPct}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
          }}
        />
      </div>
    </div>
  );
}
