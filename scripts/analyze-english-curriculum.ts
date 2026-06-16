import { ENGLISH_LESSONS } from '../lib/curriculum/english';

const keywords = [
  'phrasal', 'collocation', 'idiom', 'TH ', 'schwa', 'silent', 'stress', 'intonation',
  'homophone', 'present perfect', 'past perfect', 'modal', 'conditional', 'reported',
  'indirect speech', 'passive', 'relative', 'tag question', 'article', 'a/an', 'preposition',
  'transport', 'tube', 'oyster', 'doctor', 'GP', 'NHS', 'bank', 'phone', 'restaurant',
  'present continuous', 'gerund', 'hundred', 'thousand', 'customs', 'immigration',
  'british', 'american', 'discourse', 'linking', 'false friend', 'spelling', 'email',
  'small talk', 'CV', 'resume', 'interview', 'colloquial', 'slang', 'reduced form',
  'connected speech', 'weak form', 'ellipsis', 'cleft', 'inversion',
];

const found: Record<string, number> = {};
for (const kw of keywords) {
  found[kw] = ENGLISH_LESSONS.filter((l) =>
    `${l.grammarFocus} ${l.uiTitle} ${l.theme}`.toLowerCase().includes(kw.toLowerCase()),
  ).length;
}

const levels: Record<string, number> = {};
const tags: Record<string, number> = {};
const themes: Record<string, number> = {};
for (const l of ENGLISH_LESSONS) {
  levels[l.level] = (levels[l.level] || 0) + 1;
  tags[l.tag] = (tags[l.tag] || 0) + 1;
  themes[l.theme] = (themes[l.theme] || 0) + 1;
}

console.log('TOTAL', ENGLISH_LESSONS.length);
console.log('LEVELS', levels);
console.log('TAGS', tags);
console.log('\nKEYWORD COVERAGE:');
Object.entries(found)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([k, n]) => console.log(`  ${k}: ${n}`));

console.log('\nPRON lessons:');
ENGLISH_LESSONS.filter((l) => l.tag === 'PRON').forEach((l) =>
  console.log(`  ${l.id} [${l.level}] ${l.uiTitle} — ${l.grammarFocus}`),
);

console.log('\nGAP lessons (recent):');
const gapMarkers = ['Schwa', 'Silent Letters', 'Large Numbers', 'Oyster', 'Word Stress', 'At the Doctor', 'Opening an Account', 'Present Continuous', 'Intonation', 'Phone Call', 'Reserved Dinner', 'NHS'];
ENGLISH_LESSONS.filter((l) => gapMarkers.some((m) => (l.uiTitle ?? '').includes(m) || l.grammarFocus.includes(m))).forEach((l) =>
  console.log(`  ${l.id} [${l.tag}] ${l.uiTitle}`),
);
