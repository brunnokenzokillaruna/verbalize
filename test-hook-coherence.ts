/**
 * Manual regression script for dialogue coherence (key-on-door scenario).
 * Run: npx tsx test-hook-coherence.ts
 *
 * Requires GEMINI_API_KEY in .env.local
 */
import { generateHook } from './app/actions/generateHook';
import { validateDialogueCoherence } from './lib/validateDialogueCoherence';

const BAD_DIALOGUE = `Julia: Oh non, j'ai oublié ma clé sur la porte !
Victor: Bah, j'attends ici pendant que tu la cherches.
Julia: Merci, on attend ensemble devant cet immeuble sombre.
Victor: Pas de souci, j'ai attendu dix minutes sous cet arbre.
Julia: Super, je l'ai trouvée, on peut enfin rentrer !`;

async function testKnownBadDialogue() {
  console.log('\n--- Judge: known BAD dialogue (key scenario) ---');
  const result = await validateDialogueCoherence(BAD_DIALOGUE);
  console.log(JSON.stringify(result, null, 2));
  if (result?.pass) {
    console.warn('WARNING: judge should NOT pass the known bad dialogue');
  } else {
    console.log('OK: known bad dialogue correctly rejected');
  }
}

async function testGenerateHook() {
  console.log('\n--- generateHook: key / home scenario ---');
  const hook = await generateHook({
    language: 'fr',
    level: 'A2',
    tag: 'VERB',
    interests: [],
    theme: 'La maison',
    uiTitle: "Devant l'immeuble",
    grammarFocus: 'Verbe: oublier',
    knownVocabulary: ['porte', 'clé', 'attendre'],
  });

  if (!hook) {
    console.error('generateHook returned null');
    return;
  }

  console.log('\nDialogue:');
  console.log(hook.dialogue);
  console.log('\nTranslations:');
  hook.dialogueTranslations?.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  const coherence = await validateDialogueCoherence(hook.dialogue);
  console.log('\nCoherence judge:');
  console.log(JSON.stringify(coherence, null, 2));
}

async function main() {
  await testKnownBadDialogue();
  await testGenerateHook();
}

main().catch(console.error);
