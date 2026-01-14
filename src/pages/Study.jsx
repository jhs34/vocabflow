import { useState, useEffect, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Layers, List as ListIcon, Eye, EyeOff, Shuffle, ListOrdered, Bookmark } from 'lucide-react';
import { fetchLessonData } from '../utils/vocabLogic';
import { motion, AnimatePresence } from 'framer-motion';

// Separate Flashcard Component to isolate Flip State
function Flashcard({ word, isBookmarked, onToggleBookmark }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div style={{ perspective: '1000px', cursor: 'pointer', height: '300px', position: 'relative' }}>
            <motion.div
                whileHover={{ y: -5 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ width: '100%', height: '100%' }}
            >
                <motion.div
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        willChange: 'transform'
                    }}
                >
                    {/* Front */}
                    <div className={`glass-panel-gradient ${isHovered ? 'force-hover' : ''}`} style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <h2 className="text-gradient-multi" style={{
                            fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
                            fontWeight: '800',
                            margin: 0,
                            textAlign: 'center',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.1,
                            padding: '0 1rem'
                        }}>{word.word}</h2>
                        <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.5rem', fontWeight: 500 }}>#{word.id}</span>
                        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tap to see meaning</p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(word.id);
                            }}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(0,0,0,0.3)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10,
                                color: isBookmarked ? 'var(--accent-pink)' : 'var(--text-secondary)'
                            }}
                        >
                            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* Back */}
                    <div className={`glass-panel-gradient ${isHovered ? 'force-hover' : ''}`} style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <h3 style={{
                            fontSize: 'clamp(1.4rem, 4vw + 0.5rem, 1.8rem)',
                            fontWeight: 'bold',
                            color: '#fff',
                            textAlign: 'center',
                            padding: '0 1.5rem',
                            lineHeight: '1.4',
                            wordBreak: 'keep-all',
                            overflowWrap: 'anywhere'
                        }}>{word.raw_meaning}</h3>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {word.answer_list.map((ans, idx) => (
                                <span key={idx} style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    color: 'var(--accent-cyan)'
                                }}>
                                    {ans}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(word.id);
                            }}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(0,0,0,0.3)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10,
                                color: isBookmarked ? 'var(--accent-pink)' : 'var(--text-secondary)'
                            }}
                        >
                            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>


        </div>
    );
}

const MemoizedFlashcard = memo(Flashcard);

export default function Study() {
    const { dayId } = useParams();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [hideMeaning, setHideMeaning] = useState(false);
    const [direction, setDirection] = useState(0);
    const [isRandom, setIsRandom] = useState(() => localStorage.getItem('vocab_sort_mode') !== 'sequential');

    // Bookmark Logic
    const [bookmarks, setBookmarks] = useState([]); // Array of strings "dayId-wordId"
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('vocab_bookmarks');
        if (stored) {
            setBookmarks(JSON.parse(stored));
        }
    }, []);

    const toggleBookmark = (wordId) => {
        // Ensure consistent key formats (e.g. "5-12")
        const dId = parseInt(dayId); // Normalized Day ID
        const key = `${dId}-${wordId}`; // e.g., "5-12" or "5-stringId"

        let newBookmarks;
        if (bookmarks.includes(key)) {
            newBookmarks = bookmarks.filter(b => b !== key);
        } else {
            newBookmarks = [...bookmarks, key];
        }
        setBookmarks(newBookmarks);
        localStorage.setItem('vocab_bookmarks', JSON.stringify(newBookmarks));
    };

    const isBookmarked = (wordId) => {
        const dId = parseInt(dayId);
        return bookmarks.includes(`${dId}-${wordId}`);
    };

    // Filter words based on Bookmark toggle
    // Removed useMemo to ensure instant updates and prevent stale closures
    const displayedWords = showBookmarksOnly
        ? words.filter(w => isBookmarked(w.id))
        : words;

    useEffect(() => {
        async function load() {
            setLoading(true);
            const originalData = await fetchLessonData(dayId);
            let processed = [...originalData];

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
            setCurrentIndex(0);
            setLoading(false);
        }
        load();
    }, [dayId, isRandom]); // Re-load when sort changes

    const toggleSortMode = () => {
        const newMode = !isRandom;
        setIsRandom(newMode);
        localStorage.setItem('vocab_sort_mode', newMode ? 'random' : 'sequential');
    };

    const handleNext = () => {
        if (currentIndex >= displayedWords.length - 1) return;
        setDirection(1);
        setCurrentIndex(c => c + 1);
    };

    const handlePrev = () => {
        if (currentIndex <= 0) return;
        setDirection(-1);
        setCurrentIndex(c => c - 1);
    };

    if (loading) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    // Check global words length first
    if (words.length === 0) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem', textAlign: 'center' }}>No words found in this lesson.</div>;

    // If filtering by bookmarks returns empty
    if (showBookmarksOnly && displayedWords.length === 0) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                            <ArrowLeft size={20} /> Back
                        </Link>
                    </div>
                </header>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Bookmark size={48} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No bookmarked words yet.</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Go back to full list and bookmark some words!</p>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setShowBookmarksOnly(false);
                            setCurrentIndex(0);
                        }}
                    >
                        Show All Words
                    </button>
                </div>
            </div>
        )
    }

    const currentWord = displayedWords[currentIndex];

    // Slide Variants
    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3 }
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.3 }
        })
    };

    const listContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        }
    };

    const listItem = {
        hidden: { opacity: 0, y: 10, filter: 'blur(5px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                            <ArrowLeft size={20} /> Back
                        </Link>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>Day {dayId}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    background: viewMode === 'list' ? 'var(--accent)' : 'transparent',
                                    color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ListIcon size={16} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                style={{
                                    background: viewMode === 'card' ? 'var(--accent)' : 'transparent',
                                    color: viewMode === 'card' ? 'white' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Layers size={16} /> Card
                            </button>
                        </div>
                        {/* Bookmark Filter Toggle */}
                        <button
                            onClick={() => {
                                setShowBookmarksOnly(!showBookmarksOnly);
                                setCurrentIndex(0); // Reset index
                            }}
                            style={{
                                background: showBookmarksOnly ? 'var(--accent-pink)' : 'rgba(30, 41, 59, 0.5)',
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                color: showBookmarksOnly ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            title={showBookmarksOnly ? "Show All Words" : "Show Bookmarks Only"}
                        >
                            <Bookmark size={20} fill={showBookmarksOnly ? "white" : "none"} />
                        </button>

                        {/* Sort Toggle Button inside the center group */}
                        <button
                            onClick={toggleSortMode}
                            style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            title={isRandom ? "Random Order" : "Sequential Order"}
                        >
                            {isRandom ? <Shuffle size={20} color="var(--accent-purple)" /> : <ListOrdered size={20} color="var(--accent-cyan)" />}
                        </button>
                    </div>
                </div>
                {viewMode === 'card' && currentWord && (
                    <div style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {currentIndex + 1} / {displayedWords.length}
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {viewMode === 'list' && (
                    <motion.div
                        key={showBookmarksOnly ? 'list-bookmarks' : 'list-all'}
                        variants={listContainer}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        {displayedWords.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                variants={listItem}
                                className="glass-panel-gradient"
                                style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                    <button
                                        onClick={() => toggleBookmark(item.id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isBookmarked(item.id) ? 'var(--accent-pink)' : 'var(--text-secondary)', padding: '5px', transform: 'translateY(2px)' }}
                                    >
                                        <Bookmark size={18} fill={isBookmarked(item.id) ? "currentColor" : "none"} />
                                    </button>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', opacity: 0.7, minWidth: '24px' }}>{item.id}</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', transform: 'translateY(-1px)', display: 'inline-block' }}>{item.word}</span>
                                </div>
                                <span style={{
                                    color: 'var(--text-secondary)',
                                    opacity: hideMeaning ? 0 : 1,
                                    transition: 'opacity 0.3s',
                                    cursor: hideMeaning ? 'pointer' : 'default',
                                    textAlign: 'right',
                                    flex: 1,
                                    wordBreak: 'keep-all',
                                    lineHeight: '1.4'
                                }}
                                    onClick={() => hideMeaning && alert(item.raw_meaning)}
                                >
                                    {item.raw_meaning}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {viewMode === 'card' && currentWord && (
                    <div style={{ position: 'relative', height: '400px' }}>
                        <AnimatePresence mode="popLayout" custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                style={{ width: '100%', height: '100%', position: 'absolute', willChange: 'transform, opacity' }}
                            >
                                <MemoizedFlashcard word={currentWord} isBookmarked={isBookmarked(currentWord.id)} onToggleBookmark={toggleBookmark} />
                            </motion.div>
                        </AnimatePresence>

                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: 0, width: '100%', zIndex: 10 }}>
                            <button className="btn-primary" onClick={handlePrev} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}>
                                <ChevronLeft /> Prev
                            </button>
                            <button className="btn-primary" onClick={handleNext} disabled={currentIndex === displayedWords.length - 1} style={{ opacity: currentIndex === displayedWords.length - 1 ? 0.5 : 1 }}>
                                Next <ChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {viewMode === 'list' && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setHideMeaning(!hideMeaning)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '2rem',
                        zIndex: 100,
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    {hideMeaning ? <EyeOff size={24} /> : <Eye size={24} />}
                </motion.button>
            )}
        </div>
    );
}
