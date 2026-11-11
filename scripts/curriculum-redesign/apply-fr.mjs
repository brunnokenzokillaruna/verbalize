/**
 * Apply FR curriculum redesign: 1 unique theme / 6 lessons + tag remix.
 * Preserves lesson IDs, level, language, topicKey, lessonRole, and most grammarFocus.
 *
 * Usage: node scripts/curriculum-redesign/apply-fr.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { FR_THEMES } from './fr-themes.mjs';

const CURRICULUM_PATH = new URL('../../lib/curriculum/french.ts', import.meta.url);

/** Fixed patterns — chosen so global tag mix stays close to the pre-redesign inventory. */
const R = {
  a: ['VOC', 'GRAM', 'DIAL', 'VERB', 'MISS', 'REVIEW'],
  b: ['DIAL', 'GRAM', 'VOC', 'GRAM', 'MISS', 'REVIEW'],
  c: ['VOC', 'DIAL', 'GRAM', 'MISS', 'PRON', 'REVIEW'],
  d: ['DIAL', 'VOC', 'VERB', 'MISS', 'GRAM', 'REVIEW'],
  e: ['VOC', 'GRAM', 'DIAL', 'GRAM', 'CULT', 'REVIEW'],
  f: ['DIAL', 'VOC', 'MISS', 'VERB', 'PRON', 'REVIEW'],
};

const P = {
  a: ['VOC', 'GRAM', 'DIAL', 'VERB', 'MISS', 'EXPR'],
  b: ['DIAL', 'GRAM', 'VOC', 'GRAM', 'MISS', 'CULT'],
  c: ['VOC', 'DIAL', 'GRAM', 'MISS', 'PRON', 'EXPR'],
  d: ['DIAL', 'VOC', 'GRAM', 'MISS', 'VERB', 'CULT'],
  e: ['VOC', 'GRAM', 'DIAL', 'MISS', 'VERB', 'EXPR'],
  f: ['CULT', 'VOC', 'GRAM', 'DIAL', 'GRAM', 'EXPR'],
  g: ['DIAL', 'VERB', 'VOC', 'GRAM', 'MISS', 'PRON'],
  h: ['VOC', 'GRAM', 'MISS', 'VERB', 'DIAL', 'EXPR'],
};

/**
 * 75 explicit block patterns (odd indices = REVIEW).
 * Tuned for ≈ GRAM 120+, VERB ~50, VOC/DIAL/MISS balanced, PRON ~14, CULT ~18, EXPR ~24, REVIEW 37.
 */
const BLOCK_PATTERNS = [
  P.a, R.a, P.b, R.b, P.c, R.c, P.d, R.d, P.e, R.e,
  P.f, R.f, P.g, R.a, P.h, R.b, P.a, R.c, P.b, R.d,
  P.c, R.e, P.d, R.f, P.e, R.a, P.f, R.b, P.g, R.c,
  P.h, R.d, P.a, R.e, P.b, R.f, P.c, R.a, P.d, R.b,
  P.e, R.c, P.f, R.d, P.g, R.e, P.h, R.f, P.a, R.a,
  P.b, R.b, P.c, R.c, P.d, R.d, P.e, R.e, P.f, R.f,
  P.g, R.a, P.h, R.b, P.a, R.c, P.b, R.d, P.c, R.e,
  P.d, R.f, P.e, R.a, P.f,
];

/** Max GRAM+VERB per block — enough to near-restore legacy form density. */
const MAX_FORM_PER_BLOCK = 4;
/** Max consecutive form tags (GRAM/VERB). Allows GRAM→VERB, forbids GRAM→VERB→GRAM. */
const MAX_CONSECUTIVE_FORM = 2;

function assertTemplateValid(tags) {
  for (let i = 0; i < tags.length; i++) {
    if (i > 0 && tags[i] === tags[i - 1]) {
      throw new Error(`Consecutive duplicate ${tags[i]} in ${tags.join('→')}`);
    }
  }
  let formRun = 0;
  for (const t of tags) {
    if (isFormTag(t)) {
      formRun += 1;
      if (formRun > MAX_CONSECUTIVE_FORM) {
        throw new Error(`Form run >${MAX_CONSECUTIVE_FORM} in ${tags.join('→')}`);
      }
    } else {
      formRun = 0;
    }
  }
  const form = tags.filter(isFormTag).length;
  if (form > MAX_FORM_PER_BLOCK) {
    throw new Error(`Too many form tags (${form}) in ${tags.join('→')}`);
  }
}

function isFormTag(tag) {
  return tag === 'GRAM' || tag === 'VERB';
}

if (BLOCK_PATTERNS.length !== 75) {
  throw new Error(`Expected 75 block patterns, got ${BLOCK_PATTERNS.length}`);
}
for (const t of BLOCK_PATTERNS) assertTemplateValid(t);

function parseLessons(src) {
  const blockRe =
    /\{\s*"id":\s*"([^"]+)",\s*"language":\s*"([^"]+)",\s*"level":\s*"([^"]+)",\s*"tag":\s*"([^"]+)",\s*"uiTitle":\s*"([^"]*)",\s*"grammarFocus":\s*"([^"]*)",\s*"theme":\s*"([^"]*)"([\s\S]*?)\}/g;
  const lessons = [];
  let m;
  while ((m = blockRe.exec(src))) {
    const rest = m[8];
    const topicKey = /"topicKey":\s*"([^"]+)"/.exec(rest)?.[1];
    const lessonRole = /"lessonRole":\s*"([^"]+)"/.exec(rest)?.[1];
    const learner = /"learner":\s*"([^"]+)"/.exec(rest)?.[1];
    const local = /"local":\s*"([^"]+)"/.exec(rest)?.[1];
    const arcSummary = /"arcSummary":\s*"([^"]*)"/.exec(rest)?.[1];
    lessons.push({
      id: m[1],
      language: m[2],
      level: m[3],
      tag: m[4],
      uiTitle: m[5],
      grammarFocus: m[6],
      theme: m[7],
      topicKey,
      lessonRole,
      arcCharacters: learner || local ? { learner, local } : undefined,
      arcSummary,
    });
  }
  return lessons;
}

/** Preferred pedagogical tag from original tag + grammarFocus (fluency-critical). */
function preferredTag(lesson) {
  const text = `${lesson.uiTitle} ${lesson.grammarFocus}`.toLowerCase();
  if (lesson.tag === 'REVIEW' || /checkpoint|revis[aã]o/.test(text)) return 'REVIEW';
  // Keep dedicated form modes whenever the legacy catalog marked them.
  if (lesson.tag === 'VERB') return 'VERB';
  if (lesson.tag === 'GRAM') return 'GRAM';
  if (lesson.tag === 'PRON') return 'PRON';

  if (
    /conjugação:|conjugação|grupo -ir|grupo -re|partic[ií]pio|imparfait|conditionnel|futur proche|venir de|aller \+|pouvoir no|vouloir|devoir|habiter|manger|travailler|penser|finir|choisir|vendre|attendre|r[eé]pondre|être \(ser|avoir \(ter|faire \(fazer|conjugação: être|conjugação: avoir|conjugação: aller|conjugação: faire/.test(
      text,
    )
  ) {
    return 'VERB';
  }
  if (
    /pronom|artigo|g[eê]nero|nega[cç]|relatif|subjonctif|sujeito|possessiv|comparat|partitif|imperativ|preposi|demonstrativ|\bcod\b|\bcoi\b|adjetivos|il y a|bang|concord|place(?:ment)?|adverb|si \+|bien que|quoique/.test(
      text,
    )
  ) {
    return 'GRAM';
  }
  if (/pron[uú]ncia|sons?\b|nasal|vogais|liaison|entona|schwa|mudo|fon[eé]t/.test(text)) return 'PRON';
  if (lesson.tag === 'MISS' || lesson.tag === 'DIAL' || lesson.tag === 'VOC' || lesson.tag === 'EXPR' || lesson.tag === 'CULT') {
    return lesson.tag;
  }
  return 'DIAL';
}

function lessonFormPriority(lesson) {
  const p = preferredTag(lesson);
  if (p === 'VERB' || lesson.tag === 'VERB') return 2;
  if (p === 'GRAM' || lesson.tag === 'GRAM') return 1;
  return 0;
}

const LEVEL_RANK = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

/**
 * Keep catalog adjacency intact (aller → futur proche, etc.).
 * Only sort by CEFR when a frontier block mixes levels.
 */
function reorderBlockLessons(blockLessons, _reviewLocked) {
  const items = blockLessons.map((l, orig) => ({
    l,
    orig,
    rank: LEVEL_RANK[l.level] ?? 99,
  }));
  const multiLevel = new Set(items.map((x) => x.l.level)).size > 1;
  if (!multiLevel) return blockLessons;
  items.sort((a, b) => a.rank - b.rank || a.orig - b.orig);
  return items.map((x) => x.l);
}

function canPlaceBreathing(tags, index, tag) {
  if (tags[index] === 'REVIEW') return false;
  if (index > 0 && tags[index - 1] === tag) return false;
  if (index + 1 < tags.length && tags[index + 1] === tag) return false;
  return true;
}

function demoteToBreathing(tags, index) {
  if (tags[index] === 'REVIEW') return;
  const options = ['DIAL', 'MISS', 'VOC', 'EXPR', 'CULT'];
  for (const opt of options) {
    if (canPlaceBreathing(tags, index, opt)) {
      tags[index] = opt;
      return;
    }
  }
  tags[index] = 'DIAL';
}

function formRunAt(tags, index) {
  // length of form run if tags[index] stays form, looking at neighbors
  let left = 0;
  for (let i = index - 1; i >= 0 && isFormTag(tags[i]); i--) left += 1;
  let right = 0;
  for (let i = index + 1; i < tags.length && isFormTag(tags[i]); i++) right += 1;
  return left + 1 + right;
}

/** Higher = keep as form. Conjugations win; "Par de Confusão" demotes first. */
function formKeepScore(lesson, tag) {
  const t = `${lesson.uiTitle} ${lesson.grammarFocus}`.toLowerCase();
  if (/conjugação:/.test(t)) return 100;
  if (/pronom|cod:|coi:|subjonctif|nega[cç]|ne\.\.\.|imperativ|partitif|relatif/.test(t)) return 85;
  if (tag === 'VERB') return 75;
  if (/possessiv|g[eê]nero|artigo|sujeito|comparat|preposi|demonstrativ|il y a|adjetivos|bang/.test(t)) return 65;
  if (/par de confus/.test(t)) return 15;
  if (tag === 'GRAM') return 50;
  return 40;
}

/**
 * Minimal intervention on legacy tags after reorder:
 * keep GRAM/VERB, demote only to break identical pairs, form runs >2, or >MAX_FORM.
 * REVIEW stays on the legacy checkpoint lesson (not forced to slot 6) so pairs like
 * aller → futur proche are not split by a moved checkpoint.
 */
function assignTagsToBlock(pattern, blockLessons) {
  const reviewLocked = pattern[5] === 'REVIEW';
  const tags = blockLessons.map((l) => {
    const p = preferredTag(l);
    if (p === 'REVIEW') return 'REVIEW';
    return p;
  });

  if (reviewLocked) {
    let reviewIdx = tags.findIndex((t) => t === 'REVIEW');
    if (reviewIdx < 0) {
      // Pick lowest-value non-form lesson as checkpoint host.
      let best = -1;
      let bestScore = Infinity;
      for (let i = 0; i < 6; i++) {
        if (isFormTag(tags[i]) || tags[i] === 'PRON') continue;
        const score = formKeepScore(blockLessons[i], tags[i]);
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      reviewIdx = best >= 0 ? best : 5;
    }
    for (let i = 0; i < 6; i++) {
      if (i === reviewIdx) tags[i] = 'REVIEW';
      else if (tags[i] === 'REVIEW') {
        // Extra REVIEW in odd historical placement — demote.
        tags[i] = blockLessons[i].tag === 'REVIEW' ? 'DIAL' : preferredTag(blockLessons[i]);
        if (tags[i] === 'REVIEW') tags[i] = 'DIAL';
      }
    }
  } else {
    // Odd blocks must not keep a stray REVIEW tag.
    for (let i = 0; i < 6; i++) {
      if (tags[i] === 'REVIEW') {
        tags[i] = 'DIAL';
      }
    }
  }

  const pickDemotionVictim = (indices) => {
    const ranked = indices
      .filter((i) => tags[i] !== 'REVIEW')
      .sort((a, b) => formKeepScore(blockLessons[a], tags[a]) - formKeepScore(blockLessons[b], tags[b]) || b - a);
    return ranked[0];
  };

  // Break identical consecutive tags (prefer demoting the lower-value form side).
  for (let i = 1; i < 6; i++) {
    if (tags[i] === 'REVIEW' || tags[i - 1] === 'REVIEW') continue;
    if (tags[i] !== tags[i - 1]) continue;
    const victim = pickDemotionVictim([i - 1, i]);
    if (victim != null) demoteToBreathing(tags, victim);
  }

  // Break form runs longer than MAX_CONSECUTIVE_FORM.
  for (let pass = 0; pass < 4; pass++) {
    let fixed = false;
    let runStart = -1;
    for (let i = 0; i <= 6; i++) {
      const isF = i < 6 && isFormTag(tags[i]);
      if (isF) {
        if (runStart < 0) runStart = i;
      } else if (runStart >= 0) {
        if (i - runStart > MAX_CONSECUTIVE_FORM) {
          const runIdx = [];
          for (let j = runStart; j < i; j++) runIdx.push(j);
          while (runIdx.filter((j) => isFormTag(tags[j])).length > MAX_CONSECUTIVE_FORM) {
            const victim = pickDemotionVictim(runIdx.filter((j) => isFormTag(tags[j])));
            if (victim == null) break;
            demoteToBreathing(tags, victim);
            fixed = true;
          }
        }
        runStart = -1;
      }
    }
    if (!fixed) break;
  }

  // Cap total form — sacrifice lowest keep-score first.
  let formIdx = tags.map((t, i) => (isFormTag(t) ? i : -1)).filter((i) => i >= 0);
  while (formIdx.length > MAX_FORM_PER_BLOCK) {
    const victim = pickDemotionVictim(formIdx);
    if (victim == null) break;
    demoteToBreathing(tags, victim);
    formIdx = tags.map((t, i) => (isFormTag(t) ? i : -1)).filter((i) => i >= 0);
  }

  // Ensure production (REVIEW alone does not count).
  if (!tags.some((t) => t === 'DIAL' || t === 'MISS')) {
    for (let i = 0; i < 6; i++) {
      if (tags[i] === 'REVIEW' || isFormTag(tags[i]) || tags[i] === 'PRON') continue;
      tags[i] = 'MISS';
      break;
    }
  }

  // Final identical-tag sweep.
  for (let i = 1; i < 6; i++) {
    if (tags[i] === 'REVIEW' || tags[i - 1] === 'REVIEW') continue;
    if (tags[i] === tags[i - 1]) demoteToBreathing(tags, i);
  }

  assertTemplateValid(tags);
  return tags;
}

function validateGlobal(lessons) {
  const errors = [];
  const themes = new Set();
  for (let b = 0; b < 75; b++) {
    const slice = lessons.slice(b * 6, b * 6 + 6);
    const theme = slice[0].theme;
    if (themes.has(theme)) errors.push(`Duplicate theme: ${theme}`);
    themes.add(theme);
    if (!slice.every((l) => l.theme === theme)) errors.push(`Theme split in block ${b + 1}`);
    const tags = slice.map((l) => l.tag);
    try {
      assertTemplateValid(tags);
    } catch (e) {
      errors.push(`Block ${b + 1}: ${e.message}`);
    }
    const needsReview = b % 2 === 1;
    const reviewCount = tags.filter((t) => t === 'REVIEW').length;
    if (needsReview && reviewCount !== 1) {
      errors.push(`Block ${b + 1} expected exactly 1 REVIEW, got ${reviewCount}`);
    }
    if (!needsReview && reviewCount !== 0) {
      errors.push(`Block ${b + 1} unexpected REVIEW`);
    }
    const production = tags.some((t) => t === 'DIAL' || t === 'MISS');
    if (!production) errors.push(`Block ${b + 1} has no DIAL/MISS`);
  }
  if (themes.size !== 75) errors.push(`Expected 75 themes, got ${themes.size}`);
  return errors;
}

function serializeLesson(l) {
  const lines = [
    '  {',
    `    "id": ${JSON.stringify(l.id)},`,
    `    "language": ${JSON.stringify(l.language)},`,
    `    "level": ${JSON.stringify(l.level)},`,
    `    "tag": ${JSON.stringify(l.tag)},`,
    `    "uiTitle": ${JSON.stringify(l.uiTitle)},`,
    `    "grammarFocus": ${JSON.stringify(l.grammarFocus)},`,
    `    "theme": ${JSON.stringify(l.theme)},`,
  ];
  if (l.topicKey) lines.push(`    "topicKey": ${JSON.stringify(l.topicKey)},`);
  if (l.lessonRole) lines.push(`    "lessonRole": ${JSON.stringify(l.lessonRole)},`);
  if (l.arcCharacters?.learner || l.arcCharacters?.local) {
    lines.push('    "arcCharacters": {');
    if (l.arcCharacters.learner) {
      lines.push(`      "learner": ${JSON.stringify(l.arcCharacters.learner)}${l.arcCharacters.local ? ',' : ''}`);
    }
    if (l.arcCharacters.local) {
      lines.push(`      "local": ${JSON.stringify(l.arcCharacters.local)}`);
    }
    lines.push('    },');
  }
  if (l.arcSummary) {
    lines.push(`    "arcSummary": ${JSON.stringify(l.arcSummary)}`);
  } else {
    // remove trailing comma from previous field if arcSummary absent
    const last = lines[lines.length - 1];
    if (last.endsWith(',')) lines[lines.length - 1] = last.slice(0, -1);
  }
  lines.push('  }');
  return lines.join('\n');
}

function main() {
  const src = readFileSync(CURRICULUM_PATH, 'utf8');
  const lessons = parseLessons(src);
  if (lessons.length !== 450) {
    throw new Error(`Expected 450 lessons, parsed ${lessons.length}`);
  }
  if (FR_THEMES.length !== 75) throw new Error('Need 75 themes');

  const out = [];

  for (let b = 0; b < 75; b++) {
    const themeDef = FR_THEMES[b];
    const reviewLocked = BLOCK_PATTERNS[b][5] === 'REVIEW';
    const blockLessons = reorderBlockLessons(lessons.slice(b * 6, b * 6 + 6), reviewLocked);
    const tags = assignTagsToBlock(BLOCK_PATTERNS[b], blockLessons);

    for (let s = 0; s < 6; s++) {
      const prev = blockLessons[s];
      const slot = themeDef.slots[s];
      const tag = tags[s];

      // Keep legacy uiTitle + grammarFocus (what the lesson teaches).
      // Theme/tag/arc change around that content. Only REVIEW rows are rewritten.
      let grammarFocus = prev.grammarFocus;
      let uiTitle = prev.uiTitle;

      if (tag === 'REVIEW') {
        const from = (b - 1) * 6 + 1;
        const to = (b + 1) * 6;
        uiTitle = `Checkpoint — lições ${from}–${to}`;
        grammarFocus = `Revisão: lições ${from}–${to}`;
      } else if (prev.tag === 'REVIEW') {
        uiTitle = slot.uiTitle;
        grammarFocus = slot.focus;
      }

      out.push({
        ...prev,
        tag,
        uiTitle,
        grammarFocus,
        theme: themeDef.theme,
        arcCharacters: themeDef.chars,
        arcSummary: themeDef.arc,
      });
    }
  }

  const errors = validateGlobal(out);
  const counts = out.reduce((a, l) => {
    a[l.tag] = (a[l.tag] || 0) + 1;
    return a;
  }, {});

  const body = out.map(serializeLesson).join(',\n');
  const file = `import type { LessonDefinition } from "@/types";\n\nexport const FRENCH_LESSONS: LessonDefinition[] = [\n${body}\n];\n`;
  writeFileSync(CURRICULUM_PATH, file);

  const report = {
    lessons: out.length,
    themes: new Set(out.map((l) => l.theme)).size,
    tagCounts: counts,
    errors,
    sample: out.slice(0, 12).map((l) => `${l.id} [${l.tag}] ${l.theme} · ${l.uiTitle}`),
  };
  writeFileSync(
    new URL('./fr-apply-report.json', import.meta.url),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) {
    console.error(`\n${errors.length} validation errors`);
    process.exitCode = 1;
  }
}

main();
