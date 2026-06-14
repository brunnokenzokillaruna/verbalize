type FallbackNoMicProps = {
  onSkip: () => void;
};

export function FallbackNoMic({ onSkip }: FallbackNoMicProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] text-center" style={{ color: 'var(--color-text-muted)' }}>
        Microfone não disponível nesse navegador — você ainda pode praticar lendo em voz alta.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
        }}
      >
        Próxima fala →
      </button>
    </div>
  );
}
