type DrillTimerRingProps = {
  timeLeft: number;
  totalSeconds: number;
  size?: number;
};

export function DrillTimerRing({
  timeLeft,
  totalSeconds,
  size = 44,
}: DrillTimerRingProps) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
  const dashOffset = circumference * (1 - progress);
  const urgent = timeLeft <= 10;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? 'var(--color-error)' : 'var(--color-verb)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 linear"
        />
      </svg>
      <span
        className="absolute text-xs font-black tabular-nums"
        style={{ color: urgent ? 'var(--color-error)' : 'var(--color-verb)' }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
