import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

export default function TestCard({
    word,
    feedback,
    userInput,
    setUserInput,
    onSubmit,
    onNext,
    isLastQuestion
}) {
    // Focus management for the card
    const inputRef = useRef(null);
    const nextButtonRef = useRef(null);

    // Focus input on mount (new card)
    useEffect(() => {
        if (!feedback && inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Also ensure focus when feedback is cleared (if component persists)
    useEffect(() => {
        if (!feedback && inputRef.current) {
            inputRef.current.focus();
        }
    }, [feedback]);

    // Focus next button when feedback appears
    useEffect(() => {
        if (feedback && nextButtonRef.current) {
            nextButtonRef.current.focus();
        }
    }, [feedback]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{
                opacity: 0,
                x: -50,
                filter: 'blur(10px)',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 0
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-gradient"
            style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                willChange: 'transform, opacity',
                width: '100%',
                gridArea: '1 / 1 / 2 / 2'
            }}
        >
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
                Translate this word:
            </p>
            <h2 className="text-gradient-multi" style={{
                fontSize: 'clamp(2rem, 8vw, 3rem)',
                fontWeight: '800',
                marginBottom: '3rem',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                lineHeight: 1.2
            }}>
                {word.word}
            </h2>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
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
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    name="vocab-test-input-no-autofill"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    enterKeyHint="done"
                    inputMode="text"
                />

                {feedback === null ? (
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                        Submit Answer
                    </button>
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
                                    Answer: <span style={{ color: 'white' }}>{word.answer_list[0]}</span>
                                    {word.answer_list.length > 1 && <span style={{ fontSize: '0.9em', opacity: 0.8 }}> (also: {word.answer_list.slice(1).join(', ')})</span>}
                                </p>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ color: 'var(--error)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <XCircle /> Incorrect
                                </div>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    Answer: <span style={{ color: 'white', fontWeight: 'bold' }}>{word.answer_list[0]}</span>
                                    {word.answer_list.length > 1 && <span style={{ fontSize: '0.8em' }}> (also: {word.answer_list.slice(1).join(', ')})</span>}
                                </p>
                            </div>
                        )}
                        <button
                            ref={nextButtonRef}
                            type="button"
                            className="btn-primary"
                            onClick={onNext}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {isLastQuestion ? 'Finish Test' : 'Next Question'}
                        </button>
                    </motion.div>
                )}
            </form>
        </motion.div>
    );
}
