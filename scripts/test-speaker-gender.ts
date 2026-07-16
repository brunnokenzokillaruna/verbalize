/**
 * Unit checks for speaker-gender → TTS voice mapping.
 * Run: npx tsx scripts/test-speaker-gender.ts
 */
import {
  inferSpeakerGender,
  resolveSpeakerGenders,
} from '../lib/speakerGender.ts';

let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

assert('Sophie is female', inferSpeakerGender('Sophie') === 'female');
assert('Lucas is male', inferSpeakerGender('Lucas') === 'male');
assert('Serveuse is female', inferSpeakerGender('Serveuse') === 'female');
assert('Serveur is male', inferSpeakerGender('Serveur') === 'male');
assert('Léa normalizes to female', inferSpeakerGender('Léa') === 'female');

const twoWomen = resolveSpeakerGenders([
  'Julie: Tu as passé un bon week-end ?',
  'Sophie: Oui, c\'était génial !',
  'Julie: Super !',
]);
assert('Julie → female', twoWomen.get('Julie') === 'female');
assert('Sophie → female (not forced male as 2nd speaker)', twoWomen.get('Sophie') === 'female');

const mixed = resolveSpeakerGenders([
  'Marc: Salut Sophie !',
  'Sophie: Salut Marc !',
]);
assert('Marc → male', mixed.get('Marc') === 'male');
assert('Sophie → female', mixed.get('Sophie') === 'female');

const maleFirst = resolveSpeakerGenders([
  'Lucas: Ça va ?',
  'Marie: Oui !',
]);
assert('Lucas first still male', maleFirst.get('Lucas') === 'male');
assert('Marie second still female', maleFirst.get('Marie') === 'female');

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll assertions passed');
