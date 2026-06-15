export function getPathOffset(index: number, isMobile = false): number {
  const amplitude = isMobile ? 55 : 85;
  const period = 8;
  return -Math.sin((index / period) * Math.PI * 2) * amplitude;
}

type NodeStyle = {
  backgroundColor: string;
  color: string;
  boxShadow: string;
  border?: string;
};

export function getLessonNodeColors(
  isCompleted: boolean,
  isCurrent: boolean,
  isMission: boolean,
): NodeStyle {
  const inactiveBg = 'var(--color-surface-raised)';
  const inactiveShadow = 'var(--color-border-strong)';
  const inactiveIcon = 'var(--color-text-muted)';

  const nodeColors: NodeStyle = isCompleted
    ? {
        backgroundColor: 'var(--color-success)',
        color: 'var(--color-on-accent)',
        boxShadow:
          'inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 4px 0 rgba(255,255,255,0.2), 0 8px 0 var(--color-success)',
        border: '2px solid rgba(255,255,255,0.1)',
      }
    : isCurrent
      ? {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-on-accent)',
          boxShadow:
            'inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 5px 0 rgba(255,255,255,0.25), 0 8px 0 var(--color-primary-dark), 0 8px 24px rgba(29,94,212,0.4)',
          border: '2px solid rgba(255,255,255,0.15)',
        }
      : {
          backgroundColor: inactiveBg,
          color: inactiveIcon,
          boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.1), inset 0 4px 0 rgba(255,255,255,0.06), 0 8px 0 ${inactiveShadow}`,
        };

  if (!isMission) return nodeColors;

  return {
    backgroundColor: isCompleted || isCurrent ? 'var(--color-vocab)' : inactiveBg,
    color: isCompleted || isCurrent ? 'var(--color-on-accent)' : inactiveIcon,
    boxShadow:
      isCompleted || isCurrent
        ? 'inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 5px 0 rgba(255,255,255,0.25), 0 8px 0 var(--color-warning), 0 8px 24px rgba(217,119,6,0.35)'
        : `inset 0 -4px 0 rgba(0,0,0,0.1), inset 0 4px 0 rgba(255,255,255,0.06), 0 8px 0 ${inactiveShadow}`,
    border: isCompleted || isCurrent ? '2px solid rgba(255,255,255,0.2)' : undefined,
  };
}
