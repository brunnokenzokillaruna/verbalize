export default function Loading() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
      aria-busy="true"
      aria-label="Carregando página"
    >
      <div
        className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{
          borderColor: 'var(--color-primary)',
          borderTopColor: 'transparent',
        }}
        role="status"
      />
    </div>
  );
}
