export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <h1
        className="text-4xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
      >
        Verbalize
      </h1>
      <p className="mt-2 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
        Aprenda francês e inglês do jeito certo.
      </p>
    </main>
  );
}
