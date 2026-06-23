import fs from 'fs';

const path = 'lib/curriculum/english.ts';
let content = fs.readFileSync(path, 'utf8');

const arcSummary =
  'Você chega a Londres de avião; Emma, uma britânica, aparece ao longo do tema para te ajudar no aeroporto e na cidade.';

for (let n = 1; n <= 15; n++) {
  const id = `en-a1-${String(n).padStart(3, '0')}`;
  const blockRe = new RegExp(`"id": "${id}"[\\s\\S]*?"theme": "[^"]+"`, 'm');
  const match = content.match(blockRe);
  if (!match || match[0].includes('arcCharacters')) continue;
  const block = match[0].replace(
    /"theme": "[^"]+"/,
    `"theme": "${match[0].match(/"theme": "([^"]+)"/)?.[1] ?? ''}",\n    "arcCharacters": { "learner": "Jake", "local": "Emma" },\n    "arcSummary": "${arcSummary}"`,
  );
  content = content.replace(match[0], block);
  console.log('arc added', id);
}

fs.writeFileSync(path, content);
