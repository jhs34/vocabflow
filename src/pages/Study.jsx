import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff, Shuffle, ListOrdered, Bookmark } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { fetchLessonData, shuffleArray, getStoredBookmarks, saveStoredBookmarks } from '../utils/vocabLogic';
import {
    EASE_OUT,
    FLUID_SPRING,
    TACTILE_SPRING,
    FLIP_TRANSITION,
    PROGRESS_SPRING,
    pageVariants,
    cardSlideVariants,
    getStaggerDelay,
} from '../utils/motion';

export default function Study() {
    const { dayId } = useParams();
    const shouldReduceMotion = useReducedMotion();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [hideMeaning, setHideMeaning] = useState(false);
    const [revealedIds, setRevealedIds] = useState([]);
    const [isRandom, setIsRandom] = useState(() => localStorage.getItem('vocab_sort_mode') !== 'sequential');

    const [bookmarks, setBookmarks] = useState(() => getStoredBookmarks());
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

    const toggleRevealWord = (wordId) => {
        setRevealedIds(prev =>
            prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
        );
    };

    const toggleBookmark = useCallback((wordId) => {
        const dId = parseInt(dayId, 10);
        const key = `${dId}-${wordId}`;
        const stored = getStoredBookmarks();
        const next = stored.includes(key) ? stored.filter(b => b !== key) : [...stored, key];
        saveStoredBookmarks(next);
        setBookmarks(next);
    }, [dayId]);

    const isBookmarked = useCallback((wordId) => {
        const dId = parseInt(dayId, 10);
        return bookmarks.includes(`${dId}-${wordId}`);
    }, [dayId, bookmarks]);

    const displayedWords = showBookmarksOnly
        ? words.filter(w => isBookmarked(w.id))
        : words;

    useEffect(() => {
        async function load() {
            setLoading(true);
            const originalData = await fetchLessonData(dayId);
            let processed = [...originalData];

            if (isRandom) {
                processed = shuffleArray(processed);
            } else {
                processed.sort((a, b) => a.id - b.id);
            }

            setWords(processed);
            setCurrentIndex(0);
            setDirection(0);
            setIsFlipped(false);
            setLoading(false);
        }
        load();
    }, [dayId, isRandom]);

    const toggleSortMode = () => {
        const newMode = !isRandom;
        setIsRandom(newMode);
        setDirection(0);
        setIsFlipped(false);
        localStorage.setItem('vocab_sort_mode', newMode ? 'random' : 'sequential');
    };

    const safeIndex = Math.min(currentIndex, Math.max(0, displayedWords.length - 1));
    const currentWord = displayedWords[safeIndex];

    const handleNext = useCallback(() => {
        if (safeIndex >= displayedWords.length - 1) return;
        setDirection(1);
        setIsFlipped(false);
        setCurrentIndex(safeIndex + 1);
    }, [safeIndex, displayedWords.length]);

    const handlePrev = useCallback(() => {
        if (safeIndex <= 0) return;
        setDirection(-1);
        setIsFlipped(false);
        setCurrentIndex(safeIndex - 1);
    }, [safeIndex]);

    // 카드 모드 키보드 단축키 연결 (Space: 뒤집기, 좌우 화살표: 이동, B: 북마크)
    useEffect(() => {
        if (viewMode !== 'card' || !currentWord) return;

        function onKeyDown(e) {
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
            } else if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                toggleBookmark(currentWord.id);
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [viewMode, currentWord, handleNext, handlePrev, toggleBookmark]);

    if (loading) {
        return (
            <div style={{ maxWidth: '720px', margin: '32px auto' }}>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    단어장을 불러오는 중입니다
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div style={{ maxWidth: '720px', margin: '32px auto' }}>
                <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>이 Day에 등록된 단어가 없습니다</p>
                    <Link to="/" className="btn-secondary btn-sm">단어장으로 돌아가기</Link>
                </div>
            </div>
        );
    }

    const progressRatio = displayedWords.length > 0 ? (safeIndex + 1) / displayedWords.length : 0;
    const currentBookmarked = currentWord ? isBookmarked(currentWord.id) : false;

    const renderBookmarkButton = (wordObj, activeOnThisFace) => (
        <motion.button
            type="button"
            tabIndex={activeOnThisFace ? 0 : -1}
            whileTap={activeOnThisFace ? { scale: 0.88 } : undefined}
            onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(wordObj.id);
            }}
            className={`icon-btn ${currentBookmarked ? 'is-active' : ''}`}
            aria-label={currentBookmarked ? `${wordObj.word} 북마크 해제` : `${wordObj.word} 북마크 추가`}
            title={currentBookmarked ? '북마크 해제' : '북마크 추가'}
        >
            <motion.span
                key={currentBookmarked ? 'bm-on' : 'bm-off'}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={TACTILE_SPRING}
                style={{ display: 'inline-flex' }}
            >
                <Bookmark size={16} strokeWidth={1.5} fill={currentBookmarked ? 'currentColor' : 'none'} />
            </motion.span>
        </motion.button>
    );

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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <kbd className="keycap">B</kbd> 북마크
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <Link to="/" className="nav-link" style={{ borderBottom: 'none', padding: 0 }}>
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        <span>단어장</span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="tabular" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            Day {dayId}
                        </span>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                        <Link to={`/test/${dayId}`} className="nav-link" style={{ borderBottom: 'none', padding: 0, fontSize: '13px' }}>
                            시험 보기
                        </Link>
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
                                    layoutId="study-view-indicator"
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
                                    layoutId="study-view-indicator"
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
                                    setRevealedIds([]);
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
                            onClick={() => {
                                setShowBookmarksOnly(prev => !prev);
                                setCurrentIndex(0);
                                setDirection(0);
                                setIsFlipped(false);
                            }}
                            className={`btn-sm ${showBookmarksOnly ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{
                                border: showBookmarksOnly ? '1px solid rgba(240, 168, 67, 0.36)' : '1px solid var(--border)',
                                color: showBookmarksOnly ? 'var(--accent)' : 'var(--text-secondary)'
                            }}
                            aria-label={showBookmarksOnly ? '전체 단어 보기' : '북마크 단어만 보기'}
                        >
                            <Bookmark size={16} strokeWidth={1.5} fill={showBookmarksOnly ? 'currentColor' : 'none'} />
                            <span>북마크만</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleSortMode}
                            className="btn-ghost btn-sm"
                            style={{ border: '1px solid var(--border)' }}
                            aria-label={isRandom ? '번호순 정렬로 전환' : '무작위 순서로 전환'}
                            title={isRandom ? '현재: 무작위 순서' : '현재: 번호순'}
                        >
                            {isRandom ? <Shuffle size={16} strokeWidth={1.5} /> : <ListOrdered size={16} strokeWidth={1.5} />}
                            <span>{isRandom ? '무작위' : '번호순'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {showBookmarksOnly && displayedWords.length === 0 ? (
                <motion.div
                    key="empty-bookmarks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="surface-card"
                    style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                >
                        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            이 Day에 북마크한 단어가 없습니다
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            전체 목록에서 다시 보고 싶은 단어에 북마크를 표시해 두세요
                        </p>
                        <button
                            type="button"
                            className="btn-secondary btn-sm"
                            style={{ marginTop: '4px' }}
                            onClick={() => {
                                setShowBookmarksOnly(false);
                                setCurrentIndex(0);
                                setDirection(0);
                            }}
                        >
                            전체 단어 보기
                        </button>
                </motion.div>
            ) : viewMode === 'card' && currentWord ? (
                <motion.div
                    key="card-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                        <div className="card-glide-stage">
                            <AnimatePresence custom={direction} initial={false}>
                                <motion.div
                                    key={currentWord.id}
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
                                        {/* Front Face (표제어) */}
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
                                            className="surface-card is-interactive flip-card-face"
                                            style={{
                                                pointerEvents: isFlipped ? 'none' : 'auto',
                                                opacity: shouldReduceMotion && isFlipped ? 0 : 1,
                                            }}
                                        >
                                            <div style={{ padding: '20px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>#{String(currentWord.id).padStart(2, '0')}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>표제어</span>
                                                </div>
                                                {renderBookmarkButton(currentWord, !isFlipped)}
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

                                        {/* Back Face (한글 뜻) */}
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
                                                    <span>#{String(currentWord.id).padStart(2, '0')}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>한글 뜻</span>
                                                </div>
                                                {renderBookmarkButton(currentWord, isFlipped)}
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

                        {/* Progress Hairline & Prev/Next Controls */}
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
                                    {safeIndex + 1} / {displayedWords.length}
                                </span>

                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleNext}
                                    disabled={safeIndex === displayedWords.length - 1}
                                >
                                    <span>다음</span>
                                    <ChevronRight size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                </motion.div>
            ) : (
                <motion.div
                    key="list-view"
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
                        {displayedWords.map((item, idx) => {
                            const isWordHidden = hideMeaning && !revealedIds.includes(item.id);
                            const bookmarked = isBookmarked(item.id);
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.28,
                                        ease: EASE_OUT,
                                        delay: getStaggerDelay(idx),
                                    }}
                                    className="word-row"
                                    onClick={() => hideMeaning && toggleRevealWord(item.id)}
                                    style={{ cursor: hideMeaning ? 'pointer' : 'default' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.88 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleBookmark(item.id);
                                            }}
                                            className={`icon-btn ${bookmarked ? 'is-active' : ''}`}
                                            style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }}
                                            aria-label={bookmarked ? `${item.word} 북마크 해제` : `${item.word} 북마크 추가`}
                                        >
                                            <motion.span
                                                key={bookmarked ? 'bm-on' : 'bm-off'}
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                transition={TACTILE_SPRING}
                                                style={{ display: 'inline-flex' }}
                                            >
                                                <Bookmark size={16} strokeWidth={1.5} fill={bookmarked ? 'currentColor' : 'none'} />
                                            </motion.span>
                                        </motion.button>
                                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px' }}>
                                            #{String(item.id).padStart(2, '0')}
                                        </span>
                                        <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {item.word}
                                        </span>
                                    </div>

                                    <span style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '14px',
                                        opacity: isWordHidden ? 0 : 1,
                                        filter: isWordHidden ? 'blur(4px)' : 'blur(0px)',
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
                </motion.div>
            )}
        </motion.div>
    );
}
