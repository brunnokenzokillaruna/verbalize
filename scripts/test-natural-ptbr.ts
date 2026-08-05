import { normalizeHookPtBr, normalizeToEverydayPtBr } from '../lib/naturalPtBr';

const cases: Array<[string, string]> = [
  // The reported failure, verbatim from the lesson dialogue.
  [
    'É verdade, mesmo que o terreno pareça estar em pousio atualmente.',
    'É verdade, mesmo que o terreno pareça estar abandonado atualmente.',
  ],
  ['O campo está em pousio.', 'O campo está abandonado.'],
  ['Pousio é o termo técnico.', 'Terreno abandonado é o termo técnico.'],
  ['Ele deixou o telemóvel no autocarro.', 'Ele deixou o celular no ônibus.'],
  ['Vamos cortar a relva do relvado.', 'Vamos cortar a grama do gramado.'],
  ['Outrora eu morava lá.', 'Antigamente eu morava lá.'],
  ['Ela pediu uma boleia até o mercado.', 'Ela pediu uma carona até o mercado.'],
  // Gender and number must survive, since the article is not rewritten.
  ['A rapariga comprou uma pastilha elástica.', 'A garota comprou uma goma de mascar.'],
  ['Os autocarros estão cheios.', 'Os ônibus estão cheios.'],
  // Must not touch words that merely contain a listed phrase.
  ['O repousio não existe.', 'O repousio não existe.'],
  ['Ele tem um relvadozinho.', 'Ele tem um relvadozinho.'],
  // Untouched everyday text stays byte-identical.
  ['O terreno está abandonado agora.', 'O terreno está abandonado agora.'],
];

let failures = 0;
for (const [input, expected] of cases) {
  const actual = normalizeToEverydayPtBr(input);
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL\n  in:       ${input}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

// A cached hook gets cleaned on read, without gaining undefined keys.
const cachedHook = {
  dialogue: "Nathan: C'est vrai, même si le terrain semble être en friche actuellement.",
  newVocabulary: ['friche'],
  dialogueTranslations: ['É verdade, mesmo que o terreno pareça estar em pousio atualmente.'],
};
const cleanedHook = normalizeHookPtBr(cachedHook);

if (
  cleanedHook.dialogueTranslations?.[0] !==
  'É verdade, mesmo que o terreno pareça estar abandonado atualmente.'
) {
  failures += 1;
  console.error(`FAIL hook: ${cleanedHook.dialogueTranslations?.[0]}`);
}
if (Object.keys(cleanedHook).length !== Object.keys(cachedHook).length) {
  failures += 1;
  console.error(`FAIL hook gained keys: ${Object.keys(cleanedHook).join(', ')}`);
}

console.log(failures === 0 ? `OK — ${cases.length + 2} casos passaram` : `${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
