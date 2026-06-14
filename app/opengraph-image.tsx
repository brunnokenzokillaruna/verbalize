import { ImageResponse } from 'next/og';

export const alt = 'Verbalize — Aprenda francês e inglês com micro-histórias';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #1d5ed4 0%, #1648a8 55%, #111827 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 700,
            }}
          >
            V
          </div>
          <span style={{ fontSize: '72px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Verbalize
          </span>
        </div>
        <p
          style={{
            fontSize: '40px',
            fontWeight: 600,
            lineHeight: 1.3,
            maxWidth: '900px',
            color: 'rgba(255,255,255,0.95)',
          }}
        >
          Aprenda francês e inglês com micro-histórias e revisão espaçada
        </p>
        <p
          style={{
            marginTop: '24px',
            fontSize: '28px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Método Ponte Português · Feito para brasileiros
        </p>
      </div>
    ),
    { ...size },
  );
}
