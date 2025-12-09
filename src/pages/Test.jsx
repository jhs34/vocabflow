import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { fetchLessonData, checkAnswer } from '../utils/vocabLogic';
import confetti from 'canvas-confetti';

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

    if (words.length === 0) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem' }}>Loading...</div>;

    if (isFinished) {
        return (
            <div className="container" style={{ textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
                    <h1 className="text-gradient">Test Complete!</h1>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '2rem 0' }}>
                        {score} / {words.length}
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {score === words.length ? 'Perfect Score!' : 'Great job!'}
                    </p>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
                            Home
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                            style={{ background: 'transparent', border: '1px solid var(--accent)' }}
                        >
                            <RotateCcw size={16} style={{ marginRight: '5px' }} /> Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={20} /> Quit
                </Link>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Question {currentIndex + 1} / {words.length}</span>
            </header>

            <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', position: 'relative' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Translate this word:</p>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem' }}>{currentWord.word}</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={feedback !== null}
                        placeholder="뜻을 입력하세요 (한국어)"
                        style={{
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            borderColor: feedback === 'correct' ? 'var(--success)' : feedback === 'incorrect' ? 'var(--error)' : 'rgba(255,255,255,0.1)'
                        }}
                    />

                    {feedback === null ? (
                        <button type="submit" className="btn-primary">Submit</button>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            {feedback === 'correct' ? (
                                <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <CheckCircle /> Correct!
                                </div>
                            ) : (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ color: 'var(--error)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <XCircle /> Incorrect
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        Answer: {currentWord.answer_list[0]}
                                        {currentWord.answer_list.length > 1 && <span style={{ fontSize: '0.8em' }}> (also: {currentWord.answer_list.slice(1).join(', ')})</span>}
                                    </p>
                                </div>
                            )}
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleNext}
                                autoFocus
                            >
                                {currentIndex < words.length - 1 ? 'Next Question' : 'Finish Test'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
