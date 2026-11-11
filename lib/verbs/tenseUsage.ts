import type { SupportedLanguage, VerbDocument, VerbTenseGuide } from '@/types';
import type { VerbTenseKey } from './tenseKeys';
import { hasVerbTense } from './tenseKeys';

/**
 * Shared "when to use" copy for Verb Explorer.
 * Same for every verb of a language — stamped into Firestore on save so the
 * client never needs a second AI call for explanations.
 */
const TENSE_USAGE_PT: Record<
  SupportedLanguage,
  Partial<Record<VerbTenseKey, string>>
> = {
  fr: {
    present:
      'Use para hábitos, fatos e o que acontece agora. É o tempo mais comum no dia a dia.',
    past:
      'Use para uma ação concluída no passado (passé composé). Em português costuma corresponder ao pretérito perfeito.',
    imperfect:
      'Use para descrever, contar hábitos antigos ou o “fundo” de uma história (imparfait). Em português: pretérito imperfeito.',
    pluperfect:
      'Use para algo que já tinha acontecido antes de outro momento no passado (plus-que-parfait).',
    future:
      'Use para planos ou previsões no futuro (futur simple). Mais formal ou distante que o futur proche.',
    nearFuture:
      'Use para intenção imediata: “vou + verbo” (aller + infinitif). Muito comum na fala.',
    futurePerfect:
      'Use para dizer que algo terá sido concluído antes de um ponto no futuro (futur antérieur).',
    conditional:
      'Use para hipóteses (“eu faria…”) e pedidos educados (conditionnel présent).',
    conditionalPast:
      'Use para o que teria acontecido, mas não aconteceu (conditionnel passé).',
    subjunctive:
      'Use depois de desejo, dúvida ou necessidade (il faut que…, je veux que…). Não é um “tempo” do calendário — é um modo.',
  },
  en: {
    present:
      'Use para hábitos, fatos e rotinas (present simple). Ex.: I work every day.',
    past:
      'Use para uma ação terminada no passado (simple past). Ex.: I worked yesterday.',
    presentContinuous:
      'Use para o que está acontecendo agora ou planos bem próximos (am/is/are + -ing).',
    pastContinuous:
      'Use para uma ação em andamento no passado, muitas vezes interrompida (was/were + -ing).',
    future:
      'Use will para decisões espontâneas, promessas e previsões.',
    nearFuture:
      'Use going to para planos já decididos ou quando há evidência clara.',
    conditional:
      'Use would + verbo para hipóteses e pedidos educados (“eu faria…”).',
    pluperfect:
      'Use had + particípio para algo que já tinha acontecido antes de outro passado.',
    conditionalPast:
      'Use would have + particípio para o que teria acontecido, mas não aconteceu.',
    futurePerfect:
      'Use will have + particípio para algo que terá sido concluído antes de um ponto no futuro.',
    imperfect:
      'Use para hábitos ou descrições no passado (used to / would, ou formas simples conforme o contexto).',
    subjunctive:
      'Aparece em estruturas fixas (I suggest that…, If I were…). Menos frequente no inglês cotidiano.',
  },
};

export function getTenseUsage(
  tense: VerbTenseKey,
  language: SupportedLanguage,
): string {
  return (
    TENSE_USAGE_PT[language][tense] ??
    'Este tempo verbal aparece em contextos específicos — veja o exemplo abaixo.'
  );
}

export function buildTenseGuide(
  tense: VerbTenseKey,
  language: SupportedLanguage,
  example: { target: string; portuguese: string },
): VerbTenseGuide {
  return {
    whenToUse: getTenseUsage(tense, language),
    example,
  };
}

/** Tenses that have conjugations but no usable example in tenseGuides. */
export function missingTenseGuideKeys(
  conjugations: VerbDocument['conjugations'],
  tenseGuides: VerbDocument['tenseGuides'] | undefined,
  language: SupportedLanguage,
  keys: readonly VerbTenseKey[],
): VerbTenseKey[] {
  void language;
  return keys.filter((key) => {
    if (!hasVerbTense(conjugations, key)) return false;
    const guide = tenseGuides?.[key];
    return !guide?.example?.target?.trim() || !guide?.example?.portuguese?.trim();
  });
}

export function mergeTenseGuides(
  language: SupportedLanguage,
  conjugations: VerbDocument['conjugations'],
  existing: VerbDocument['tenseGuides'] | undefined,
  examplesPatch:
    | Partial<Record<VerbTenseKey, { target: string; portuguese: string }>>
    | undefined,
): VerbDocument['tenseGuides'] {
  const next: NonNullable<VerbDocument['tenseGuides']> = {
    ...(existing ?? {}),
  };

  const keys = Object.keys(conjugations) as VerbTenseKey[];
  for (const key of keys) {
    if (!hasVerbTense(conjugations, key)) continue;
    const example = examplesPatch?.[key] ?? existing?.[key]?.example;
    if (!example?.target?.trim() || !example?.portuguese?.trim()) continue;
    next[key] = buildTenseGuide(key, language, {
      target: example.target.trim(),
      portuguese: example.portuguese.trim(),
    });
  }

  return next;
}
