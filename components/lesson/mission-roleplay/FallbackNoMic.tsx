type FallbackNoMicProps = {
  onSkip: () => void;
};

export function FallbackNoMic({ onSkip }: FallbackNoMicProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="grammar-secondary text-center text-text-muted">
        Microfone indisponível — leia a frase em voz alta e avance quando estiver pronto.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] min-h-[48px] bg-primary"
      >
        Li em voz alta — continuar
      </button>
    </div>
  );
}
