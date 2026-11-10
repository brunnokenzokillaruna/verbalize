import type { LessonTag } from '@/types';

/**
 * Dual-role dialogue piggyback — practice both sides of a real scene
 * (cliente ↔ profissional) inside DIAL/MISS Practice + MISS role-play flip,
 * without a new app tab.
 *
 * Pilot lesson (Practice): `fr-a1-092` (“5 Frases para Pedidos em Cafés”).
 * Pilot surface (MISS): scripted role-play second beat after the visitor round.
 */

export type DialogueRoleSide = 'visitor' | 'professional';

export type DialogueRolePair = {
  /** Match theme / title / grammarFocus / dialogue. */
  match: RegExp;
  /** Scene key for prompts and tests. */
  sceneKey: string;
  visitorRolePt: string;
  professionalRolePt: string;
  /** Short PT moves the visitor typically produces. */
  visitorMovesPt: readonly string[];
  /** Short PT moves the professional typically produces. */
  professionalMovesPt: readonly string[];
};

/** Situational pairs reused across café, hotel, shop, work, etc. */
export const DIALOGUE_ROLE_PAIRS: readonly DialogueRolePair[] = [
  {
    match: /caf[eé]|padaria|restaurante|bistr[oô]|gar[cç]om|garçon|pedido|card[aá]pio|barista|bar\b|viennoiserie/i,
    sceneKey: 'cafe',
    visitorRolePt: 'cliente',
    professionalRolePt: 'garçom / atendente',
    visitorMovesPt: ['pedir item', 'perguntar recomendação', 'pedir a conta'],
    professionalMovesPt: ['oferecer mesa', 'anotar pedido', 'perguntar bebida ou ponto da carne'],
  },
  {
    match: /hotel|check-?in|recep|quarto|pousada|albergue/i,
    sceneKey: 'hotel',
    visitorRolePt: 'hóspede',
    professionalRolePt: 'recepcionista',
    visitorMovesPt: ['fazer check-in', 'pedir Wi-Fi', 'reportar problema no quarto'],
    professionalMovesPt: ['pedir documento', 'explicar café da manhã', 'oferecer ajuda'],
  },
  {
    match: /farm[aá]cia|medicamento|rem[eé]dio|sintoma|dosi?agem/i,
    sceneKey: 'pharmacy',
    visitorRolePt: 'cliente',
    professionalRolePt: 'farmacêutico(a)',
    visitorMovesPt: ['descrever sintoma', 'perguntar dosagem', 'pedir genérico'],
    professionalMovesPt: ['perguntar alergia', 'explicar uso', 'oferecer alternativa'],
  },
  {
    match: /aeroporto|voo|bagagem|embarque|passaporte|alf[aâ]ndega/i,
    sceneKey: 'airport',
    visitorRolePt: 'passageiro',
    professionalRolePt: 'agente / comissário(a)',
    visitorMovesPt: ['perguntar portão', 'declarar bagagem', 'pedir ajuda'],
    professionalMovesPt: ['pedir documento', 'indicar fila', 'confirmar destino'],
  },
  {
    match: /loja|compras|vitrine|vendedor|tamanho|provar|mercado|supermercado/i,
    sceneKey: 'shop',
    visitorRolePt: 'cliente',
    professionalRolePt: 'vendedor(a)',
    visitorMovesPt: ['pedir tamanho', 'perguntar preço', 'pedir para provar'],
    professionalMovesPt: ['oferecer ajuda', 'sugerir tamanho', 'indicar caixa'],
  },
  {
    match: /banco|conta|cart[aã]o|saque|ag[eê]ncia/i,
    sceneKey: 'bank',
    visitorRolePt: 'cliente',
    professionalRolePt: 'atendente do banco',
    visitorMovesPt: ['abrir conta', 'pedir cartão', 'perguntar taxa'],
    professionalMovesPt: ['pedir documento', 'explicar produto', 'confirmar dados'],
  },
  {
    match: /entrevista|emprego|trabalho|recrut|rh\b|candidat/i,
    sceneKey: 'work',
    visitorRolePt: 'candidato(a)',
    professionalRolePt: 'entrevistador(a)',
    visitorMovesPt: ['falar de experiência', 'fazer uma pergunta', 'agradecer'],
    professionalMovesPt: ['pedir apresentação', 'perguntar motivação', 'encerrar entrevista'],
  },
  {
    match: /m[eé]dic|doutor|consulta|hospital|cl[ií]nica/i,
    sceneKey: 'clinic',
    visitorRolePt: 'paciente',
    professionalRolePt: 'médico(a) / enfermeiro(a)',
    visitorMovesPt: ['descrever sintoma', 'perguntar exame', 'confirmar receita'],
    professionalMovesPt: ['perguntar desde quando', 'explicar exame', 'dar orientação'],
  },
  {
    match: /metr[oô]|esta[cç][aã]o|dire[cç][aã]o|turista|mapa|bilhete|trem|ônibus|onibus/i,
    sceneKey: 'transit',
    visitorRolePt: 'turista / passageiro',
    professionalRolePt: 'morador(a) / agente',
    visitorMovesPt: ['pedir caminho', 'confirmar linha', 'perguntar horário'],
    professionalMovesPt: ['indicar direção', 'corrigir caminho', 'avisar próximo trem'],
  },
] as const;

const GENERIC_PAIR: DialogueRolePair = {
  match: /.*/,
  sceneKey: 'generic',
  visitorRolePt: 'você na situação',
  professionalRolePt: 'profissional do local',
  visitorMovesPt: ['pedir ajuda', 'fazer um pedido educado', 'confirmar informação'],
  professionalMovesPt: ['cumprimentar', 'oferecer ajuda', 'confirmar o pedido'],
};

export function normalizeSceneText(...parts: Array<string | undefined | null>): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ')
    .trim();
}

/** True when the lesson scene supports a clear visitor ↔ professional pair. */
export function isDualRoleScene(text: string): boolean {
  if (!text.trim()) return false;
  return DIALOGUE_ROLE_PAIRS.some((p) => p.match.test(text));
}

export function resolveDialogueRolePair(
  ...parts: Array<string | undefined | null>
): DialogueRolePair {
  const text = normalizeSceneText(...parts);
  if (!text) return GENERIC_PAIR;
  return DIALOGUE_ROLE_PAIRS.find((p) => p.match.test(text)) ?? GENERIC_PAIR;
}

export function roleLabelForSide(
  pair: DialogueRolePair,
  side: DialogueRoleSide,
): string {
  return side === 'visitor' ? pair.visitorRolePt : pair.professionalRolePt;
}

export function movesForSide(
  pair: DialogueRolePair,
  side: DialogueRoleSide,
): readonly string[] {
  return side === 'visitor' ? pair.visitorMovesPt : pair.professionalMovesPt;
}

/**
 * Prompt block for DIAL/MISS Practice: force one visitor turn + one professional turn
 * in the same mini-story (not a separate Roleplay module).
 */
export function buildDualRolePracticeGuidance(params: {
  tag: LessonTag;
  theme?: string;
  uiTitle?: string;
  grammarFocus?: string;
  dialogue?: string;
  /** When false, skip even if scene matches (e.g. GRAM-only sessions). */
  enabled?: boolean;
}): string {
  if (params.enabled === false) return '';
  if (params.tag !== 'DIAL' && params.tag !== 'MISS') return '';

  const pair = resolveDialogueRolePair(
    params.theme,
    params.uiTitle,
    params.grammarFocus,
    params.dialogue,
  );
  if (pair.sceneKey === 'generic') return '';

  const visitorMoves = pair.visitorMovesPt.map((m) => `"${m}"`).join(', ');
  const proMoves = pair.professionalMovesPt.map((m) => `"${m}"`).join(', ');

  return `
⚠️ PAPÉIS DUPLA FACE (vida real — mesmo cenário) ⚠️
Cena detectada: ${pair.sceneKey} (${pair.visitorRolePt} ↔ ${pair.professionalRolePt}).
- Em EXATAMENTE 2 exercícios de resposta situacional, o aluno deve treinar OS DOIS lados:
  1) roleSide "visitor" — learnerRolePt "${pair.visitorRolePt}", interlocutorRolePt "${pair.professionalRolePt}"
     Movimentos típicos: ${visitorMoves}
  2) roleSide "professional" — learnerRolePt "${pair.professionalRolePt}", interlocutorRolePt "${pair.visitorRolePt}"
     Movimentos típicos: ${proMoves}
- Preferência de tipos: visitor → "listen-and-respond" (ou "social-roleplay" se listen-and-respond não estiver no pool);
  professional → "free-roleplay" (ou "social-roleplay" se free-roleplay não estiver no pool).
- EXCEÇÃO à regra "não parear listen-and-respond com free-roleplay/social-roleplay":
  esse pareamento É OBRIGATÓRIO aqui porque são papéis diferentes (não a mesma resposta).
- context / contextPt DEVE deixar o papel explícito em PT-BR (ex.: "Você é o garçom…", "Você é o cliente…").
- Inclua nos data: "learnerRolePt", "interlocutorRolePt", "roleSide" ("visitor" | "professional").
- NÃO invente um módulo/aba de roleplay — continue a micro-narrativa da sessão.
`;
}

/** Hook generation: keep a clear visitor ↔ staff cast so Practice/MISS can flip. */
export function buildDualRoleHookGuidance(params: {
  tag: LessonTag;
  theme?: string;
  uiTitle?: string;
  grammarFocus?: string;
}): string {
  if (params.tag !== 'DIAL' && params.tag !== 'MISS') return '';
  const pair = resolveDialogueRolePair(params.theme, params.uiTitle, params.grammarFocus);
  if (pair.sceneKey === 'generic') return '';

  return `
DUAL-ROLE CAST (same scene, two pragmatic sides):
- Keep ONE clear professional speaker (${pair.professionalRolePt}) and the learner as visitor (${pair.visitorRolePt}) for the whole dialogue.
- Professional lines should include at least one of: ${pair.professionalMovesPt.map((m) => `"${m}"`).join(', ')}.
- Visitor lines should include at least one of: ${pair.visitorMovesPt.map((m) => `"${m}"`).join(', ')}.
- Do NOT merge both jobs into one speaker. Practice will later ask the learner to answer FROM BOTH sides.
`;
}

export type MissionRoleFlipCopy = {
  title: string;
  body: string;
  startCta: string;
  skipCta: string;
  professionalRolePt: string;
  visitorRolePt: string;
  sceneKey: string;
};

/** Whether MISS scripted role-play should offer an inverted second beat. */
export function shouldOfferMissionRoleFlip(
  ...parts: Array<string | undefined | null>
): boolean {
  return isDualRoleScene(normalizeSceneText(...parts));
}

export function buildMissionRoleFlipCopy(
  ...parts: Array<string | undefined | null>
): MissionRoleFlipCopy | null {
  const pair = resolveDialogueRolePair(...parts);
  if (pair.sceneKey === 'generic') return null;
  return {
    title: `Agora você é ${pair.professionalRolePt}`,
    body: `Você já treinou como ${pair.visitorRolePt}. Troque de lado e fale as falas do profissional na mesma conversa — ~1 minuto.`,
    startCta: `Continuar como ${pair.professionalRolePt}`,
    skipCta: 'Pular e ir para a prática',
    professionalRolePt: pair.professionalRolePt,
    visitorRolePt: pair.visitorRolePt,
    sceneKey: pair.sceneKey,
  };
}

/** Flip who speaks: former NPC lines become learner lines (and vice versa). */
export function invertMissionSpeakableLines<T extends { isUserLine: boolean }>(
  lines: readonly T[],
): T[] {
  return lines.map((line) => ({ ...line, isUserLine: !line.isUserLine }));
}

const ROLE_SIDE_VALUES = new Set(['visitor', 'professional']);

/** Soft-normalize optional dual-role fields on generated practice items. */
export function sanitizeDualRoleFields<T extends Record<string, unknown>>(data: T): T {
  const next: Record<string, unknown> = { ...data };
  const side = typeof next.roleSide === 'string' ? next.roleSide.trim().toLowerCase() : '';
  if (side && ROLE_SIDE_VALUES.has(side)) {
    next.roleSide = side;
  } else {
    delete next.roleSide;
  }
  for (const key of ['learnerRolePt', 'interlocutorRolePt'] as const) {
    const raw = next[key];
    if (typeof raw === 'string' && raw.trim()) {
      next[key] = raw.trim().slice(0, 80);
    } else {
      delete next[key];
    }
  }
  return next as T;
}
