import { assertGeminiIntegrationAllowed } from './lib/geminiDevGuard';
import { generateHook } from './app/actions/generateHook';

assertGeminiIntegrationAllowed();

async function test() {
  const result = await generateHook({
    language: 'fr',
    level: 'A1',
    tag: 'MISS',
    interests: [],
    theme: 'Sécurité dans la rue',
    uiTitle: 'Parler avec le policier',
    grammarFocus: 'Demander des informations sur la sécurité de la rue',
    knownVocabulary: [],
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
