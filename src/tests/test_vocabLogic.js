import assert from 'assert';
import { parseAnswerList } from '../utils/vocabLogic.js';

console.log("Running tests for parseAnswerList...");

// Test helper
function test(name, input, expected) {
    try {
        const result = parseAnswerList(input);
        assert.deepStrictEqual(result, expected);
        console.log(`✅ Passed: ${name}`);
    } catch (error) {
        console.error(`❌ Failed: ${name}`);
        console.error(`   Input: ${JSON.stringify(input)}`);
        console.error(`   Expected: ${JSON.stringify(expected)}`);
        // Re-run to show received value in error log
        console.error(`   Received: ${JSON.stringify(parseAnswerList(input))}`);
        process.exit(1);
    }
}

// 1. Basic input handling
test('Empty input', '', []);
test('Null input', null, []);
test('Undefined input', undefined, []);

// 2. Comma separation
test('Basic comma separation', 'apple, banana', ['apple', 'banana']);
test('Multiple commas', 'apple, banana, cherry', ['apple', 'banana', 'cherry']);
test('Empty items between commas', 'apple,, banana', ['apple', 'banana']);

// 3. Parentheses removal
test('Remove parentheses', 'apple (fruit), banana', ['apple', 'banana']);
test('Remove brackets', 'apple [fruit], banana', ['apple', 'banana']);
test('Remove angle brackets', 'apple <fruit>, banana', ['apple', 'banana']);
test('Remove mixed brackets', 'apple (a) [b] <c>, banana', ['apple', 'banana']);

// 4. Special character removal
test('Remove special characters', 'apple~, banana·, cherry.', ['apple', 'banana', 'cherry']);

// 5. Whitespace handling
test('Trim whitespace', '  apple  ,  banana  ', ['apple', 'banana']);

// 6. Complex mixed cases
test('Mixed complex case', '(v.) recognize, admit [formal], accept <informal> .', ['recognize', 'admit', 'accept']);
test('Korean characters', '(설명·학설 등을) 인정하다', ['인정하다']);
test('Korean with multiple answers', '사과, (과일) 배', ['사과', '배']);

console.log("All tests passed!");
