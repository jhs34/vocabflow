import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Shuffle, ListOrdered, Check, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { fetchLessonData, checkAnswer, shuffleArray, getStoredBookmarks } from '../utils/vocabLogic';
import { EASE_OUT, PROGRESS_SPRING, pageVariants, getStaggerDelay } from '../utils/motion';
import TestCard from '../components/TestCard';

export default function Test() {
    const { dayId } = useParams();
    const shouldReduceMotion = useReducedMotion();
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isRandom, setIsRandom] = useState(() => localStorage.getItem('vocab_sort_mode') !== 'sequential');

    const [testResults, setTestResults] = useState([]);
    const [isRetryMode, setIsRetryMode] = useState(false);
    const [retrySourceWords, setRetrySourceWords] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const applySort = (list, randomMode) => {
        const next = [...list];
        if (randomMode) {
            return shuffleArray(next);
        }
        return next.sort((a, b) => a.id - b.id);
    };

    useEffect(() => {
        if (isRetryMode) return;

        let cancelled = false;
        async function load() {
            setLoading(true);
            let processed = [];

            if (dayId === 'bookmark') {
                const stored = getStoredBookmarks();
                if (stored.length > 0) {
                    const dayMap = {};
                    stored.forEach(key => {
                        if (!key.includes('-')) return;
                        const [d, w] = key.split('-');
                        if (!dayMap[d]) dayMap[d] = [];
                        dayMap[d].push(w);
                    });

                    for (const dayStr of Object.keys(dayMap)) {
                        const data = await fetchLessonData(dayStr);
                        if (!data) continue;
                        const targetIds = dayMap[dayStr];
                        const found = data.filter(w => targetIds.includes(String(w.id)));
                        processed = [...processed, ...found];
                    }
                }
            } else {
                const data = await fetchLessonData(dayId);
                if (data) processed = [...data];
            }

            if (cancelled) return;

            if (processed.length === 0) {
                setWords([]);
                setLoading(false);
                return;
            }

            setWords(applySort(processed, isRandom));
            setCurrentIndex(0);
            setScore(0);
            setFeedback(null);
            setUserInput('');
            setIsFinished(false);
            setTestResults([]);
            setRetrySourceWords([]);
            setLoading(false);
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [dayId, isRandom, isRetryMode, refreshKey]);

    // 만점 달성 시 따뜻한 톤의 절제된 축하 효과 실행
    useEffect(() => {
        if (!isFinished || shouldReduceMotion || words.length === 0) return;
        if (score === words.length) {
            confetti({
                particleCount: 45,
                spread: 60,
                origin: { y: 0.65 },
                colors: ['#f0a843', '#efe9de', '#4cc38a'],
                disableForReducedMotion: true,
            });
        }
    }, [isFinished, score, words.length, shouldReduceMotion]);

    const toggleSortMode = () => {
        const newMode = !isRandom;
        setIsRandom(newMode);
        localStorage.setItem('vocab_sort_mode', newMode ? 'random' : 'sequential');
        if (isRetryMode && retrySourceWords.length > 0) {
            setWords(applySort(retrySourceWords, newMode));
            setCurrentIndex(0);
            setScore(0);
            setFeedback(null);
            setUserInput('');
            setIsFinished(false);
            setTestResults([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (feedback) return;

        const currentWord = words[currentIndex];
        const isCorrect = checkAnswer(userInput, currentWord.answer_list);

        setTestResults(prev => [...prev, {
            wordObj: currentWord,
            input: userInput,
            isCorrect
        }]);

        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 1);
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

        setRetrySourceWords(incorrectWords);
        setIsRetryMode(true);
        setWords(applySort(incorrectWords, isRandom));
        setCurrentIndex(0);
        setScore(0);
        setFeedback(null);
        setUserInput('');
        setIsFinished(false);
        setTestResults([]);
    };

    const handleRetryAll = () => {
        setIsRetryMode(false);
        setRetrySourceWords([]);
        setRefreshKey(prev => prev + 1);
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '640px', margin: '32px auto' }}>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    시험 문제를 준비하는 중입니다
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '48px' }}
            >
                <header style={{ padding: '24px 0 16px 0' }}>
                    <Link to="/" className="nav-link" style={{ borderBottom: 'none', padding: 0 }}>
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>단어장</span>
                    </Link>
                </header>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 500 }}>출제할 단어가 없습니다</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {dayId === 'bookmark'
                            ? '북마크 노트에 저장된 단어가 없습니다'
                            : '해당 Day 단어 데이터를 찾을 수 없습니다'}
                    </p>
                    <Link to="/" className="btn-secondary btn-sm" style={{ marginTop: '4px' }}>
                        단어장으로 이동
                    </Link>
                </div>
            </motion.div>
        );
    }

    const titleText = dayId === 'bookmark' ? '북마크 단어 시험' : `Day ${dayId} 시험`;

    if (isFinished) {
        const accuracy = Math.round((score / words.length) * 100);
        const accuracyRatio = score / words.length;
        const wrongTotal = words.length - score;

        return (
            <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 0 48px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, ease: EASE_OUT }}
                    className="surface-card"
                    style={{
                        padding: '28px 24px',
                        borderRadius: 'var(--radius-panel)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '18px', fontWeight: 500 }}>
                            {isRetryMode ? `${titleText} · 오답 재시험 결과` : `${titleText} 결과`}
                        </h1>
                        <span className="mono" style={{ fontSize: '13px', color: 'var(--accent)' }}>
                            정답률 {accuracy}%
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span className="mono" style={{ fontSize: '44px', fontWeight: 500, lineHeight: 1, color: 'var(--text-primary)' }}>
                            {score}
                        </span>
                        <span className="mono" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>
                            / {words.length}
                        </span>
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {wrongTotal === 0 ? '모든 문항을 맞혔습니다' : `오답 ${wrongTotal}문항`}
                        </span>
                    </div>

                    <div className="progress-track" style={{ height: '4px', backgroundColor: 'var(--bg-deep)' }}>
                        <motion.div
                            className="progress-fill"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: accuracyRatio }}
                            transition={{ duration: 0.72, ease: EASE_OUT, delay: 0.1 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        {wrongTotal > 0 && !isRetryMode && (
                            <button
                                type="button"
                                onClick={handleRetryIncorrect}
                                className="btn-primary"
                            >
                                오답 다시 풀기 ({wrongTotal})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleRetryAll}
                            className={wrongTotal > 0 && !isRetryMode ? 'btn-secondary' : 'btn-primary'}
                        >
                            <RotateCcw size={16} strokeWidth={1.5} />
                            <span>전체 다시 풀기</span>
                        </button>
                        <Link to="/" className="btn-ghost" style={{ border: '1px solid var(--border)' }}>
                            단어장으로
                        </Link>
                    </div>
                </motion.div>

                <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        답안 확인
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {testResults.map((result, idx) => (
                            <motion.div
                                key={`${result.wordObj.id}-${idx}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.28,
                                    ease: EASE_OUT,
                                    delay: getStaggerDelay(idx),
                                }}
                                className="word-row"
                                style={{
                                    borderColor: result.isCorrect ? 'var(--border)' : 'rgba(229, 72, 77, 0.28)'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            #{String(result.wordObj.id).padStart(2, '0')}
                                        </span>
                                        <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {result.wordObj.word}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', wordBreak: 'keep-all' }}>
                                        {result.wordObj.answer_list.join(' · ')}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: result.isCorrect ? 'var(--success)' : 'var(--error)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {result.isCorrect ? <Check size={16} strokeWidth={1.5} /> : <X size={16} strokeWidth={1.5} />}
                                        <span>{result.isCorrect ? '정답' : '오답'}</span>
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        입력: {result.input.trim() || '미입력'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </motion.div>
        );
    }

    const currentWord = words[currentIndex];
    const attempted = feedback !== null ? currentIndex + 1 : currentIndex;
    const wrongCount = attempted - score;
    const remaining = words.length - attempted;
    const progressRatio = words.length > 0 ? attempted / words.length : 0;

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '48px' }}
        >
            <header style={{ padding: '24px 0 16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <Link
                        to={dayId === 'bookmark' ? '/review' : `/study/${dayId}`}
                        className="nav-link"
                        style={{ borderBottom: 'none', padding: 0 }}
                    >
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>나가기</span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={toggleSortMode}
                            className="btn-ghost btn-sm"
                            style={{ border: '1px solid var(--border)' }}
                            aria-label={isRandom ? '번호순 정렬로 전환' : '무작위 순서로 전환'}
                        >
                            {isRandom ? <Shuffle size={16} strokeWidth={1.5} /> : <ListOrdered size={16} strokeWidth={1.5} />}
                            <span>{isRandom ? '무작위' : '번호순'}</span>
                        </button>

                        <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {currentIndex + 1} / {words.length}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="progress-track" style={{ height: '2px' }}>
                        <motion.div
                            className="progress-fill"
                            initial={false}
                            animate={{ scaleX: progressRatio }}
                            transition={PROGRESS_SPRING}
                        />
                    </div>

                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>{isRetryMode ? `${titleText} · 오답 재시험` : titleText}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--success)' }}>정답 {score}</span>
                            <span aria-hidden="true">·</span>
                            <span style={{ color: wrongCount > 0 ? 'var(--error)' : 'var(--text-muted)' }}>오답 {wrongCount}</span>
                            <span aria-hidden="true">·</span>
                            <span>남음 {remaining}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="card-glide-stage">
                <AnimatePresence initial={false}>
                    <TestCard
                        key={currentIndex}
                        word={currentWord}
                        feedback={feedback}
                        userInput={userInput}
                        setUserInput={setUserInput}
                        onSubmit={handleSubmit}
                        onNext={handleNext}
                        isLastQuestion={currentIndex === words.length - 1}
                    />
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
