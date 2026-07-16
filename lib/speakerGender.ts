/**
 * Infer dialogue speaker gender from names/roles so TTS voices match
 * (Sophie → female, Lucas → male) instead of naive line-index alternation.
 */

export type SpeakerGender = 'female' | 'male';

function normalizeSpeakerKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Common given names used in Verbalize dialogues (FR + EN). */
const FEMALE_NAMES = new Set(
  [
    // French
    'marie', 'sophie', 'camille', 'lea', 'emma', 'chloe', 'manon', 'ines', 'sarah',
    'jade', 'louise', 'alice', 'lina', 'julia', 'eva', 'clara', 'lucie', 'romane',
    'agathe', 'jeanne', 'margaux', 'noemie', 'elise', 'anais', 'julie', 'laura',
    'claire', 'anne', 'isabelle', 'catherine', 'nathalie', 'valerie', 'amelie',
    'celine', 'florence', 'helene', 'aurelie', 'pauline', 'marine', 'elodie',
    'charlotte', 'oceane', 'maelle', 'lena', 'zoe', 'nina', 'lisa', 'anna',
    // English
    'olivia', 'emily', 'sophia', 'ava', 'mia', 'amelia', 'harper', 'evelyn',
    'abigail', 'elizabeth', 'sofia', 'ella', 'scarlett', 'grace', 'chloe',
    'victoria', 'riley', 'aria', 'lily', 'aurora', 'zoe', 'penelope', 'layla',
    'nora', 'hannah', 'lucy', 'katie', 'jessica', 'jennifer', 'rachel', 'lauren',
  ].map(normalizeSpeakerKey),
);

const MALE_NAMES = new Set(
  [
    // French
    'lucas', 'thomas', 'julien', 'antoine', 'louis', 'hugo', 'arthur', 'nathan',
    'gabriel', 'raphael', 'leo', 'enzo', 'paul', 'jules', 'adam', 'victor',
    'noah', 'ethan', 'mathis', 'maxime', 'alexandre', 'clement', 'baptiste', 'romain',
    'marc', 'pierre', 'jean', 'michel', 'nicolas', 'david', 'olivier', 'francois',
    'sebastien', 'vincent', 'benoit', 'guillaume', 'florian', 'kevin', 'alexis',
    'matheo', 'theo', 'tom', 'max', 'liam', 'yanis', 'rayan', 'sacha',
    // English
    'jake', 'michael', 'daniel', 'ryan', 'james', 'john', 'robert', 'william',
    'joseph', 'charles', 'thomas', 'christopher', 'matthew', 'anthony', 'donald',
    'mark', 'steven', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george',
    'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'jack', 'ben', 'sam',
    'alex', 'chris', 'mike', 'nick', 'oliver', 'harry', 'charlie', 'oscar',
  ].map(normalizeSpeakerKey),
);

const FEMALE_ROLES = new Set(
  [
    'serveuse', 'cliente', 'dame', 'madame', 'mme', 'mlle', 'mademoiselle',
    'infirmiere', 'enseignante', 'professeure', 'hotesse', 'caissiere',
    'vendeuse', 'actrice', 'directrice', 'manageresse',
    'garconete', 'garçonete', 'atendente', 'recepcionista', 'cliente',
    'mulher', 'menina', 'senhora', 'mocinha',
    'woman', 'girl', 'lady', 'waitress', 'actress', 'hostess', 'mrs', 'ms', 'miss',
  ].map(normalizeSpeakerKey),
);

const MALE_ROLES = new Set(
  [
    'serveur', 'client', 'monsieur', 'mr', 'm', 'garcon', 'garçon',
    'infirmier', 'enseignant', 'professeur', 'vendeur', 'acteur', 'directeur',
    'garcom', 'garçom', 'homem', 'menino', 'senhor',
    'man', 'boy', 'waiter', 'actor', 'host', 'sir', 'gentleman',
  ].map(normalizeSpeakerKey),
);

export function parseSpeakerName(line: string): string | null {
  const match = line.match(/^([^:]+):/);
  if (!match) return null;
  const name = match[1].trim();
  return name.length > 0 ? name : null;
}

export function stripSpeakerPrefix(line: string): string {
  return line.replace(/^[^:]+:\s*/, '').trim();
}

export function inferSpeakerGender(name: string): SpeakerGender | 'unknown' {
  const key = normalizeSpeakerKey(name);

  if (!key || key === 'voce' || key === 'vous' || key === 'you') return 'unknown';
  if (key === 'a' || key === 'b' || key === 'speaker1' || key === 'speaker2') return 'unknown';

  if (FEMALE_NAMES.has(key) || FEMALE_ROLES.has(key)) return 'female';
  if (MALE_NAMES.has(key) || MALE_ROLES.has(key)) return 'male';

  // Morphological cues for job titles / labels
  if (/(euse|trice|iere|ienne)$/.test(key)) return 'female';
  if (/(eur|teur)$/.test(key) && !/(euse|trice)$/.test(key)) return 'male';

  return 'unknown';
}

/**
 * Map each distinct speaker label → female|male.
 * Unknown speakers get the opposite gender of a known co-speaker when possible,
 * otherwise fall back to first=female, second=male for variety.
 */
export function resolveSpeakerGenders(lines: string[]): Map<string, SpeakerGender> {
  const order: string[] = [];
  const inferred = new Map<string, SpeakerGender | 'unknown'>();

  for (const line of lines) {
    if (!line.trim()) continue;
    const name = parseSpeakerName(line);
    if (!name) continue;
    if (!inferred.has(name)) {
      order.push(name);
      inferred.set(name, inferSpeakerGender(name));
    }
  }

  // Lines without labels — synthesize Speaker1/Speaker2 placeholders
  if (order.length === 0) {
    const unlabeled = lines.filter((l) => l.trim());
    if (unlabeled.length > 0) order.push('Speaker1');
    if (unlabeled.length > 1) order.push('Speaker2');
    for (const name of order) inferred.set(name, 'unknown');
  }

  const known = [...inferred.values()].filter((g): g is SpeakerGender => g !== 'unknown');
  const result = new Map<string, SpeakerGender>();

  for (let i = 0; i < order.length; i++) {
    const name = order[i]!;
    const gender = inferred.get(name) ?? 'unknown';
    if (gender !== 'unknown') {
      result.set(name, gender);
      continue;
    }

    const opposite: SpeakerGender | null =
      known.includes('female') && !known.includes('male')
        ? 'male'
        : known.includes('male') && !known.includes('female')
          ? 'female'
          : null;

    const assigned: SpeakerGender = opposite ?? (i % 2 === 0 ? 'female' : 'male');
    result.set(name, assigned);
    known.push(assigned);
  }

  return result;
}

/** Stable speaker key for a dialogue line (named speaker or positional fallback). */
export function speakerKeyForLine(line: string, lineIndex: number, speakersInOrder: string[]): string {
  const named = parseSpeakerName(line);
  if (named) return named;
  if (speakersInOrder.length === 0) return lineIndex % 2 === 0 ? 'Speaker1' : 'Speaker2';
  return speakersInOrder[lineIndex % speakersInOrder.length] ?? (lineIndex % 2 === 0 ? 'Speaker1' : 'Speaker2');
}

export function listSpeakersInOrder(lines: string[]): string[] {
  const order: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const name = parseSpeakerName(line);
    if (name && !order.includes(name)) order.push(name);
  }
  return order;
}
