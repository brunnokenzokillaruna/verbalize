import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DUP_RE = /("arcCharacters":[^\n]+\n    "arcSummary":[^\n]+),\n    \1/g;

for (const file of ['lib/curriculum/english.ts', 'lib/curriculum/french.ts']) {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content;
  content = content.replace(DUP_RE, '$1');
  fs.writeFileSync(filePath, content);
  console.log(`${file}: removed ${before.length - content.length} duplicate bytes`);
}
