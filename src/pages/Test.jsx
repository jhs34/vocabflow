import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Shuffle, ListOrdered, Check, X, AlertCircle } from 'lucide-react';
import { fetchLessonData, checkAnswer } from '../utils/vocabLogic';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function Test() {
    const { dayId } = useParams();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const inputRef = useRef(null);
    const [isRandom, setIsRandom] = useState(() => localStorage.getItem('vocab_sort_mode') !== 'sequential');

    // Store detailed results for review
    const [testResults, setTestResults] = useState([]); // Array of { wordObj, input, isCorrect }

    // Retry State
    const [isRetryMode, setIsRetryMode] = useState(false);
    const [retrySourceWords, setRetrySourceWords] = useState([]); // Words to use for retry
    const [refreshKey, setRefreshKey] = useState(0); // Force re-run for Retry All

    useEffect(() => {
        // If in Retry Mode, do NOT fetch from API. Use retrySourceWords.
        if (isRetryMode) {
            let processed = [...retrySourceWords];
            if (isRandom) {
                // Shuffle logic duplicated
                for (let i = processed.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [processed[i], processed[j]] = [processed[j], processed[i]];
                }
            } else {
                processed.sort((a, b) => a.id - b.id);
            }
            setWords(processed);
            // Reset test state (except mode)
            setCurrentIndex(0);
            setScore(0);
            setFeedback(null);
            setUserInput('');
            setIsFinished(false);
            setTestResults([]);
            return;
        }

        async function load() {
            let processed = [];

            if (dayId === 'bookmark') {
                const stored = JSON.parse(localStorage.getItem('vocab_bookmarks') || '[]');
                if (stored.length === 0) {
                    setWords([]);
                    return;
                }

                // Group bookmarks by day
                const dayMap = {};
                stored.forEach(key => {
                    if (!key.includes('-')) return;
                    const [d, w] = key.split('-');
                    if (!dayMap[d]) dayMap[d] = [];
                    dayMap[d].push(w);
                });

                // Fetch words for each day
                for (const dayStr of Object.keys(dayMap)) {
                    const data = await fetchLessonData(dayStr);
                    if (!data) continue;
                    const targetIds = dayMap[dayStr];
                    const found = data.filter(w => targetIds.includes(String(w.id)));
                    processed = [...processed, ...found];
                }
            } else {
                const data = await fetchLessonData(dayId);
                if (data) processed = [...data];
            }

            if (processed.length === 0) {
                setWords([]);
                return;
            }

            if (isRandom) {
                // Fisher-Yates Shuffle
                for (let i = processed.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [processed[i], processed[j]] = [processed[j], processed[i]];
                }
            } else {
                // Sort by ID
                processed.sort((a, b) => a.id - b.id);
            }

            setWords(processed);
            resetTest();
        }
        load();
    }, [dayId, isRandom, isRetryMode, refreshKey]);

    const resetTest = () => {
        setCurrentIndex(0);
        setScore(0);
        setFeedback(null);
        setUserInput('');
        setIsFinished(false);
        setTestResults([]);
        setIsRetryMode(false); // Reset mode on full reset
        setRetrySourceWords([]);
    };

    const toggleSortMode = () => {
        const newMode = !isRandom;
        setIsRandom(newMode);
        localStorage.setItem('vocab_sort_mode', newMode ? 'random' : 'sequential');
    };

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [currentIndex, isFinished]);

    // Focus input after feedback is cleared (next question)
    useEffect(() => {
        if (feedback === null && inputRef.current) {
            inputRef.current.focus();
        }
    }, [feedback]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (feedback) return; // Prevent double submit

        const currentWord = words[currentIndex];
        const isCorrect = checkAnswer(userInput, currentWord.answer_list);

        // Record result
        setTestResults(prev => [...prev, {
            wordObj: currentWord,
            input: userInput,
            isCorrect: isCorrect
        }]);

        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 1);
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        } else {
            setFeedback('incorrect');
        }
    };

    const handleNext = () => {
        setFeedback(null);
        setUserInput('');
        if (currentIndex < words.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handleRetryIncorrect = () => {
        const incorrectWords = testResults.filter(r => !r.isCorrect).map(r => r.wordObj);
        if (incorrectWords.length === 0) return;

        // Enter Retry Mode
        setRetrySourceWords(incorrectWords);
        setIsRetryMode(true); // This will trigger useEffect to reload words from retrySourceWords
    };

    const handleRetryAll = () => {
        setIsRetryMode(false);
        setRetrySourceWords([]);
        setRefreshKey(prev => prev + 1);
    };

    if (words.length === 0) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    if (isFinished) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingBottom: '3rem' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-panel-gradient"
                    style={{ padding: '1.5rem 1rem', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}
                >
                    <h1 className="text-gradient-multi" style={{ fontSize: '2rem', margin: 0 }}>Test Complete!</h1>
                    <div style={{ fontSize: 'clamp(3.5rem, 12vw, 5rem)', fontWeight: '800', margin: '0.5rem 0', color: 'white', lineHeight: 1 }}>
                        {score} <span style={{ fontSize: '2rem', color: 'var(--text-secondary)', fontWeight: '400' }}>/ {words.length}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {isRetryMode ? 'Retry Round Complete!' : (score === words.length ? 'Perfect Score! 🎉' : 'Great job! Keep practicing.')}
                    </p>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', flex: 1, minWidth: '120px', display: 'flex', justifyContent: 'center' }}>
                            Home
                        </Link>
                        {score < words.length && !isRetryMode && (
                            <button
                                onClick={handleRetryIncorrect}
                                className="btn-primary"
                                style={{ background: 'var(--error)', border: 'none', flex: 1.5, minWidth: '150px' }}
                            >
                                <AlertCircle size={28} style={{ marginRight: '8px' }} /> Retry Incorrect ({words.length - score})
                            </button>
                        )}
                        <button
                            onClick={handleRetryAll}
                            className="btn-primary"
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', flex: 1, minWidth: '120px' }}
                        >
                            <RotateCcw size={16} style={{ marginRight: '8px' }} /> Retry All
                        </button>
                    </div>

                    {/* Review List */}
                    <div style={{ marginTop: '2rem', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', textAlign: 'left' }}>Review Answers</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {testResults.map((result, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: result.isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                    border: `1px solid ${result.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
                                }}>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{result.wordObj.word}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            Correct: <span style={{ color: 'white' }}>{result.wordObj.answer_list.join(', ')}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        {result.isCorrect ? (
                                            <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Check size={16} /> Correct
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--error)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <X size={16} /> Incorrect
                                            </span>
                                        )}
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                            You: {result.input || "(empty)"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </motion.div>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    // Calculate stats
    const attempted = feedback !== null ? currentIndex + 1 : currentIndex;
    const wrongCount = attempted - score;
    const remaining = words.length - attempted;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={20} /> Quit
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Sort Toggle Button */}
                    <button
                        onClick={toggleSortMode}
                        style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        title={isRandom ? "Random Order" : "Sequential Order"}
                    >
                        {isRandom ? <Shuffle size={18} color="var(--accent-purple)" /> : <ListOrdered size={18} color="var(--accent-cyan)" />}
                    </button>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.9rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Question <span style={{ color: 'white', fontWeight: 'bold' }}>{currentIndex + 1}</span> / {words.length}
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.2rem', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '600' }}>
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    O {score}
                </span>
                <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    X {wrongCount}
                </span>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Left {remaining}
                </span>
            </div>

            <AnimatePresence mode="popLayout">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-panel-gradient"
                    style={{ padding: '3rem 2rem', textAlign: 'center', position: 'relative', willChange: 'transform, opacity' }}
                    onAnimationComplete={() => inputRef.current?.focus()}
                >
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>Translate this word:</p>
                    <h2 className="text-gradient-multi" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', fontWeight: '800', marginBottom: '3rem', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{currentWord.word}</h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={feedback !== null}
                            placeholder="Type meaning (Korean)"
                            style={{
                                textAlign: 'center',
                                fontSize: '1.3rem',
                                padding: '1rem',
                                borderRadius: '16px',
                                background: 'rgba(0,0,0,0.3)',
                                borderColor: feedback === 'correct' ? 'var(--success)' : feedback === 'incorrect' ? 'var(--error)' : 'rgba(255,255,255,0.1)',
                                boxShadow: feedback ? `0 0 20px ${feedback === 'correct' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` : 'none',
                                transition: 'all 0.3s'
                            }}
                            autoComplete="off"
                            autoFocus
                        />

                        {feedback === null ? (
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Submit Answer</button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                            >
                                {feedback === 'correct' ? (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <CheckCircle /> Correct!
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                                            Answer: <span style={{ color: 'white' }}>{currentWord.answer_list[0]}</span>
                                            {currentWord.answer_list.length > 1 && <span style={{ fontSize: '0.9em', opacity: 0.8 }}> (also: {currentWord.answer_list.slice(1).join(', ')})</span>}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        <div style={{ color: 'var(--error)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <XCircle /> Incorrect
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                            Answer: <span style={{ color: 'white', fontWeight: 'bold' }}>{currentWord.answer_list[0]}</span>
                                            {currentWord.answer_list.length > 1 && <span style={{ fontSize: '0.8em' }}> (also: {currentWord.answer_list.slice(1).join(', ')})</span>}
                                        </p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleNext}
                                    autoFocus
                                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                >
                                    {currentIndex < words.length - 1 ? 'Next Question' : 'Finish Test'}
                                </button>
                            </motion.div>
                        )}
                    </form>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
