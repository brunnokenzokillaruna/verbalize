import fs from 'fs';

const path = 'lib/curriculum/english.ts';
let content = fs.readFileSync(path, 'utf8');

for (const n of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]) {
  const id = `en-a1-${String(n).padStart(3, '0')}`;
  const start = Math.max(1, n - 9);
  const blockRe = new RegExp(`"id": "${id}"[\\s\\S]*?"theme": "[^"]+"`, 'm');
  const match = content.match(blockRe);
  if (!match) {
    console.warn('NOT FOUND', id);
    continue;
  }
  let block = match[0];
  block = block.replace(/"tag": "[A-Z]+"/, '"tag": "REVIEW"');
  block = block.replace(/"grammarFocus": "[^"]+"/, `"grammarFocus": "Revisão: lições ${start}–${n}"`);
  block = block.replace(/"uiTitle": "[^"]+"/, `"uiTitle": "Checkpoint — lições ${start}–${n}"`);
  content = content.replace(match[0], block);
  console.log('patched', id);
}

fs.writeFileSync(path, content);
