import { generateGrammarBridge } from './app/actions/generateGrammarBridge';

async function test() {
  const result = await generateGrammarBridge({
    dialogue: "Alice: C'est un bon hôtel.",
    grammarFocus: "Vocabulário: Bon",
    language: "fr",
    tag: "VOC"
  });
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
