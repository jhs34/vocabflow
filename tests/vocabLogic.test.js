import { test } from 'node:test';
import assert from 'node:assert';
import { checkAnswer, parseAnswerList, safeParseJSON, processWordData, shuffleArray, getBaseUrl, getStoredBookmarks } from '../src/utils/vocabLogic.js';
import { getStaggerDelay, cardSlideVariants } from '../src/utils/motion.js';

console.log('Running tests for vocabLogic...');

// Tests for parseAnswerList
test('parseAnswerList: should split by comma and trim', () => {
    assert.deepStrictEqual(parseAnswerList('apple, banana '), ['apple', 'banana']);
});

test('parseAnswerList: should remove parentheses and content', () => {
    assert.deepStrictEqual(parseAnswerList('apple (fruit), banana [yellow]'), ['apple', 'banana']);
});

test('parseAnswerList: should remove special characters', () => {
    assert.deepStrictEqual(parseAnswerList('apple., banana~, cherry·'), ['apple', 'banana', 'cherry']);
});

test('parseAnswerList: should handle empty input', () => {
    assert.deepStrictEqual(parseAnswerList(''), []);
    assert.deepStrictEqual(parseAnswerList(null), []);
    assert.deepStrictEqual(parseAnswerList(undefined), []);
});

// Tests for checkAnswer
test('checkAnswer: should return true for exact match', () => {
  assert.strictEqual(checkAnswer('apple', ['apple']), true);
});

test('checkAnswer: should return true for match with extra whitespace', () => {
  assert.strictEqual(checkAnswer('  apple  ', ['apple']), true);
});

test('checkAnswer: should return true for match with internal whitespace removed', () => {
    assert.strictEqual(checkAnswer('set up', ['setup']), true);
    assert.strictEqual(checkAnswer('setup', ['set up']), true);
});

test('checkAnswer: should return true for match with different casing (CASE INSENSITIVE)', () => {
    assert.strictEqual(checkAnswer('Apple', ['apple']), true);
    assert.strictEqual(checkAnswer('apple', ['Apple']), true);
});

test('checkAnswer: should handle parentheses in user input', () => {
    assert.strictEqual(checkAnswer('red (color)', ['red']), true);
});

test('checkAnswer: should handle special characters in user input', () => {
    assert.strictEqual(checkAnswer('hello.', ['hello']), true);
    assert.strictEqual(checkAnswer('hello~', ['hello']), true);
    assert.strictEqual(checkAnswer('hello·', ['hello']), true);
});

test('checkAnswer: should handle empty input', () => {
    assert.strictEqual(checkAnswer('', ['apple']), false);
    assert.strictEqual(checkAnswer(null, ['apple']), false);
});

test('checkAnswer: should handle empty allowedAnswers', () => {
    assert.strictEqual(checkAnswer('apple', []), false);
});

// Tests for safeParseJSON
test('safeParseJSON: should parse valid JSON', () => {
    assert.deepStrictEqual(safeParseJSON('["apple", "banana"]'), ['apple', 'banana']);
    assert.deepStrictEqual(safeParseJSON('{"a": 1}', {}), { a: 1 });
});

test('safeParseJSON: should return default value for invalid JSON', () => {
    assert.deepStrictEqual(safeParseJSON('invalid json', []), []);
    assert.deepStrictEqual(safeParseJSON('{unquoted: key}', {}), {});
});

test('safeParseJSON: should return default value for null/undefined/empty input', () => {
    assert.deepStrictEqual(safeParseJSON(null, ['default']), ['default']);
    assert.deepStrictEqual(safeParseJSON(undefined, []), []);
    assert.deepStrictEqual(safeParseJSON('', []), []);
});

test('safeParseJSON: should ensure array if default is array', () => {
    assert.deepStrictEqual(safeParseJSON('{"not": "an array"}', []), []);
});

test('safeParseJSON: should handle non-array default values', () => {
    assert.strictEqual(safeParseJSON('123', 0), 123);
    assert.strictEqual(safeParseJSON('invalid', 0), 0);
});

// Tests for processWordData, shuffleArray, getBaseUrl
test('processWordData: attaches parsed answer_list to each word item', () => {
    const raw = [{ id: '1', word: 'provide', raw_meaning: '제공하다, (물품을) 공급하다' }];
    const processed = processWordData(raw);
    assert.deepStrictEqual(processed[0].answer_list, ['제공하다', '공급하다']);
    assert.deepStrictEqual(processWordData(null), []);
});

test('shuffleArray: preserves elements without mutating original array', () => {
    const orig = [1, 2, 3, 4, 5];
    const copy = [...orig];
    const shuffled = shuffleArray(orig);
    assert.deepStrictEqual(orig, copy);
    assert.deepStrictEqual([...shuffled].sort((a, b) => a - b), copy);
});

test('getBaseUrl: returns trailing slash or relative ./ safely in Node environment', () => {
    const base = getBaseUrl();
    assert.strictEqual(base.endsWith('/'), true);
});

test('getStoredBookmarks: returns empty array safely when localStorage is unavailable', () => {
    assert.deepStrictEqual(getStoredBookmarks(), []);
});

test('getStaggerDelay: scales linearly and caps at maxDelay for large lists', () => {
    assert.strictEqual(getStaggerDelay(0), 0);
    assert.strictEqual(getStaggerDelay(-2), 0);
    assert.strictEqual(getStaggerDelay(5, 0.01, 0.14), 0.05);
    assert.strictEqual(getStaggerDelay(45), 0.22);
});

test('cardSlideVariants: computes directional enter and exit offsets accurately', () => {
    assert.deepStrictEqual(cardSlideVariants.enter(1), { opacity: 0, x: 44, y: 0, scale: 0.985, zIndex: 1 });
    assert.deepStrictEqual(cardSlideVariants.enter(-1), { opacity: 0, x: -44, y: 0, scale: 0.985, zIndex: 1 });
    assert.deepStrictEqual(cardSlideVariants.enter(0), { opacity: 0, x: 0, y: 10, scale: 0.985, zIndex: 1 });
    assert.strictEqual(cardSlideVariants.exit(1).x, -44);
    assert.strictEqual(cardSlideVariants.exit(-1).x, 44);
});

