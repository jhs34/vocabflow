import { test } from 'node:test';
import assert from 'node:assert';
import { checkAnswer, parseAnswerList, processWordData } from '../src/utils/vocabLogic.js';

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

// Tests for processWordData
test('processWordData: should map word data and add answer_list', () => {
    const input = [
        { word: 'apple', raw_meaning: '사과, (열매)' },
        { word: 'banana', raw_meaning: '바나나' }
    ];
    const expected = [
        { word: 'apple', raw_meaning: '사과, (열매)', answer_list: ['사과'] },
        { word: 'banana', raw_meaning: '바나나', answer_list: ['바나나'] }
    ];
    assert.deepStrictEqual(processWordData(input), expected);
});

test('processWordData: should preserve existing properties', () => {
    const input = [
        { word: 'apple', raw_meaning: '사과', id: 1, custom: 'data' }
    ];
    const result = processWordData(input);
    assert.strictEqual(result[0].id, 1);
    assert.strictEqual(result[0].custom, 'data');
    assert.deepStrictEqual(result[0].answer_list, ['사과']);
});

test('processWordData: should handle empty array', () => {
    assert.deepStrictEqual(processWordData([]), []);
});

test('processWordData: should handle non-array input', () => {
    assert.deepStrictEqual(processWordData(null), []);
    assert.deepStrictEqual(processWordData(undefined), []);
    assert.deepStrictEqual(processWordData({}), []);
});
