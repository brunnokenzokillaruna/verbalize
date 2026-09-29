/**
 * Run: npx tsx test-vocab-translation.ts
 */
import { isUntranslatedCopy, lookupStoredTranslation, pickBatchTranslation } from './lib/vocabTranslation';
import { isMissingTranslation } from './utils/vocabHelpers';
import type { UserVocabularyDocument } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(isUntranslatedCopy('precieuse', 'precieuse'), 'exact copy is not a translation');
assert(isUntranslatedCopy('precieuse', 'précieuse'), 'accent-only copy is not a translation');
assert(!isUntranslatedCopy('precieuse', 'preciosa'), 'preciosa is a real translation');
assert(!isUntranslatedCopy('retard', 'atraso'), 'atraso is a real translation');
assert(isUntranslatedCopy('précieuse', ''), 'empty translation is missing');
assert(isUntranslatedCopy('sinstaller', "s'installer"), 'apostrophe elision is still the French word');
assert(
  pickBatchTranslation('sinstaller', [{ word: 'sinstaller', translation: "s'installer" }], true) === undefined,
  'retry refuses a French elision such as sinstaller → s\'installer',
);

const stored = { Précieuse: 'preciosa', retard: 'atraso' };
assert(lookupStoredTranslation(stored, 'precieuse') === 'preciosa', 'lookup ignores accents and case');
assert(lookupStoredTranslation(stored, 'retard') === 'atraso', 'lookup finds exact key');
assert(lookupStoredTranslation(stored, 'bouton') === undefined, 'missing word stays unresolved');

assert(
  pickBatchTranslation('precieuse', [{ word: 'précieuse', translation: 'preciosa' }], false) === 'preciosa',
  'accented echo still counts as the same word',
);
assert(
  pickBatchTranslation('hôtel', [{ word: 'hotel', translation: 'hotel' }], false) === undefined,
  'first pass rejects a cognate copy',
);
assert(
  pickBatchTranslation('hôtel', [{ word: 'hôtel', translation: 'hotel' }], true) === 'hotel',
  'retry keeps a cognate that the library can display',
);
assert(
  pickBatchTranslation('menu', [{ word: 'menu', translation: 'menu' }], true) === 'menu',
  'retry keeps an identical cognate so the button can confirm it',
);
assert(
  pickBatchTranslation('pain', [{ word: 'outra', translation: 'pão' }, { word: 'chat', translation: 'gato' }], false) === undefined,
  'a batch item for a different word is ignored',
);

function vocab(partial: Pick<UserVocabularyDocument, 'word' | 'translation'> & { translationConfirmed?: boolean }): UserVocabularyDocument {
  return partial as UserVocabularyDocument;
}

assert(isMissingTranslation(vocab({ word: 'hôtel', translation: 'hôtel' })), 'placeholder equal to the word is missing');
assert(!isMissingTranslation(vocab({ word: 'hôtel', translation: 'hotel' })), 'accent-different cognate is visible');
assert(
  !isMissingTranslation(vocab({ word: 'menu', translation: 'menu', translationConfirmed: true })),
  'confirmed identical cognate is no longer missing',
);

console.log('vocab translation checks passed');
