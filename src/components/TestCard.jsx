import { useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { EASE_OUT, TACTILE_SPRING, CARD_GLIDE_SPRING } from '../utils/motion';

export default function TestCard({
    word,
    feedback,
    userInput,
    setUserInput,
    onSubmit,
    onNext,
    isLastQuestion
}) {
    const inputRef = useRef(null);
    const nextButtonRef = useRef(null);

    useEffect(() => {
        if (!feedback && inputRef.current) {
            inputRef.current.focus();
        }
    }, [feedback]);

    useEffect(() => {
        if (feedback && nextButtonRef.current) {
            nextButtonRef.current.focus();
        }
    }, [feedback]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 44, scale: 0.985, zIndex: 1 }}
            animate={
                feedback === 'correct'
                    ? { opacity: 1, x: 0, scale: [1, 1.014, 1], zIndex: 1 }
                    : { opacity: 1, x: 0, scale: 1, zIndex: 1 }
            }
            exit={{
                opacity: 0,
                x: -44,
                scale: 0.98,
                zIndex: 0,
                pointerEvents: 'none',
                transition: {
                    x: CARD_GLIDE_SPRING,
                    scale: CARD_GLIDE_SPRING,
                    opacity: { duration: 0.2, ease: EASE_OUT },
                },
            }}
            transition={{
                x: CARD_GLIDE_SPRING,
                scale: feedback === 'correct' ? { duration: 0.34, ease: EASE_OUT } : CARD_GLIDE_SPRING,
                opacity: { duration: 0.24, ease: EASE_OUT },
            }}
            className="surface-card card-glide-item"
            style={{
                padding: '32px 24px',
                borderRadius: 'var(--radius-panel)',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
            }}
        >
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    #{String(word.id).padStart(2, '0')} · 한글 뜻 입력
                </span>
                <h2 style={{
                    fontSize: 'clamp(30px, 6vw, 42px)',
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.15,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word'
                }}>
                    {word.word}
                </h2>
            </div>

            <form
                onSubmit={onSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxWidth: '400px',
                    width: '100%',
                    margin: '0 auto'
                }}
            >
                <motion.div
                    animate={
                        feedback === 'incorrect'
                            ? { x: [0, -8, 8, -5, 4, -2, 0] }
                            : { x: 0 }
                    }
                    transition={{ duration: 0.42, ease: EASE_OUT }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        className="input-field"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={feedback !== null}
                        placeholder="한글 뜻 입력"
                        aria-label={`${word.word}의 한글 뜻 입력`}
                        style={{
                            height: '44px',
                            textAlign: 'center',
                            fontSize: '16px',
                            borderColor: feedback === 'correct'
                                ? 'rgba(76, 195, 138, 0.45)'
                                : feedback === 'incorrect'
                                    ? 'rgba(229, 72, 77, 0.45)'
                                    : 'var(--border)'
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
                </motion.div>

                {feedback === null ? (
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', height: '44px' }}
                    >
                        <span>정답 확인</span>
                        <kbd className="keycap hide-mobile" style={{ backgroundColor: 'rgba(22, 21, 19, 0.12)', color: 'var(--bg-page)', borderColor: 'rgba(22, 21, 19, 0.2)' }}>
                            Enter
                        </kbd>
                    </button>
                ) : (
                    <motion.div
                        key="feedback-panel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: EASE_OUT }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-control)',
                            backgroundColor: feedback === 'correct' ? 'var(--success-soft)' : 'var(--error-soft)',
                            border: `1px solid ${feedback === 'correct' ? 'rgba(76, 195, 138, 0.28)' : 'rgba(229, 72, 77, 0.28)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            textAlign: 'left'
                        }}>
                            <div style={{
                                color: feedback === 'correct' ? 'var(--success)' : 'var(--error)',
                                fontWeight: 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <motion.span
                                    initial={{ scale: 0.65, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={TACTILE_SPRING}
                                    style={{ display: 'inline-flex' }}
                                >
                                    {feedback === 'correct' ? <Check size={16} strokeWidth={1.5} /> : <X size={16} strokeWidth={1.5} />}
                                </motion.span>
                                <span>{feedback === 'correct' ? '정답' : '오답'}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', wordBreak: 'keep-all' }}>
                                <span style={{ color: 'var(--text-muted)' }}>허용 답안 · </span>
                                <span style={{ color: 'var(--text-primary)' }}>{word.answer_list.join(' · ')}</span>
                            </div>
                        </div>

                        <button
                            ref={nextButtonRef}
                            type="button"
                            className="btn-primary"
                            onClick={onNext}
                            style={{ width: '100%', height: '44px' }}
                        >
                            <span>{isLastQuestion ? '결과 보기' : '다음 문제'}</span>
                            <kbd className="keycap hide-mobile" style={{ backgroundColor: 'rgba(22, 21, 19, 0.12)', color: 'var(--bg-page)', borderColor: 'rgba(22, 21, 19, 0.2)' }}>
                                Enter
                            </kbd>
                        </button>
                    </motion.div>
                )}
            </form>
        </motion.div>
    );
}

