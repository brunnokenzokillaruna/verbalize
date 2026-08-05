'use client';

export function SessionContextBar({
  titlePt,
  userRolePt,
  aiRolePt,
  objectivePt,
  goalsPt,
  level,
}: {
  titlePt: string;
  userRolePt: string;
  aiRolePt: string;
  objectivePt: string;
  goalsPt: string[];
  level: string;
}) {
  return (
    <div
      className="px-4 py-2.5"
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-text-primary">{titlePt}</p>
        <span
          className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
          }}
        >
          {level}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-text-secondary">
        Você: {userRolePt} · IA: {aiRolePt}
      </p>

      {goalsPt.length > 0 ? (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {goalsPt.map((goal, index) => (
            <li
              key={goal}
              className="rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
              }}
            >
              {index + 1}. {goal}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 truncate text-[11px] text-text-muted">Objetivo: {objectivePt}</p>
      )}
    </div>
  );
}
