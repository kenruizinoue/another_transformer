#!/usr/bin/env node
// Word error rate of a transcript against a reference transcript.
//
//   node bench/wer.mjs <reference.txt> <hypothesis.txt>
//   node bench/wer.mjs --self-test
//
// Both texts are lowercased and stripped of punctuation, then compared with
// the standard edit distance over tokens. Tokens are words split on spaces;
// when the reference has no spaces (Japanese), tokens are characters and the
// result is a character error rate.
import { readFileSync } from 'node:fs';

const PUNCTUATION = /[\p{P}\p{S}]+/gu;

export function tokens(text) {
  const clean = text.toLowerCase().replace(PUNCTUATION, ' ').trim();
  if (!clean) return [];
  const hasSpaces = /\s/.test(clean);
  return hasSpaces ? clean.split(/\s+/) : Array.from(clean);
}

// Levenshtein distance over token arrays, counting each kind of edit.
export function editOps(ref, hyp) {
  const rows = ref.length + 1;
  const cols = hyp.length + 1;
  const cost = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) cost[i][0] = i;
  for (let j = 0; j < cols; j++) cost[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const same = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      cost[i][j] = Math.min(cost[i - 1][j - 1] + same, cost[i - 1][j] + 1, cost[i][j - 1] + 1);
    }
  }
  // Walk back to attribute the edits.
  let i = ref.length;
  let j = hyp.length;
  const ops = { substitutions: 0, deletions: 0, insertions: 0 };
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) {
      if (ref[i - 1] !== hyp[j - 1]) ops.substitutions++;
      i--;
      j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
      ops.deletions++;
      i--;
    } else {
      ops.insertions++;
      j--;
    }
  }
  return ops;
}

export function wordErrorRate(referenceText, hypothesisText) {
  const ref = tokens(referenceText);
  const hyp = tokens(hypothesisText);
  const ops = editOps(ref, hyp);
  const errors = ops.substitutions + ops.deletions + ops.insertions;
  const unit = /\s/.test(referenceText.trim()) ? 'word' : 'character';
  return { ...ops, errors, total: ref.length, rate: ref.length ? errors / ref.length : 0, unit };
}

function selfTest() {
  const cases = [
    ['the cat sat on the mat', 'the cat sat on the mat', 0],
    ['the cat sat on the mat', 'the cat sat on a mat', 1 / 6],
    ['the cat sat on the mat', 'the cat on the mat', 1 / 6],
    ['the cat sat on the mat', 'the big cat sat on the mat', 1 / 6],
    ['Hola, ¿cómo estás?', 'hola como estas', 2 / 3],
    ['今日は晴れです', '今日は雨です', 2 / 7],
  ];
  let failed = 0;
  for (const [ref, hyp, expected] of cases) {
    const { rate } = wordErrorRate(ref, hyp);
    const ok = Math.abs(rate - expected) < 1e-9;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(ref)} vs ${JSON.stringify(hyp)}: ${rate.toFixed(3)} (expected ${expected.toFixed(3)})`);
  }
  process.exit(failed ? 1 : 0);
}

const args = process.argv.slice(2);
if (args[0] === '--self-test') {
  selfTest();
} else if (args.length === 2) {
  const result = wordErrorRate(readFileSync(args[0], 'utf8'), readFileSync(args[1], 'utf8'));
  console.log(
    `${result.unit} error rate ${(result.rate * 100).toFixed(1)}% ` +
      `(${result.errors} errors over ${result.total} ${result.unit}s: ` +
      `${result.substitutions} substituted, ${result.deletions} missing, ${result.insertions} extra)`,
  );
} else {
  console.error('usage: node bench/wer.mjs <reference.txt> <hypothesis.txt> | --self-test');
  process.exit(2);
}
