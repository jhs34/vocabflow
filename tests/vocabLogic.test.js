import { test } from 'node:test';
import assert from 'node:assert';
import { checkAnswer, parseAnswerList, safeParseJSON } from '../src/utils/vocabLogic.js';

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
    // "set up" -> "setup"
    // "setup" -> "setup"
    // Note: checkAnswer removes ALL whitespace.
    assert.strictEqual(checkAnswer('set up', ['setup']), true);
    // If allowed answer is "set up", checkAnswer removes space -> "setup".
    assert.strictEqual(checkAnswer('setup', ['set up']), true);
});


test('checkAnswer: should return true for match with different casing (CASE INSENSITIVE)', () => {
    assert.strictEqual(checkAnswer('Apple', ['apple']), true);
    assert.strictEqual(checkAnswer('apple', ['Apple']), true);
});

test('checkAnswer: should handle parentheses in user input', () => {
    // "red (color)" -> "red"
    assert.strictEqual(checkAnswer('red (color)', ['red']), true);
});


test('checkAnswer: should handle special characters in user input', () => {
    // "hello." -> "hello"
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
