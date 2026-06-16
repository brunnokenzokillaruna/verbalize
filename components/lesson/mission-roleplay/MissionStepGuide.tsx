import { MISSION_STEPS } from './missionTheme';

type MissionStepGuideProps = {
  activeStep: 'briefing' | 'scene' | 'practice';
};

export function MissionStepGuide({ activeStep }: MissionStepGuideProps) {
  const activeIndex = MISSION_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="flex items-center gap-1 sm:gap-2 w-full">
      {MISSION_STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;

        return (
          <div key={step.id} className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div
                className={[
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-black shrink-0 transition-colors',
                  isActive
                    ? 'bg-success text-white shadow-sm'
                    : isPast
                      ? 'bg-success/15 text-success'
                      : 'bg-surface-raised text-text-muted border border-border',
                ].join(' ')}
              >
                {isPast ? '✓' : i + 1}
              </div>
              <span
                className={[
                  'text-[10px] sm:text-xs font-bold truncate w-full text-center',
                  isActive ? 'text-success' : isPast ? 'text-text-secondary' : 'text-text-muted',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {i < MISSION_STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 flex-1 rounded-full mb-4 max-w-[2rem] sm:max-w-none',
                  isPast ? 'bg-success/40' : 'bg-border',
                ].join(' ')}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
