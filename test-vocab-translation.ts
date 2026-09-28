/**
 * Run: npx tsx test-vocab-translation.ts
 */
import { isUntranslatedCopy, lookupStoredTranslation } from './lib/vocabTranslation';

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

const stored = { Précieuse: 'preciosa', retard: 'atraso' };
assert(lookupStoredTranslation(stored, 'precieuse') === 'preciosa', 'lookup ignores accents and case');
assert(lookupStoredTranslation(stored, 'retard') === 'atraso', 'lookup finds exact key');
assert(lookupStoredTranslation(stored, 'bouton') === undefined, 'missing word stays unresolved');

console.log('vocab translation checks passed');
