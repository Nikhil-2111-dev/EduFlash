import assert from 'node:assert';
import { parseCards } from './server.js';

console.log('Testing parseCards()...');

// 1. Standard markdown code fences
const sample1 = '```json\n[{"front":"Q1","back":"A1","tag":"TCP","difficulty":"easy"},{"front":"Q2","back":"A2","tag":"TCP","difficulty":"medium"},{"front":"Q3","back":"A3","tag":"Process","difficulty":"hard"}]\n```';
const r1 = parseCards(sample1);
assert.strictEqual(r1.length, 3);
assert.strictEqual(r1[0].front, 'Q1');
assert.strictEqual(r1[0].difficulty, 'easy');
console.log('✓ Markdown fence stripping passed');

// 2. Chat prefix / suffix text
const sample2 = 'Here are your cards:\n[{"front":"Question 1","back":"Answer 1"},{"front":"Question 2","back":"Answer 2"},{"front":"Question 3","back":"Answer 3"}]\nHave fun studying!';
const r2 = parseCards(sample2);
assert.strictEqual(r2.length, 3);
assert.strictEqual(r2[0].tag, 'General');
assert.strictEqual(r2[0].difficulty, 'medium');
console.log('✓ Substring extraction and defaults passed');

// 3. Deduplication and string truncation
const longFront = 'F'.repeat(200);
const longBack = 'B'.repeat(400);
const sample3 = JSON.stringify([
  { front: longFront, back: longBack },
  { front: longFront.slice(0, 140).toLowerCase(), back: 'Duplicate front' },
  { front: 'Question B', back: 'Answer B' },
  { front: 'Question C', back: 'Answer C' },
]);
const r3 = parseCards(sample3);
assert.strictEqual(r3.length, 3, 'Should deduplicate case-insensitively');
assert.strictEqual(r3[0].front.length, 140);
assert.strictEqual(r3[0].back.length, 280);
console.log('✓ Truncation and deduplication passed');

// 4. Rejecting < 3 valid cards
try {
  parseCards('[{"front":"Q1","back":"A1"}]');
  assert.fail('Should have thrown BAD_MODEL_OUTPUT for < 3 cards');
} catch (e) {
  assert.strictEqual(e.message, 'BAD_MODEL_OUTPUT');
  console.log('✓ Rejection of < 3 cards passed');
}

// 5. Rejecting invalid structure
try {
  parseCards('{"error":"cannot read diagram"}');
  assert.fail('Should have thrown BAD_MODEL_OUTPUT for non-array');
} catch (e) {
  assert.strictEqual(e.message, 'BAD_MODEL_OUTPUT');
  console.log('✓ Rejection of non-array passed');
}

console.log('All parseCards unit tests passed successfully!');
