/**
 * Applies Fluência Comunicativa curriculum parity:
 * - REVIEW checkpoints every 10 lessons (…010, …020, …) across ALL CEFR levels
 * - arcCharacters + arcSummary on A1 Tema 1 intro lessons (001–015)
 *
 * Usage: node scripts/patch-curriculum-parity.mjs [en|fr|both]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LANG_CONFIG = {
  en: {
    file: 'lib/curriculum/english.ts',
    langCode: 'en',
    arcIdPrefix: 'en-a1',
    arc: {
      learner: 'Jake',
      local: 'Emma',
      summary:
        'Você chega a Londres de avião; Emma, uma britânica, aparece ao longo do tema para te ajudar no aeroporto e na cidade.',
    },
  },
  fr: {
    file: 'lib/curriculum/french.ts',
    langCode: 'fr',
    arcIdPrefix: 'fr-a1',
    arc: {
      learner: 'Lucas',
      local: 'Camille',
      summary:
        'Você chega a Paris de avião; Camille, uma parisiense, aparece ao longo do tema para te ajudar no aeroporto e na cidade.',
    },
  },
};

function getLessonBlock(content, id) {
  const idMarker = `"id": "${id}"`;
  const idPos = content.indexOf(idMarker);
  if (idPos < 0) return null;
  const start = content.lastIndexOf('\n  {', idPos);
  if (start < 0) return null;
  const next = content.indexOf('\n  {', idPos + idMarker.length);
  const end = next < 0 ? content.indexOf('\n];', idPos) : next;
  return { start, end, text: content.slice(start, end) };
}

function discoverCheckpointIds(content, langCode) {
  const re = new RegExp(`"id": "${langCode}-(a1|a2|b1|b2|c1|c2)-(\\d{3})"`, 'g');
  const ids = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    const num = Number.parseInt(match[2], 10);
    if (num % 10 === 0) {
      ids.push(`${langCode}-${match[1]}-${match[2]}`);
    }
  }
  return ids;
}

function patchReviewLessons(content, langCode) {
  for (const id of discoverCheckpointIds(content, langCode)) {
    const num = Number.parseInt(id.split('-')[2], 10);
    const start = Math.max(1, num - 9);
    const block = getLessonBlock(content, id);
    if (!block) {
      console.warn(`  [REVIEW] NOT FOUND ${id}`);
      continue;
    }
    if (block.text.includes('"tag": "REVIEW"')) {
      console.log(`  [REVIEW] already patched ${id}`);
      continue;
    }
    let updated = block.text.replace(/"tag": "[A-Z]+"/, '"tag": "REVIEW"');
    updated = updated.replace(
      /"grammarFocus": "[^"]+"/,
      `"grammarFocus": "Revisão: lições ${start}–${num}"`,
    );
    updated = updated.replace(
      /"uiTitle": "[^"]+"/,
      `"uiTitle": "Checkpoint — lições ${start}–${num}"`,
    );
    content = content.slice(0, block.start) + updated + content.slice(block.end);
    console.log(`  [REVIEW] patched ${id}`);
  }
  return content;
}

function patchArcTema1(content, idPrefix, arc) {
  const arcJson = `"arcCharacters": { "learner": "${arc.learner}", "local": "${arc.local}" },\n    "arcSummary": "${arc.summary}"`;

  for (let n = 1; n <= 15; n++) {
    const id = `${idPrefix}-${String(n).padStart(3, '0')}`;
    const block = getLessonBlock(content, id);
    if (!block) {
      console.warn(`  [ARC] NOT FOUND ${id}`);
      continue;
    }
    if (block.text.includes('arcCharacters')) {
      console.log(`  [ARC] already has arc ${id}`);
      continue;
    }
    const themeMatch = block.text.match(/"theme": "([^"]+)"/);
    const theme = themeMatch?.[1] ?? '';
    const updated = block.text.replace(
      /"theme": "[^"]+"/,
      `"theme": "${theme}",\n    ${arcJson}`,
    );
    content = content.slice(0, block.start) + updated + content.slice(block.end);
    console.log(`  [ARC] patched ${id}`);
  }

  return content;
}

function patchMarkdown(mdPath) {
  if (!fs.existsSync(mdPath)) return;
  let content = fs.readFileSync(mdPath, 'utf8');
  let count = 0;
  content = content.replace(/^(\d+)\. \[(?!REVIEW)([A-Z]+)\][^\n]*/gm, (line, numStr) => {
    const n = Number.parseInt(numStr, 10);
    if (n % 10 !== 0) return line;
    const start = Math.max(1, n - 9);
    count += 1;
    return `${n}. [REVIEW] Checkpoint — lições ${start}–${n} | Contexto IA: Revisão: lições ${start}–${n}`;
  });
  fs.writeFileSync(mdPath, content);
  console.log(`  [MD] patched ${count} checkpoint lines in ${path.basename(mdPath)}`);
}

function patchLanguage(lang) {
  const cfg = LANG_CONFIG[lang];
  const filePath = path.join(ROOT, cfg.file);
  console.log(`\n=== Patching ${lang.toUpperCase()} (${cfg.file}) ===`);

  let content = fs.readFileSync(filePath, 'utf8');
  content = patchReviewLessons(content, cfg.langCode);
  content = patchArcTema1(content, cfg.arcIdPrefix, cfg.arc);
  fs.writeFileSync(filePath, content);
  patchMarkdown(path.join(ROOT, lang === 'fr' ? 'curriculum_french.md' : 'curriculum_english.md'));
  console.log(`  Done.`);
}

const target = process.argv[2] ?? 'both';
if (target === 'both') {
  patchLanguage('en');
  patchLanguage('fr');
} else if (LANG_CONFIG[target]) {
  patchLanguage(target);
} else {
  console.error('Usage: node scripts/patch-curriculum-parity.mjs [en|fr|both]');
  process.exit(1);
}
