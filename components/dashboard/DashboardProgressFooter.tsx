type DashboardProgressFooterProps = {
  frontierIndex: number;
  totalLessons: number;
  completionPct: number;
  dueTodayCount?: number;
  masteredCount?: number;
  lessonsLast7Days?: number;
  averageScoreLast7Days?: number;
};

export function DashboardProgressFooter({
  frontierIndex,
  totalLessons,
  completionPct,
  dueTodayCount,
  masteredCount,
  lessonsLast7Days,
  averageScoreLast7Days,
}: DashboardProgressFooterProps) {
  const showCompetenceStats =
    dueTodayCount !== undefined ||
    masteredCount !== undefined ||
    lessonsLast7Days !== undefined;

  return (
    <div
      className="mx-4 mb-8 text-center animate-fade-in"
      style={{ animationDelay: '500ms', animationFillMode: 'both' }}
    >
      {showCompetenceStats && (
        <div className="grid grid-cols-2 gap-2.5 mb-4 max-w-sm mx-auto text-left">
          {dueTodayCount !== undefined && (
            <StatChip label="Revisar hoje" value={dueTodayCount} />
          )}
          {masteredCount !== undefined && (
            <StatChip label="Dominadas" value={masteredCount} />
          )}
          {lessonsLast7Days !== undefined && (
            <StatChip label="Lições (7 dias)" value={lessonsLast7Days} />
          )}
          {averageScoreLast7Days !== undefined && lessonsLast7Days !== undefined && lessonsLast7Days > 0 && (
            <StatChip label="Média (7 dias)" value={`${averageScoreLast7Days}%`} />
          )}
        </div>
      )}

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

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 border border-[var(--color-border)]"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)] leading-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}
