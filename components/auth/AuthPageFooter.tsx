import Link from 'next/link';

export function AuthPageFooter() {
  return (
    <footer className="mt-8 border-t pt-6 text-center text-xs" style={{ borderColor: 'var(--color-border)' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Ao continuar, você concorda com nossa{' '}
        <Link
          href="/privacy"
          className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Política de Privacidade
        </Link>
        .
      </p>
    </footer>
  );
}
