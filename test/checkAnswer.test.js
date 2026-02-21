
import { checkAnswer, parseAnswerList } from '../src/utils/vocabLogic.js';

console.log("Running checkAnswer tests...");

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
        passed++;
    } else {
        console.error(`❌ ${message}`);
        failed++;
    }
}

try {
    // 1. Happy Path
    assert(checkAnswer('apple', ['apple']) === true, "Exact match returns true");
    assert(checkAnswer('apple ', ['apple']) === true, "Trimmed input returns true");
    assert(checkAnswer('apple', [' apple ']) === true, "Trimmed answer returns true");
    assert(checkAnswer('apple', ['apple', 'banana']) === true, "Match in array returns true");
    assert(checkAnswer('banana', ['apple']) === false, "Mismatch returns false");

    // 2. Normalization Logic Tests
    // (foo) -> removed
    assert(checkAnswer('apple (fruit)', ['apple']) === true, "Input with parentheses normalized");
    // [foo] -> removed
    assert(checkAnswer('apple [fruit]', ['apple']) === true, "Input with brackets normalized");
    // <foo> -> removed
    assert(checkAnswer('apple <fruit>', ['apple']) === true, "Input with angle brackets normalized");
    // ~ · . -> removed
    assert(checkAnswer('apple.', ['apple']) === true, "Input with dot normalized");
    assert(checkAnswer('apple~', ['apple']) === true, "Input with tilde normalized");
    assert(checkAnswer('apple·', ['apple']) === true, "Input with middle dot normalized");

    // 3. Edge Cases: Empty/Null/Undefined Inputs
    assert(checkAnswer('', ['apple']) === false, "Empty input returns false");
    assert(checkAnswer(null, ['apple']) === false, "Null input returns false");
    assert(checkAnswer(undefined, ['apple']) === false, "Undefined input returns false");
    assert(checkAnswer('apple', null) === false, "Null allowedAnswers returns false");
    assert(checkAnswer('apple', undefined) === false, "Undefined allowedAnswers returns false");

    // 4. Robustness Checks (Invalid Types)
    // These previously caused crashes
    assert(checkAnswer('apple', 'not-an-array') === false, "String allowedAnswers returns false (no crash)");
    assert(checkAnswer('apple', 123) === false, "Number allowedAnswers returns false (no crash)");
    assert(checkAnswer(123, ['123']) === false, "Number input returns false (no crash)");
    assert(checkAnswer({ foo: 'bar' }, ['apple']) === false, "Object input returns false (no crash)");

    // 5. Empty Array
    assert(checkAnswer('apple', []) === false, "Empty allowedAnswers array returns false");

    // 6. Special Characters Only Input
    // '(...)' -> '' after normalize. checkAnswer compares '' with 'apple' (normalized)
    assert(checkAnswer('(ignore)', ['apple']) === false, "Input that normalizes to empty string returns false");

    // Test with real processed data simulation
    const rawMeaning = "(ignore)";
    const answers = parseAnswerList(rawMeaning); // Should be []
    assert(answers.length === 0, "parseAnswerList returns empty array for ignored content");
    assert(checkAnswer('(ignore)', answers) === false, "Input '(ignore)' with parsed answers returns false");

    // Explicit check: checkAnswer does NOT normalize allowedAnswers (expects them to be clean)
    // If allowedAnswers contained '(ignore)', it would NOT match empty string from normalized input
    assert(checkAnswer('(ignore)', ['(ignore)']) === false, "checkAnswer does not normalize allowedAnswers");

} catch (e) {
    console.error("Test suite crashed:", e);
    failed++;
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) process.exit(1);
