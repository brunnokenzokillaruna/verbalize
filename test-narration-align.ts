/**
 * Smoke tests for narrated-range remapping (lesson karaoke alignment).
 * Run: npx tsx test-narration-align.ts
 */
import {
  alignNarratedRangeToText,
  buildEstimatedNarrationTimeline,
  findEstimatedNarratedRange,
} from './lib/dialogueNarration';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const display = "Je vais emporter ce gâteau.";
const drifted = {
  lineIndex: 0,
  start: 0,
  end: 8,
  text: 'emporter',
};

const remapped = alignNarratedRangeToText(display, drifted);
assert(remapped !== null, 'returns a range');
assert(remapped!.text.toLowerCase() === 'emporter', 'finds emporter in display text');
assert(display.slice(remapped!.start, remapped!.end).toLowerCase() === 'emporter', 'offsets match display');

const timeline = buildEstimatedNarrationTimeline([display], 2);
const mid = findEstimatedNarratedRange(timeline, 1.0);
assert(mid !== null, 'estimated timeline yields a word at t=1s');

const alignedMid = alignNarratedRangeToText(display, mid);
assert(
  alignedMid !== null && display.slice(alignedMid.start, alignedMid.end) === alignedMid.text,
  'estimated range aligns to display',
);

console.log('\nAll narration align tests passed.');
