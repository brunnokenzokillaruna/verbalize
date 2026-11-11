import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync(new URL('../../lib/curriculum/french.ts', import.meta.url), 'utf8');
const blockRe =
  /\{\s*"id":\s*"([^"]+)",\s*"language":\s*"([^"]+)",\s*"level":\s*"([^"]+)",\s*"tag":\s*"([^"]+)",\s*"uiTitle":\s*"([^"]*)",\s*"grammarFocus":\s*"([^"]*)",\s*"theme":\s*"([^"]*)"/g;

const rows = [];
let m;
let i = 0;
while ((m = blockRe.exec(src))) {
  rows.push({
    index: i,
    block: Math.floor(i / 6) + 1,
    slot: (i % 6) + 1,
    id: m[1],
    level: m[3],
    tag: m[4],
    uiTitle: m[5],
    grammarFocus: m[6],
    theme: m[7],
  });
  i++;
}

writeFileSync(
  new URL('./fr-mapping.json', import.meta.url),
  JSON.stringify(rows, null, 2),
);
console.log(`Exported ${rows.length} rows → scripts/curriculum-redesign/fr-mapping.json`);
