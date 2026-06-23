import { NextResponse } from 'next/server';
import { getFirebaseConfigFromEnv } from '@/lib/firebaseConfig';

export async function GET() {
  try {
    const config = getFirebaseConfigFromEnv();

    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Firebase configuration unavailable' }, { status: 503 });
  }
}
