import assert from 'node:assert/strict';
import { normalizeExerciseArray } from '../lib/practiceExercises/normalizeExerciseArray';

const sample = [{ type: 'speak-repeat', data: { text: 'bonjour', translation: 'oi' } }];

assert.deepEqual(normalizeExerciseArray(sample), sample);
assert.equal(normalizeExerciseArray([]), null);
assert.equal(normalizeExerciseArray(null), null);
assert.equal(normalizeExerciseArray('nope'), null);
assert.deepEqual(normalizeExerciseArray({ exercises: sample }), sample);
assert.deepEqual(normalizeExerciseArray({ data: sample }), sample);
assert.deepEqual(normalizeExerciseArray({ items: sample }), sample);
assert.equal(normalizeExerciseArray({ exercises: [] }), null);

console.log('normalizeExerciseArray: ok');
