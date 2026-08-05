import type { RoleplayRolePair } from './types';
import { normalizeOneLine } from './buildCustomScenario';

const RULES: { match: RegExp; pairs: RoleplayRolePair[] }[] = [
  {
    match: /caf[eé]|barista|padaria|restaurante|bar\b/i,
    pairs: [
      {
        aiRolePt: 'barista / atendente',
        userRolesPt: ['cliente', 'turista pedindo indicação', 'cliente com reclamação'],
      },
      {
        aiRolePt: 'cliente regular',
        userRolesPt: ['barista em treinamento', 'gerente do café'],
      },
    ],
  },
  {
    match: /hotel|check-?in|recep/i,
    pairs: [
      {
        aiRolePt: 'recepcionista',
        userRolesPt: ['hóspede fazendo check-in', 'hóspede com problema no quarto'],
      },
      {
        aiRolePt: 'gerente do hotel',
        userRolesPt: ['hóspede pedindo upgrade', 'hóspede reclamando'],
      },
    ],
  },
  {
    match: /entrevista|emprego|trabalho|rh\b/i,
    pairs: [
      {
        aiRolePt: 'entrevistador(a) de RH',
        userRolesPt: ['candidato(a)', 'candidato(a) nervoso(a)'],
      },
    ],
  },
  {
    match: /m[eé]dic|doutor|consulta|sintoma|hospital/i,
    pairs: [
      {
        aiRolePt: 'médico(a)',
        userRolesPt: ['paciente', 'acompanhante do paciente'],
      },
      {
        aiRolePt: 'enfermeiro(a)',
        userRolesPt: ['paciente na triagem'],
      },
    ],
  },
  {
    match: /amigo|parque|fim de semana|encontro/i,
    pairs: [
      {
        aiRolePt: 'amigo(a) próximo(a)',
        userRolesPt: ['amigo(a)', 'conhecido(a) de longa data'],
      },
    ],
  },
  {
    match: /rua|dire[cç][aã]o|turista|mapa|esta[cç][aã]o/i,
    pairs: [
      {
        aiRolePt: 'morador(a) local',
        userRolesPt: ['turista perdido(a)', 'visitante pedindo dicas'],
      },
    ],
  },
];

const GENERIC_PAIRS: RoleplayRolePair[] = [
  {
    aiRolePt: 'atendente prestativo(a)',
    userRolesPt: ['cliente', 'pessoa pedindo ajuda'],
  },
  {
    aiRolePt: 'conhecido(a) simpático(a)',
    userRolesPt: ['você mesmo(a) na situação', 'visitante'],
  },
  {
    aiRolePt: 'profissional do local',
    userRolesPt: ['cliente / usuário do serviço'],
  },
];

function normalizeRoleLabel(value: string): string {
  return normalizeOneLine(value).toLocaleLowerCase('pt-BR');
}

/** Pure fallback used when Gemini is unavailable or returns garbage. */
export function suggestRolesFromTextLocal(scenarioText: string): RoleplayRolePair[] {
  const text = normalizeOneLine(scenarioText);
  if (!text) return GENERIC_PAIRS;

  const matched = RULES.filter((r) => r.match.test(text)).flatMap((r) => r.pairs);

  // Dedupe by aiRolePt, then top up with generics so callers always get 3–5 pairs.
  const seen = new Set<string>();
  const out: RoleplayRolePair[] = [];
  for (const p of [...matched, ...GENERIC_PAIRS]) {
    const key = normalizeRoleLabel(p.aiRolePt);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= 5) break;
  }
  return out.length >= 3 ? out : GENERIC_PAIRS;
}

export function userRolesForAiRole(pairs: RoleplayRolePair[], aiRolePt: string): string[] {
  const normalizedRole = normalizeRoleLabel(aiRolePt);
  const hit = pairs.find((p) => normalizeRoleLabel(p.aiRolePt) === normalizedRole);
  return hit?.userRolesPt?.length ? hit.userRolesPt : ['participante da conversa'];
}
