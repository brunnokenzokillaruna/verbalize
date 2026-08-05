import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getGeminiKey } from '@/lib/env';
import { LIVE_ROLEPLAY_MODEL } from '@/features/roleplay-chat/constants';
import {
  createCustomScenario,
  CUSTOM_SCENARIO_LIMITS,
} from '@/features/roleplay-chat/buildCustomScenario';
import { buildRoleplaySystemInstruction } from '@/features/roleplay-chat/prompts';
import {
  getScenarioById,
  isPresetScenarioId,
} from '@/features/roleplay-chat/scenarios';
import type { LiveTokenResponse, RoleplayScenario } from '@/features/roleplay-chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Validated against the live catalog so preset ids never drift from scenarios.ts. */
const PresetIds = z.string().max(64).refine(isPresetScenarioId, {
  message: 'Unknown scenario',
});

const CustomScenarioSchema = z
  .object({
    titlePt: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.titlePt),
    descriptionPt: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.descriptionPt),
    settingPt: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.settingPt),
    characterName: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.characterName),
    characterRolePt: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.characterRolePt),
    userRolePt: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.userRolePt),
    objectivePt: z.string().min(1).max(CUSTOM_SCENARIO_LIMITS.objectivePt),
  })
  .strict();

const BodySchema = z
  .object({
    language: z.enum(['fr', 'en']),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    intensity: z.enum(['gentle', 'normal', 'challenging']).optional(),
    scenarioId: PresetIds.optional(),
    userRolePt: z.string().max(CUSTOM_SCENARIO_LIMITS.userRolePt).optional(),
    objectivePt: z.string().max(CUSTOM_SCENARIO_LIMITS.objectivePt).optional(),
    customScenario: CustomScenarioSchema.optional(),
  })
  .refine((b) => Boolean(b.scenarioId) !== Boolean(b.customScenario), {
    message: 'Provide exactly one of scenarioId or customScenario',
  })
  .refine(
    (b) =>
      !b.customScenario || (b.userRolePt === undefined && b.objectivePt === undefined),
    {
      message: 'Preset role overrides cannot accompany customScenario',
    },
  );

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

    const { language, level, intensity, scenarioId, userRolePt, objectivePt, customScenario } =
      parsed.data;

    let scenario: RoleplayScenario;
    if (customScenario) {
      scenario = createCustomScenario({ ...customScenario, level });
    } else {
      const found = getScenarioById(scenarioId!);
      if (!found) {
        return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });
      }
      scenario = found;
    }

    const systemInstruction = buildRoleplaySystemInstruction({
      language,
      // Presets own their CEFR level; only custom scenes follow the client's pick.
      level: customScenario ? level : scenario.level,
      scenario,
      userRolePt: customScenario ? scenario.userRolePt : userRolePt,
      objectivePt: customScenario ? scenario.objectivePt : objectivePt,
      intensity,
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
