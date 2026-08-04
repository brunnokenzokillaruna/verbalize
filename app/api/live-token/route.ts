import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getGeminiKey } from '@/lib/env';
import { LIVE_ROLEPLAY_MODEL } from '@/features/roleplay-chat/constants';
import { buildRoleplaySystemInstruction } from '@/features/roleplay-chat/prompts';
import { getScenarioById } from '@/features/roleplay-chat/scenarios';
import type { LiveTokenResponse } from '@/features/roleplay-chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  language: z.enum(['fr', 'en']),
  scenarioId: z.enum([
    'cafe',
    'hotel',
    'job-interview',
    'doctor',
    'friend-catchup',
    'travel-help',
  ]),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

/**
 * Creates a short-lived Gemini Live ephemeral token so the browser can
 * open a WebSocket without receiving GEMINI_API_KEY.
 *
 * Config is NOT locked on the token — the browser client sends setup after
 * connect (avoids constraint mismatches). Requires apiVersion v1alpha.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { language, scenarioId, level } = parsed.data;
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });
    }

    if (!scenario.levels.includes(level)) {
      return NextResponse.json(
        { error: 'This scenario is not recommended for the selected level' },
        { status: 400 },
      );
    }

    const systemInstruction = buildRoleplaySystemInstruction({
      language,
      level,
      scenario,
    });

    const apiKey = getGeminiKey();
    const client = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1alpha',
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const authToken = await client.authTokens.create({
      config: {
        // Allow a couple of reconnect attempts from the same mint.
        uses: 3,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    if (!authToken.name) {
      return NextResponse.json({ error: 'Failed to create live token' }, { status: 502 });
    }

    const body: LiveTokenResponse = {
      token: authToken.name,
      model: LIVE_ROLEPLAY_MODEL,
      systemInstruction,
      expiresAt: expireTime,
    };

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[live-token]', err);
    const message = err instanceof Error ? err.message : 'Token creation failed';
    const missingKey = /Missing required server environment variable: GEMINI_API_KEY/i.test(
      message,
    );
    return NextResponse.json(
      {
        error: missingKey
          ? 'GEMINI_API_KEY não configurada no servidor.'
          : 'Não foi possível iniciar a sessão de voz. Tente novamente.',
      },
      { status: missingKey ? 503 : 502 },
    );
  }
}
