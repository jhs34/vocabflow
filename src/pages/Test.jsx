import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
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

    useEffect(() => {
        async function load() {
            const originalData = await fetchLessonData(dayId);
            const shuffled = [...originalData];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setWords(shuffled);
        }
        load();
    }, [dayId]);

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

    if (words.length === 0) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    if (isFinished) {
        return (
            <div className="container" style={{ textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-panel-gradient"
                    style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}
                >
                    <h1 className="text-gradient-multi" style={{ fontSize: '2.5rem', margin: 0 }}>Test Complete!</h1>
                    <div style={{ fontSize: '5rem', fontWeight: '800', margin: '1rem 0', color: 'white', lineHeight: 1 }}>
                        {score} <span style={{ fontSize: '2rem', color: 'var(--text-secondary)', fontWeight: '400' }}>/ {words.length}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {score === words.length ? 'Perfect Score! 🎉' : 'Great job! Keep practicing.'}
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
                            Home
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', flex: 1 }}
                        >
                            <RotateCcw size={16} /> Retry
                        </button>
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
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.9rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Question <span style={{ color: 'white', fontWeight: 'bold' }}>{currentIndex + 1}</span> / {words.length}
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
                    style={{ padding: '3rem 2rem', textAlign: 'center', position: 'relative' }}
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
