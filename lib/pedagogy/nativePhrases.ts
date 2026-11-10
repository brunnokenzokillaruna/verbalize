import type { HookResult, LessonTag, ProficiencyLevel, SupportedLanguage } from '@/types';

/**
 * Spoken French “sound native” phrases — piggybacked into Hook / Practice / SRS chunks.
 * Mix of everyday France + Québec usage. Variety is real regional speech, not filler.
 */

export type NativePhraseFunction =
  | 'greeting'
  | 'agreement'
  | 'reaction'
  | 'hedging'
  | 'connector'
  | 'courtesy'
  | 'state'
  | 'closing';

/** Where the phrase is everyday: France, Québec, or both. */
export type NativePhraseRegion = 'fr' | 'qc' | 'both';

export type NativePhrase = {
  phrase: string;
  translationPt: string;
  fn: NativePhraseFunction;
  /** Earliest CEFR where the phrase is fair game in prompts. */
  minLevel: ProficiencyLevel;
  region: NativePhraseRegion;
};

const LEVEL_RANK: Record<ProficiencyLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

/**
 * High-frequency spoken reactions used by francophones day to day.
 * QC entries are marked so prompts can sprinkle authentic Québec speech
 * without turning the whole dialogue into joual.
 */
export const NATIVE_FRENCH_PHRASES: readonly NativePhrase[] = [
  // ── Greeting / check-in ───────────────────────────────────────────────
  { phrase: 'Ça va ?', translationPt: 'E aí? / Tudo bem?', fn: 'greeting', minLevel: 'A1', region: 'both' },
  { phrase: 'Ça va bien ?', translationPt: 'Tudo bem?', fn: 'greeting', minLevel: 'A1', region: 'both' },
  { phrase: 'Tu fais quoi ?', translationPt: 'Tá fazendo o quê?', fn: 'greeting', minLevel: 'A1', region: 'fr' },
  { phrase: 'Quoi de neuf ?', translationPt: 'E aí, novidade?', fn: 'greeting', minLevel: 'A2', region: 'both' },
  { phrase: 'Ça fait longtemps !', translationPt: 'Faz tempo!', fn: 'greeting', minLevel: 'A2', region: 'both' },
  { phrase: 'Coucou !', translationPt: 'Oiê!', fn: 'greeting', minLevel: 'A1', region: 'fr' },
  { phrase: 'Re !', translationPt: 'Oi de novo!', fn: 'greeting', minLevel: 'A2', region: 'fr' },
  { phrase: 'Allô ?', translationPt: 'Alô? / Oi?', fn: 'greeting', minLevel: 'A1', region: 'qc' },
  { phrase: 'Ça va-tu ?', translationPt: 'Tudo bem? (QC)', fn: 'greeting', minLevel: 'A2', region: 'qc' },
  { phrase: 'Comment ça va ?', translationPt: 'Como vai?', fn: 'greeting', minLevel: 'A1', region: 'both' },

  // ── Agreement / go-ahead ──────────────────────────────────────────────
  { phrase: 'Ça marche !', translationPt: 'Fechado! / Combinado!', fn: 'agreement', minLevel: 'A1', region: 'fr' },
  { phrase: "D'accord.", translationPt: 'Beleza. / Ok.', fn: 'agreement', minLevel: 'A1', region: 'both' },
  { phrase: 'OK.', translationPt: 'Ok.', fn: 'agreement', minLevel: 'A1', region: 'both' },
  { phrase: 'Pas de souci.', translationPt: 'Sem problema.', fn: 'agreement', minLevel: 'A1', region: 'fr' },
  { phrase: 'Pas de problème.', translationPt: 'Sem problema.', fn: 'agreement', minLevel: 'A1', region: 'both' },
  { phrase: "Y'a pas de problème.", translationPt: 'Não tem problema.', fn: 'agreement', minLevel: 'A2', region: 'qc' },
  { phrase: "T'inquiète !", translationPt: 'Relaxa! / Sem drama!', fn: 'agreement', minLevel: 'A2', region: 'fr' },
  { phrase: 'Tranquille.', translationPt: 'De boa.', fn: 'agreement', minLevel: 'A2', region: 'fr' },
  { phrase: "Vas-y !", translationPt: 'Manda ver! / Pode ir!', fn: 'agreement', minLevel: 'A1', region: 'fr' },
  { phrase: 'Allez !', translationPt: 'Vamos! / Anda!', fn: 'agreement', minLevel: 'A1', region: 'fr' },
  { phrase: 'Aweille !', translationPt: 'Anda! / Bora! (QC)', fn: 'agreement', minLevel: 'A2', region: 'qc' },
  { phrase: 'Enweille !', translationPt: 'Anda logo! (QC)', fn: 'agreement', minLevel: 'B1', region: 'qc' },
  { phrase: 'Pourquoi pas ?', translationPt: 'Por que não?', fn: 'agreement', minLevel: 'A2', region: 'both' },
  { phrase: 'Ça me dit bien !', translationPt: 'Eu topo!', fn: 'agreement', minLevel: 'A2', region: 'fr' },
  { phrase: 'Ça me tente.', translationPt: 'Me dá vontade. / Topo.', fn: 'agreement', minLevel: 'A2', region: 'both' },
  { phrase: 'Ça se tente.', translationPt: 'Vale tentar.', fn: 'agreement', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est noté.", translationPt: 'Anotei. / Combinado.', fn: 'agreement', minLevel: 'A2', region: 'fr' },
  { phrase: 'On est bon.', translationPt: 'Fechamos. / Tá ok.', fn: 'agreement', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est correct.", translationPt: 'Tá bom. / Tudo certo. (QC)', fn: 'agreement', minLevel: 'A2', region: 'qc' },
  { phrase: 'Ça marche-tu ?', translationPt: 'Combinado? / Pode ser? (QC)', fn: 'agreement', minLevel: 'A2', region: 'qc' },
  { phrase: 'Deal.', translationPt: 'Fechado.', fn: 'agreement', minLevel: 'B1', region: 'fr' },
  { phrase: 'Volontiers.', translationPt: 'Com prazer. / Topo.', fn: 'agreement', minLevel: 'A2', region: 'both' },

  // ── Reactions (surprise, emphasis, evaluation) ────────────────────────
  { phrase: 'Ah bon ?', translationPt: 'Sério? / É mesmo?', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: "C'est vrai ?", translationPt: 'É verdade?', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Sérieux ?', translationPt: 'Sério?', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Sans blague ?', translationPt: 'Sem brincadeira?', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Sans déconner ?', translationPt: 'Sem zoar?', fn: 'reaction', minLevel: 'B1', region: 'fr' },
  { phrase: "Tu m'étonnes !", translationPt: 'Nem me fala!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Carrément !', translationPt: 'Com certeza! / Demais!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Grave !', translationPt: 'Demais! / Real!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Totalement.', translationPt: 'Totalmente.', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: "C'est clair !", translationPt: 'Óbvio!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Tout à fait.', translationPt: 'Exatamente.', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: 'Exactement.', translationPt: 'Exatamente.', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Pas du tout !', translationPt: 'De jeito nenhum!', fn: 'reaction', minLevel: 'A1', region: 'fr' },
  { phrase: 'Pantoute !', translationPt: 'De jeito nenhum! (QC)', fn: 'reaction', minLevel: 'A2', region: 'qc' },
  { phrase: 'Bah oui !', translationPt: 'Ué, claro!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Bah non !', translationPt: 'Ué, não!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Ben oui.', translationPt: 'Pois é / claro.', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: 'Ben non.', translationPt: 'Pois não.', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: 'Ben voilà !', translationPt: 'Pronto! / Tá vendo?', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Ben là.', translationPt: 'Poxa / olha… (QC)', fn: 'reaction', minLevel: 'A2', region: 'qc' },
  { phrase: 'Coudonc.', translationPt: 'Ora essa. / Ué. (QC)', fn: 'reaction', minLevel: 'B1', region: 'qc' },
  { phrase: 'Je vois.', translationPt: 'Entendi.', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Ah ouais.', translationPt: 'Ah é. / Entendi.', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Ouais.', translationPt: 'É. / Aham.', fn: 'reaction', minLevel: 'A1', region: 'fr' },
  { phrase: 'Nan.', translationPt: 'Não.', fn: 'reaction', minLevel: 'A1', region: 'fr' },
  { phrase: 'Waouh !', translationPt: 'Uau!', fn: 'reaction', minLevel: 'A1', region: 'fr' },
  { phrase: 'Oh là là !', translationPt: 'Nossa!', fn: 'reaction', minLevel: 'A1', region: 'fr' },
  { phrase: 'Dis donc !', translationPt: 'Nossa! / Olha só!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Trop bien !', translationPt: 'Muito bom!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est trop bien !", translationPt: 'É bom demais!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est super !", translationPt: 'Que legal!', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: "C'est génial !", translationPt: 'É demais!', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: "C'est cool !", translationPt: 'Que legal!', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: "C'est sympa !", translationPt: 'Que simpático! / Legal!', fn: 'reaction', minLevel: 'A1', region: 'fr' },
  { phrase: "C'est nickel !", translationPt: 'Tá perfeito!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est impec !", translationPt: 'Tá impecável!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est top !", translationPt: 'Muito top!', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est ouf !", translationPt: 'É louco / absurdo!', fn: 'reaction', minLevel: 'B1', region: 'fr' },
  { phrase: "C'est chaud.", translationPt: 'Tá puxado. / Complicado.', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "C'est abusé.", translationPt: 'É absurdo / demais.', fn: 'reaction', minLevel: 'B1', region: 'fr' },
  { phrase: "C'est le fun !", translationPt: 'Que divertido! (QC)', fn: 'reaction', minLevel: 'A2', region: 'qc' },
  { phrase: "C'est l'fun !", translationPt: 'Que divertido! (QC)', fn: 'reaction', minLevel: 'A2', region: 'qc' },
  { phrase: "C'est malade !", translationPt: 'É incrível! (QC)', fn: 'reaction', minLevel: 'B1', region: 'qc' },
  { phrase: "C'est plate.", translationPt: 'Que chato. (QC)', fn: 'reaction', minLevel: 'A2', region: 'qc' },
  { phrase: 'Nice !', translationPt: 'Nice! / Legal!', fn: 'reaction', minLevel: 'A2', region: 'qc' },
  { phrase: 'Hein ?', translationPt: 'Né? / Hã?', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Comment ça ?', translationPt: 'Como assim?', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Attends.', translationPt: 'Espera.', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Attends une seconde.', translationPt: 'Espera um segundo.', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: 'Ça vaut le coup.', translationPt: 'Vale a pena.', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: 'Ça vaut vraiment le coup.', translationPt: 'Vale muito a pena.', fn: 'reaction', minLevel: 'A2', region: 'fr' },
  { phrase: "J'adore !", translationPt: 'Adoro!', fn: 'reaction', minLevel: 'A1', region: 'both' },
  { phrase: 'Je kiffe.', translationPt: 'Eu curto / amo isso.', fn: 'reaction', minLevel: 'B1', region: 'fr' },
  { phrase: "J'ai hâte !", translationPt: 'Mal posso esperar!', fn: 'reaction', minLevel: 'A2', region: 'both' },

  // ── Hedging / soft no / shrug ─────────────────────────────────────────
  { phrase: 'Je sais pas.', translationPt: 'Não sei.', fn: 'hedging', minLevel: 'A1', region: 'fr' },
  { phrase: 'Ché pas.', translationPt: 'Sei lá. (falado)', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: 'Aucune idée.', translationPt: 'Nenhuma ideia.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'Ça dépend.', translationPt: 'Depende.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'On verra.', translationPt: 'A gente vê.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'On verra bien.', translationPt: 'Vamos ver.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: "C'est pas grave.", translationPt: 'Não tem problema.', fn: 'hedging', minLevel: 'A1', region: 'fr' },
  { phrase: "C'est correct comme ça.", translationPt: 'Assim tá bom. (QC)', fn: 'hedging', minLevel: 'A2', region: 'qc' },
  { phrase: 'Tant pis !', translationPt: 'Que pena / paciência!', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'Tant mieux !', translationPt: 'Ainda bem!', fn: 'reaction', minLevel: 'A2', region: 'both' },
  { phrase: "C'est dommage.", translationPt: 'Que pena.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'Laisse tomber.', translationPt: 'Deixa pra lá.', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: 'Laisse faire.', translationPt: 'Deixa quieto.', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: "Ça m'est égal.", translationPt: 'Tanto faz.', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: 'Peu importe.', translationPt: 'Tanto faz.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'Bof.', translationPt: 'Meh. / Mais ou menos.', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: 'Mouais.', translationPt: 'Sei lá… / Mais ou menos.', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: 'Pff.', translationPt: 'Pff.', fn: 'hedging', minLevel: 'A2', region: 'fr' },
  { phrase: 'Je verrai.', translationPt: 'Eu vejo depois.', fn: 'hedging', minLevel: 'A2', region: 'both' },
  { phrase: 'Pas sûr.', translationPt: 'Não tenho certeza.', fn: 'hedging', minLevel: 'A1', region: 'both' },
  { phrase: 'Possible.', translationPt: 'Pode ser.', fn: 'hedging', minLevel: 'A1', region: 'both' },

  // ── Connectors (spoken glue) ──────────────────────────────────────────
  { phrase: 'À mon avis...', translationPt: 'Na minha opinião...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'En fait...', translationPt: 'Na verdade...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'En vrai...', translationPt: 'Na real...', fn: 'connector', minLevel: 'A2', region: 'fr' },
  { phrase: 'Du coup...', translationPt: 'Aí / então...', fn: 'connector', minLevel: 'A2', region: 'fr' },
  { phrase: 'Donc...', translationPt: 'Então...', fn: 'connector', minLevel: 'A1', region: 'both' },
  { phrase: 'Bref...', translationPt: 'Enfim...', fn: 'connector', minLevel: 'A2', region: 'fr' },
  { phrase: 'En gros...', translationPt: 'Resumindo...', fn: 'connector', minLevel: 'A2', region: 'fr' },
  { phrase: 'Genre...', translationPt: 'Tipo...', fn: 'connector', minLevel: 'A2', region: 'fr' },
  { phrase: 'Franchement...', translationPt: 'Sinceramente...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'Honnêtement...', translationPt: 'Honestamente...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'Sinon...', translationPt: 'Senão / fora isso...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'Par contre...', translationPt: 'Por outro lado...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'Faque...', translationPt: 'Aí / então... (QC)', fn: 'connector', minLevel: 'A2', region: 'qc' },
  { phrase: 'Fak...', translationPt: 'Aí / então... (QC)', fn: 'connector', minLevel: 'B1', region: 'qc' },
  { phrase: 'Tsé...', translationPt: 'Né... / sabe... (QC)', fn: 'connector', minLevel: 'A2', region: 'qc' },
  { phrase: 'Tu sais...', translationPt: 'Sabe...', fn: 'connector', minLevel: 'A1', region: 'both' },
  { phrase: 'Écoute...', translationPt: 'Olha... / Escuta...', fn: 'connector', minLevel: 'A2', region: 'both' },
  { phrase: 'Regarde...', translationPt: 'Olha só...', fn: 'connector', minLevel: 'A1', region: 'both' },

  // ── Courtesy ──────────────────────────────────────────────────────────
  { phrase: 'Avec plaisir !', translationPt: 'Com prazer!', fn: 'courtesy', minLevel: 'A1', region: 'both' },
  { phrase: "C'est gentil !", translationPt: 'Que legal da sua parte!', fn: 'courtesy', minLevel: 'A1', region: 'both' },
  { phrase: "Je t'en prie.", translationPt: 'De nada. / Imagina.', fn: 'courtesy', minLevel: 'A2', region: 'fr' },
  { phrase: 'De rien.', translationPt: 'De nada.', fn: 'courtesy', minLevel: 'A1', region: 'both' },
  { phrase: 'Bienvenue.', translationPt: 'De nada. (QC)', fn: 'courtesy', minLevel: 'A1', region: 'qc' },
  { phrase: 'Merci beaucoup !', translationPt: 'Muito obrigado!', fn: 'courtesy', minLevel: 'A1', region: 'both' },
  { phrase: 'Merci bien !', translationPt: 'Valeu!', fn: 'courtesy', minLevel: 'A1', region: 'qc' },
  { phrase: "S'il te plaît.", translationPt: 'Por favor.', fn: 'courtesy', minLevel: 'A1', region: 'both' },
  { phrase: "S'il vous plaît.", translationPt: 'Por favor (formal).', fn: 'courtesy', minLevel: 'A1', region: 'both' },

  // ── States / feelings ─────────────────────────────────────────────────
  { phrase: "J'en ai marre !", translationPt: 'Tô de saco cheio!', fn: 'state', minLevel: 'A2', region: 'fr' },
  { phrase: "J'ai la flemme.", translationPt: 'Tô com preguiça.', fn: 'state', minLevel: 'A2', region: 'fr' },
  { phrase: "J'ai un petit creux.", translationPt: 'Tô com uma fominha.', fn: 'state', minLevel: 'A2', region: 'fr' },
  { phrase: "J'ai la dalle.", translationPt: 'Tô faminto.', fn: 'state', minLevel: 'A2', region: 'fr' },
  { phrase: 'Je suis crevé(e).', translationPt: 'Tô morto(a) de cansaço.', fn: 'state', minLevel: 'A2', region: 'fr' },
  { phrase: 'Je suis HS.', translationPt: 'Tô destruído(a) / offline.', fn: 'state', minLevel: 'B1', region: 'fr' },
  { phrase: "Je suis knacké(e).", translationPt: 'Tô acabado(a).', fn: 'state', minLevel: 'B1', region: 'fr' },
  { phrase: "Ça me saoule.", translationPt: 'Isso me enche o saco.', fn: 'state', minLevel: 'B1', region: 'fr' },
  { phrase: "J'ai mon voyage.", translationPt: 'Já deu pra mim. (QC)', fn: 'state', minLevel: 'B1', region: 'qc' },
  { phrase: "Je suis tanné(e).", translationPt: 'Tô de saco cheio. (QC)', fn: 'state', minLevel: 'A2', region: 'qc' },
  { phrase: "J'ai hâte de partir.", translationPt: 'Mal posso esperar pra ir.', fn: 'state', minLevel: 'A2', region: 'both' },
  { phrase: "Je stresse.", translationPt: 'Tô estressado(a).', fn: 'state', minLevel: 'A2', region: 'both' },
  { phrase: 'Je suis à bout.', translationPt: 'Tô no limite.', fn: 'state', minLevel: 'B1', region: 'both' },

  // ── Closings ──────────────────────────────────────────────────────────
  { phrase: "À tout à l'heure !", translationPt: 'Até daqui a pouco!', fn: 'closing', minLevel: 'A1', region: 'fr' },
  { phrase: 'À plus !', translationPt: 'Até mais!', fn: 'closing', minLevel: 'A1', region: 'fr' },
  { phrase: 'À plus tard !', translationPt: 'Até mais tarde!', fn: 'closing', minLevel: 'A1', region: 'both' },
  { phrase: 'À demain !', translationPt: 'Até amanhã!', fn: 'closing', minLevel: 'A1', region: 'both' },
  { phrase: 'À tantôt !', translationPt: 'Até já! (QC)', fn: 'closing', minLevel: 'A1', region: 'qc' },
  { phrase: 'Bye !', translationPt: 'Tchau!', fn: 'closing', minLevel: 'A1', region: 'qc' },
  { phrase: 'Ciao !', translationPt: 'Tchau!', fn: 'closing', minLevel: 'A1', region: 'fr' },
  { phrase: 'Bonne journée !', translationPt: 'Bom dia / boa tarde!', fn: 'closing', minLevel: 'A1', region: 'both' },
  { phrase: 'Bonne soirée !', translationPt: 'Boa noite (ao sair)!', fn: 'closing', minLevel: 'A1', region: 'both' },
  { phrase: 'À la prochaine !', translationPt: 'Até a próxima!', fn: 'closing', minLevel: 'A2', region: 'both' },
] as const;

const CONVERSATIONAL_TAGS: ReadonlySet<LessonTag> = new Set([
  'DIAL',
  'EXPR',
  'MISS',
  'CULT',
]);

function normalizePhraseKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[…]/g, '...')
    .replace(/\s+/g, ' ');
}

const PHRASE_BY_KEY = new Map(
  NATIVE_FRENCH_PHRASES.map((p) => [normalizePhraseKey(p.phrase), p] as const),
);

export function isNativeFrenchPhrase(text: string | undefined | null): boolean {
  if (!text?.trim()) return false;
  return PHRASE_BY_KEY.has(normalizePhraseKey(text));
}

export function getNativeFrenchPhrase(text: string): NativePhrase | undefined {
  return PHRASE_BY_KEY.get(normalizePhraseKey(text));
}

function levelAllowed(phrase: NativePhrase, level: ProficiencyLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[phrase.minLevel];
}

/** Deterministic 32-bit hash so the same lesson keeps a stable phrase set. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function lessonSeed(params: {
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
  salt?: string;
}): number {
  return hashSeed(
    [
      params.level,
      params.tag,
      params.theme ?? '',
      params.grammarFocus ?? '',
      params.uiTitle ?? '',
      params.salt ?? '',
    ].join('|'),
  );
}

function themeHints(theme: string, grammarFocus: string, uiTitle?: string): NativePhraseFunction[] {
  const blob = `${theme} ${grammarFocus} ${uiTitle ?? ''}`.toLowerCase();
  const fns: NativePhraseFunction[] = ['reaction', 'agreement'];

  if (/cumpriment|saudação|saudacao|ça va|comment ça|bonjour|meeting|rede|social/.test(blob)) {
    fns.unshift('greeting', 'courtesy');
  }
  if (/opini|avis|pense|trouve|persu|debate|conect/.test(blob)) {
    fns.unshift('connector', 'hedging');
  }
  if (/cansa|fome|flemme|estado|fim de semana|weekend|miss|miss[aã]o|urg/.test(blob)) {
    fns.unshift('state', 'hedging');
  }
  if (/despedi|à plus|tchau|até|close|partir|bye|tantôt/.test(blob)) {
    fns.unshift('closing');
  }
  if (/reação|reacao|nativ|informal|argot|express|québec|quebec/.test(blob)) {
    fns.unshift('reaction', 'agreement', 'connector');
  }

  return [...new Set(fns)];
}

/**
 * Pick a varied, lesson-stable subset. Different lessons get different reactions
 * (seeded shuffle) so the model does not default to Carrément / Ça marche every time.
 */
export function pickNativePhrasesForLesson(params: {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
  limit?: number;
  /** Optional extra salt (e.g. 'hook' vs 'practice') for distinct draws. */
  salt?: string;
}): NativePhrase[] {
  if (params.language !== 'fr' || !CONVERSATIONAL_TAGS.has(params.tag)) return [];

  const limit = params.limit ?? 6;
  const preferredFns = themeHints(
    params.theme ?? '',
    params.grammarFocus ?? '',
    params.uiTitle,
  );
  const seed = lessonSeed(params);
  const pool = seededShuffle(
    NATIVE_FRENCH_PHRASES.filter((p) => levelAllowed(p, params.level)),
    seed,
  );

  const byFn = new Map<NativePhraseFunction, NativePhrase[]>();
  for (const phrase of pool) {
    const list = byFn.get(phrase.fn) ?? [];
    list.push(phrase);
    byFn.set(phrase.fn, list);
  }

  const picked: NativePhrase[] = [];
  const seen = new Set<string>();

  const take = (phrase: NativePhrase | undefined) => {
    if (!phrase || picked.length >= limit) return;
    const key = normalizePhraseKey(phrase.phrase);
    if (seen.has(key)) return;
    seen.add(key);
    picked.push(phrase);
  };

  // One from each preferred function (already shuffled inside groups via pool order)
  for (const fn of preferredFns) {
    take(byFn.get(fn)?.[0]);
  }

  // Guarantee at least one Québec everyday line from A2+ when the pool has one
  if (LEVEL_RANK[params.level] >= LEVEL_RANK.A2) {
    const qcHit = pool.find((p) => p.region === 'qc' && !seen.has(normalizePhraseKey(p.phrase)));
    take(qcHit);
  }

  // Fill remaining from the shuffled pool (keeps region mix natural)
  for (const phrase of pool) {
    if (picked.length >= limit) break;
    take(phrase);
  }

  return picked.slice(0, limit);
}

/** Find bank phrases that actually appear in dialogue text. */
export function findNativePhrasesInText(dialogue: string): NativePhrase[] {
  if (!dialogue.trim()) return [];
  const hay = normalizePhraseKey(dialogue);
  const hits: NativePhrase[] = [];
  const hitKeys = new Set<string>();

  const ordered = [...NATIVE_FRENCH_PHRASES].sort(
    (a, b) => b.phrase.length - a.phrase.length,
  );

  for (const phrase of ordered) {
    const key = normalizePhraseKey(phrase.phrase);
    const needle = key.replace(/\.\.\.$/, '');
    if (needle.length < 3) continue;
    if (!hay.includes(needle)) continue;
    if (hitKeys.has(key)) continue;
    hitKeys.add(key);
    hits.push(phrase);
  }

  return hits;
}

function formatPickLine(p: NativePhrase): string {
  const region =
    p.region === 'qc' ? 'QC' : p.region === 'fr' ? 'FR' : 'FR/QC';
  return `- "${p.phrase}" (${p.translationPt}) [${p.fn} · ${region}]`;
}

export function buildNativePhraseHookGuidance(params: {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
}): string {
  const picks = pickNativePhrasesForLesson({ ...params, limit: 8, salt: 'hook' });
  if (picks.length === 0) return '';

  const lines = picks.map(formatPickLine).join('\n');

  return `
⚠️ FRASES NATIVAS FR + QC (fala real — variedade) ⚠️
Sugestões para ESTA lição (já rotacionadas — não copie sempre as mesmas):
${lines}
- Use 1–2 no diálogo quando couber. Pode escolher EQUIVALENTES falados igualmente naturais (FR ou QC).
- PROIBIDO repetir sempre "Carrément !" / "Ça marche !" / "Ah bon ?" se outra reação encaixa melhor na cena.
- Pelo menos 1 turno = SÓ reação curta (1–4 palavras).
- Marcadas QC = québécois do dia a dia: pode usar 1 se a cena permitir; o resto do diálogo continua em francês natural (não force joual em todas as falas).
- Inclua as frases usadas em newChunks (entryType "expression") com PT-BR natural.
- NÃO abra com ritual vazio "Ça va ?" a menos que o grammarFocus seja saudação.
`;
}

export function buildNativePhraseExerciseGuidance(params: {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  theme?: string;
  grammarFocus?: string;
  uiTitle?: string;
}): string {
  const picks = pickNativePhrasesForLesson({ ...params, limit: 6, salt: 'practice' });
  if (picks.length === 0) return '';

  const list = picks.map((p) => `"${p.phrase}"`).join(', ');

  return `
⚠️ FRASES NATIVAS — EXERCÍCIO DE FLUÊNCIA (variedade FR/QC) ⚠️
- Pelo menos 1 exercício DEVE testar a reação/frase certa no contexto (não tradução isolada).
- Prefira: "listen-and-respond", "social-roleplay", "bridge-choice" ou "context-choice".
- Distratores também devem ser falas reais — NÃO repita sempre Carrément / Ça marche como única resposta certa.
- Priorize (ou equivalentes naturais): ${list}.
- No feedback, diga em 1 linha quando o brasileiro usaria essa reação (e se for QC, mencione "no Quebec" só se a frase for tipicamente québécoise).
`;
}

type ChunkCarrier = {
  dialogue: string;
  newChunks?: HookResult['newChunks'];
};

/**
 * If the dialogue already used a bank phrase, ensure it lands in newChunks for SRS.
 */
export function enrichHookWithNativeChunks<T extends ChunkCarrier>(hook: T): T {
  const hits = findNativePhrasesInText(hook.dialogue);
  if (hits.length === 0) return hook;

  const existing = hook.newChunks ?? [];
  const existingKeys = new Set(existing.map((c) => normalizePhraseKey(c.phrase)));
  const additions = hits
    .filter((h) => !existingKeys.has(normalizePhraseKey(h.phrase)))
    .slice(0, 2)
    .map((h) => ({
      phrase: h.phrase,
      translation: h.translationPt,
      entryType: 'expression' as const,
    }));

  if (additions.length === 0) return hook;

  return {
    ...hook,
    newChunks: [...existing, ...additions].slice(0, 4),
  };
}

/** Short reaction examples for spoken-dialogue few-shots (rotated by seed). */
export function nativeReactionExamples(
  level: ProficiencyLevel,
  limit = 5,
  seedKey = '',
): string[] {
  const pool = NATIVE_FRENCH_PHRASES.filter(
    (p) =>
      levelAllowed(p, level) &&
      (p.fn === 'reaction' || p.fn === 'agreement' || p.fn === 'hedging') &&
      p.region !== 'qc', // few-shots stay FR-default; QC comes from the lesson pick list
  );
  return seededShuffle(pool, hashSeed(`reactions|${level}|${seedKey}`))
    .slice(0, limit)
    .map((p) => p.phrase);
}
