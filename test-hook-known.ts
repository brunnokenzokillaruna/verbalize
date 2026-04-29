import { generateHook } from './app/actions/generateHook';

async function test() {
  const result = await generateHook({
    language: 'fr',
    level: 'A1',
    tag: 'VOC',
    interests: [],
    theme: 'Tema 3: Check-in e Apresentações',
    uiTitle: 'Pegando a Chave',
    grammarFocus: 'Vocabulário: Bon',
    knownVocabulary: ['bon', 'jour', 'merci', 'oui'] // Add bon here!
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
