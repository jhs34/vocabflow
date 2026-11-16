import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff, Shuffle, ListOrdered, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { fetchLessonData, getStoredBookmarks, saveStoredBookmarks } from '../utils/vocabLogic';
import {
    EASE_OUT,
    FLUID_SPRING,
    FLIP_TRANSITION,
    PROGRESS_SPRING,
    pageVariants,
    cardSlideVariants,
    modalBackdropVariants,
    modalPanelVariants,
    getStaggerDelay,
} from '../utils/motion';

export default function Review() {
    const shouldReduceMotion = useReducedMotion();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [hideMeaning, setHideMeaning] = useState(false);
    const [revealedKeys, setRevealedKeys] = useState([]);
    const [isRandom, setIsRandom] = useState(() => localStorage.getItem('vocab_sort_mode') !== 'sequential');
    const [errorMsg, setErrorMsg] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const toggleRevealKey = (uKey) => {
        setRevealedKeys(prev =>
            prev.includes(uKey) ? prev.filter(k => k !== uKey) : [...prev, uKey]
        );
    };

    useEffect(() => {
        async function loadBookmarks() {
            setLoading(true);
            setErrorMsg(null);
            try {
                const stored = getStoredBookmarks();

                if (stored.length === 0) {
                    setWords([]);
                    setLoading(false);
                    return;
                }

                const dayMap = {};
                stored.forEach(key => {
                    if (!key.includes('-')) return;
                    const [d, w] = key.split('-');
                    if (!dayMap[d]) dayMap[d] = [];
                    dayMap[d].push(w);
                });

                let combinedWords = [];

                for (const dayStr of Object.keys(dayMap)) {
                    const data = await fetchLessonData(dayStr);
                    if (!data || data.length === 0) continue;

                    const targetIds = dayMap[dayStr];
                    const found = data.filter(w => targetIds.includes(String(w.id))).map(w => ({
                        ...w,
                        daySource: dayStr,
                        uniqueKey: `${dayStr}-${w.id}`
                    }));
                    combinedWords = [...combinedWords, ...found];
                }

                if (isRandom) {
                    for (let i = combinedWords.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [combinedWords[i], combinedWords[j]] = [combinedWords[j], combinedWords[i]];
                    }
                } else {
                    combinedWords.sort((a, b) => {
                        if (parseInt(a.daySource, 10) !== parseInt(b.daySource, 10)) {
                            return parseInt(a.daySource, 10) - parseInt(b.daySource, 10);
                        }
                        return a.id - b.id;
                    });
                }

                setWords(combinedWords);
                setCurrentIndex(0);
                setDirection(0);
                setIsFlipped(false);
            } catch (err) {
                console.error("Error loading bookmarks:", err);
                setErrorMsg("북마크 데이터를 불러오지 못했습니다");
            } finally {
                setLoading(false);
            }
        }
        loadBookmarks();
    }, [isRandom]);

    const removeBookmark = (wordObj) => {
        setItemToDelete(wordObj);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        if (itemToDelete === 'ALL') {
            saveStoredBookmarks([]);
            setWords([]);
            setCurrentIndex(0);
            setDirection(0);
            setIsFlipped(false);
        } else {
            const keyToRemove = `${itemToDelete.daySource}-${itemToDelete.id}`;
            const stored = getStoredBookmarks();
            const newBookmarks = stored.filter(k => k !== keyToRemove);
            saveStoredBookmarks(newBookmarks);

            const newWords = words.filter(w => w.uniqueKey !== keyToRemove);
            setWords(newWords);
            setDirection(0);
            setIsFlipped(false);

            if (currentIndex >= newWords.length && newWords.length > 0) {
                setCurrentIndex(newWords.length - 1);
            }
        }

        setItemToDelete(null);
    };

    const toggleSortMode = () => {
        const newMode = !isRandom;
        setIsRandom(newMode);
        setDirection(0);
        setIsFlipped(false);
        localStorage.setItem('vocab_sort_mode', newMode ? 'random' : 'sequential');
    };

    const safeIndex = Math.min(currentIndex, Math.max(0, words.length - 1));
    const currentWord = words[safeIndex];

    const handleNext = useCallback(() => {
        if (safeIndex >= words.length - 1) return;
        setDirection(1);
        setIsFlipped(false);
        setCurrentIndex(safeIndex + 1);
    }, [safeIndex, words.length]);

    const handlePrev = useCallback(() => {
        if (safeIndex <= 0) return;
        setDirection(-1);
        setIsFlipped(false);
        setCurrentIndex(safeIndex - 1);
    }, [safeIndex]);

    // 모달 Escape 및 카드 키보드 단축키
    useEffect(() => {
        function onKeyDown(e) {
            if (itemToDelete) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setItemToDelete(null);
                }
                return;
            }

            if (viewMode !== 'card' || !currentWord) return;
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsFlipped(f => !f);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [viewMode, currentWord, itemToDelete, handleNext, handlePrev]);

    if (loading) {
        return (
            <div style={{ maxWidth: '720px', margin: '32px auto' }}>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    북마크 노트를 불러오는 중입니다
                </div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div style={{ maxWidth: '720px', margin: '32px auto' }}>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--error)', fontSize: '14px' }}>
                    {errorMsg}
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
                style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '48px' }}
            >
                <header style={{ padding: '24px 0 16px 0' }}>
                    <Link to="/" className="nav-link" style={{ borderBottom: 'none', padding: 0 }}>
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>단어장</span>
                    </Link>
                </header>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 500 }}>북마크 노트가 비어 있습니다</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '360px' }}>
                        각 Day 학습 화면에서 다시 복습하고 싶은 단어의 북마크 아이콘을 누르면 이곳에 모입니다
                    </p>
                    <Link to="/" className="btn-primary btn-sm" style={{ marginTop: '8px' }}>
                        단어장으로 이동
                    </Link>
                </div>
            </motion.div>
        );
    }

    const progressRatio = words.length > 0 ? (safeIndex + 1) / words.length : 0;

    const renderCardFooter = (flippedFace) => (
        <div style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)'
        }}>
            <span>클릭하여 {flippedFace ? '단어 보기' : '뜻 확인'}</span>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <kbd className="keycap">Space</kbd> 뒤집기
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <kbd className="keycap">←</kbd>
                    <kbd className="keycap">→</kbd> 이동
                </span>
            </div>
        </div>
    );

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '48px' }}
        >
            <header style={{ padding: '24px 0 16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <Link to="/" className="nav-link" style={{ borderBottom: 'none', padding: 0 }}>
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>단어장</span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 style={{ fontSize: '16px', fontWeight: 500 }}>북마크 노트</h1>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {words.length}단어
                        </span>
                    </div>
                </div>

                <div className="toolbar-row">
                    <div className="segmented" role="group" aria-label="보기 방식">
                        <button
                            type="button"
                            onClick={() => setViewMode('card')}
                            className={`segmented-btn ${viewMode === 'card' ? 'is-active' : ''}`}
                        >
                            {viewMode === 'card' && (
                                <motion.span
                                    layoutId="review-view-indicator"
                                    className="segmented-indicator"
                                    transition={FLUID_SPRING}
                                />
                            )}
                            <span>카드</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`segmented-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                        >
                            {viewMode === 'list' && (
                                <motion.span
                                    layoutId="review-view-indicator"
                                    className="segmented-indicator"
                                    transition={FLUID_SPRING}
                                />
                            )}
                            <span>목록</span>
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {viewMode === 'list' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setHideMeaning(prev => !prev);
                                    setRevealedKeys([]);
                                }}
                                className={hideMeaning ? 'btn-secondary btn-sm' : 'btn-ghost btn-sm'}
                                style={{ border: '1px solid var(--border)' }}
                                aria-label={hideMeaning ? '뜻 모두 보기' : '뜻 모두 가리기'}
                            >
                                {hideMeaning ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
                                <span>{hideMeaning ? '뜻 보기' : '뜻 가리기'}</span>
                            </button>
                        )}

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

                        <Link to="/test/bookmark" className="btn-secondary btn-sm">
                            북마크 시험
                        </Link>

                        <button
                            type="button"
                            onClick={() => setItemToDelete('ALL')}
                            className="btn-danger btn-sm"
                        >
                            <Trash2 size={16} strokeWidth={1.5} />
                            <span>전체 비우기</span>
                        </button>
                    </div>
                </div>
            </header>

            {viewMode === 'card' && currentWord ? (
                <motion.div
                    key="review-card-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                        <div className="card-glide-stage">
                            <AnimatePresence custom={direction} initial={false}>
                                <motion.div
                                    key={currentWord.uniqueKey}
                                    className="card-glide-item flip-stage"
                                    custom={direction}
                                    variants={cardSlideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                >
                                    <motion.div
                                        className="flip-card-inner"
                                        animate={{ rotateX: shouldReduceMotion ? 0 : (isFlipped ? 180 : 0) }}
                                        transition={FLIP_TRANSITION}
                                    >
                                        {/* Front Face */}
                                        <div
                                            role={!isFlipped ? 'button' : undefined}
                                            tabIndex={!isFlipped ? 0 : -1}
                                            aria-hidden={isFlipped}
                                            aria-label={!isFlipped ? `${currentWord.word} 카드 뒤집기` : undefined}
                                            onClick={() => setIsFlipped(true)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setIsFlipped(true);
                                                }
                                            }}
                                            className={`surface-card is-interactive flip-card-face ${shouldReduceMotion ? '' : 'flip-card-front'}`}
                                            style={{
                                                pointerEvents: isFlipped ? 'none' : 'auto',
                                                opacity: shouldReduceMotion && isFlipped ? 0 : 1,
                                            }}
                                        >
                                            <div style={{ padding: '20px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>Day {String(currentWord.daySource).padStart(2, '0')}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>#{String(currentWord.id).padStart(2, '0')}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>표제어</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    tabIndex={!isFlipped ? 0 : -1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeBookmark(currentWord);
                                                    }}
                                                    className="icon-btn"
                                                    aria-label={`${currentWord.word} 북마크 삭제`}
                                                    title="북마크에서 삭제"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            <div style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', flex: 1 }}>
                                                <h2 style={{
                                                    fontSize: 'clamp(32px, 6vw, 44px)',
                                                    fontWeight: 500,
                                                    letterSpacing: '-0.025em',
                                                    lineHeight: 1.15,
                                                    color: 'var(--text-primary)',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {currentWord.word}
                                                </h2>
                                            </div>

                                            {renderCardFooter(false)}
                                        </div>

                                        {/* Back Face */}
                                        <div
                                            role={isFlipped ? 'button' : undefined}
                                            tabIndex={isFlipped ? 0 : -1}
                                            aria-hidden={!isFlipped}
                                            aria-label={isFlipped ? `${currentWord.word} 카드 뒤집기` : undefined}
                                            onClick={() => setIsFlipped(false)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setIsFlipped(false);
                                                }
                                            }}
                                            className={`surface-card is-interactive flip-card-face ${shouldReduceMotion ? '' : 'flip-card-back'}`}
                                            style={{
                                                pointerEvents: isFlipped ? 'auto' : 'none',
                                                opacity: shouldReduceMotion && !isFlipped ? 0 : 1,
                                            }}
                                        >
                                            <div style={{ padding: '20px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>Day {String(currentWord.daySource).padStart(2, '0')}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>#{String(currentWord.id).padStart(2, '0')}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>한글 뜻</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    tabIndex={isFlipped ? 0 : -1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeBookmark(currentWord);
                                                    }}
                                                    className="icon-btn"
                                                    aria-label={`${currentWord.word} 북마크 삭제`}
                                                    title="북마크에서 삭제"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            <div style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', flex: 1 }}>
                                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                                    {currentWord.word}
                                                </div>
                                                <h3 style={{
                                                    fontSize: 'clamp(22px, 4vw, 28px)',
                                                    fontWeight: 500,
                                                    lineHeight: 1.4,
                                                    color: 'var(--text-primary)',
                                                    wordBreak: 'keep-all',
                                                    maxWidth: '520px'
                                                }}>
                                                    {currentWord.raw_meaning}
                                                </h3>
                                                {currentWord.answer_list.length > 0 && (
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>허용 답안</span>
                                                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                                                        <span>{currentWord.answer_list.join(' · ')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {renderCardFooter(true)}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="progress-track" style={{ height: '2px' }}>
                                <motion.div
                                    className="progress-fill"
                                    initial={false}
                                    animate={{ scaleX: progressRatio }}
                                    transition={PROGRESS_SPRING}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handlePrev}
                                    disabled={safeIndex === 0}
                                >
                                    <ChevronLeft size={16} strokeWidth={1.5} />
                                    <span>이전</span>
                                </button>

                                <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {safeIndex + 1} / {words.length}
                                </span>

                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleNext}
                                    disabled={safeIndex === words.length - 1}
                                >
                                    <span>다음</span>
                                    <ChevronRight size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                </motion.div>
            ) : (
                <motion.div
                    key="review-list-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                        {hideMeaning && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                각 행을 클릭하면 가려진 뜻을 개별적으로 확인할 수 있습니다
                            </div>
                        )}
                        <AnimatePresence initial={false}>
                            {words.map((item, idx) => {
                                const isWordHidden = hideMeaning && !revealedKeys.includes(item.uniqueKey);
                                return (
                                    <motion.div
                                        key={item.uniqueKey}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -16, transition: { duration: 0.18, ease: EASE_OUT } }}
                                        transition={{
                                            opacity: { duration: 0.28, ease: EASE_OUT, delay: getStaggerDelay(idx) },
                                            y: { duration: 0.28, ease: EASE_OUT, delay: getStaggerDelay(idx) },
                                        }}
                                        className="word-row"
                                        onClick={() => hideMeaning && toggleRevealKey(item.uniqueKey)}
                                        style={{ cursor: hideMeaning ? 'pointer' : 'default' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeBookmark(item);
                                                }}
                                                className="icon-btn"
                                                style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }}
                                                aria-label={`${item.word} 북마크 삭제`}
                                            >
                                                <Trash2 size={16} strokeWidth={1.5} />
                                            </button>
                                            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', width: '80px' }}>
                                                D{String(item.daySource).padStart(2, '0')} · #{String(item.id).padStart(2, '0')}
                                            </span>
                                            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {item.word}
                                            </span>
                                        </div>

                                        <span style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '14px',
                                            opacity: isWordHidden ? 0 : 1,
                                            filter: isWordHidden ? 'blur(4px)' : 'none',
                                            transform: isWordHidden ? 'translateY(3px)' : 'translateY(0)',
                                            transition: 'opacity 240ms var(--ease-out), transform 240ms var(--ease-out), filter 240ms var(--ease-out)',
                                            textAlign: 'right',
                                            flex: 1,
                                            wordBreak: 'keep-all'
                                        }}>
                                            {item.raw_meaning}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}

            <AnimatePresence>
                {itemToDelete && (
                    <motion.div
                        key="delete-backdrop"
                        variants={modalBackdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px'
                        }}
                        onClick={() => setItemToDelete(null)}
                    >
                        <motion.div
                            variants={modalPanelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="surface-card"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                padding: '24px',
                                maxWidth: '360px',
                                width: '100%',
                                borderRadius: 'var(--radius-panel)',
                                borderColor: 'var(--border-strong)',
                                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}
                        >
                            <h3 id="delete-dialog-title" style={{ fontSize: '17px', fontWeight: 500 }}>
                                {itemToDelete === 'ALL' ? '북마크 전체 비우기' : '북마크 삭제'}
                            </h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {itemToDelete === 'ALL'
                                    ? '저장된 모든 북마크 단어를 노트에서 비웁니다. 이 작업은 되돌릴 수 없습니다.'
                                    : `"${itemToDelete.word}" 단어를 북마크 노트에서 삭제하시겠습니까?`}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setItemToDelete(null)}
                                    className="btn-secondary btn-sm"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="btn-danger btn-sm"
                                >
                                    {itemToDelete === 'ALL' ? '전체 비우기' : '삭제'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
