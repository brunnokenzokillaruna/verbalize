import type { VerbDocument, ConjugationSpeedData } from '@/types';

export function generateLocalDrill(verbDoc: VerbDocument): ConjugationSpeedData {
  const tenses = Object.keys(verbDoc.conjugations);
  // Prefer present, but allow others
  const randomTense = tenses[Math.floor(Math.random() * tenses.length)];
  const forms = (verbDoc.conjugations as any)[randomTense] as Record<string, string>;
  
  const pronouns = Object.keys(forms);
  const correctPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
  const correctForm = forms[correctPronoun];

  // Distractors: other forms of the same verb in the same tense
  const otherForms = Object.values(forms).filter(f => f !== correctForm);
  const distractors = new Set<string>();
  
  // Pick up to 3 distractors
  while (distractors.size < 3 && distractors.size < otherForms.length) {
    const randomForm = otherForms[Math.floor(Math.random() * otherForms.length)];
    distractors.add(randomForm);
  }

  // If not enough distractors (e.g., all forms are the same like in some english verbs), add fake ones or from other tenses
  if (distractors.size < 3) {
    const allForms = Object.values(verbDoc.conjugations).flatMap(c => Object.values(c || {}));
    const allUnique = [...new Set(allForms)].filter(f => f !== correctForm && !distractors.has(f));
    while (distractors.size < 3 && allUnique.length > 0) {
      const randomForm = allUnique[Math.floor(Math.random() * allUnique.length)];
      distractors.add(randomForm);
      allUnique.splice(allUnique.indexOf(randomForm), 1);
    }
  }

  // If STILL not enough, just make some up (rare fallback)
  if (distractors.size < 3) {
    distractors.add(correctForm + 's');
    distractors.add(correctForm + 'ent');
    distractors.add(correctForm + 'ons');
  }

  const options = [correctForm, ...Array.from(distractors).slice(0, 3)];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    verb: verbDoc.infinitive,
    pronoun: correctPronoun,
    tense: randomTense,
    correctForm,
    options,
    exampleSentence: `Exemplo de ${verbDoc.infinitive}`, // Simplification for fast mode
    translation: verbDoc.translation,
  };
}
