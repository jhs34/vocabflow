import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Layers, List as ListIcon, Eye, EyeOff, Shuffle, ListOrdered, Bookmark, Trash2, GraduationCap } from 'lucide-react';
import { fetchLessonData } from '../utils/vocabLogic';
import { motion, AnimatePresence } from 'framer-motion';

// Flashcard for Review (Reused)
function Flashcard({ word, onRemove }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const deleteButton = (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onRemove(word);
            }}
            title="Remove from bookmarks"
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
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
                color: 'var(--error)'
            }}
        >
            <Trash2 size={18} />
        </button>
    );

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
                        {deleteButton}
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
                        {word.daySource && <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.5rem', fontWeight: 500 }}>Day {word.daySource} #{word.id}</span>}
                        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tap to see meaning</p>
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
                        {deleteButton}
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
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

const MemoizedFlashcard = memo(Flashcard);

export default function Review() {
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [hideMeaning, setHideMeaning] = useState(false);
    const [direction, setDirection] = useState(0);
    const [isRandom, setIsRandom] = useState(() => localStorage.getItem('vocab_sort_mode') !== 'sequential');
    const [errorMsg, setErrorMsg] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null); // State for delete confirmation modal ('ALL' or wordObj)

    // Load Bookmarks Logic
    useEffect(() => {
        async function loadBookmarks() {
            setLoading(true);
            setErrorMsg(null);
            try {
                const stored = JSON.parse(localStorage.getItem('vocab_bookmarks') || '[]');

                if (stored.length === 0) {
                    setWords([]);
                    setLoading(false);
                    return;
                }

                // Group by day to efficient fetch
                const dayMap = {};
                stored.forEach(key => {
                    if (!key.includes('-')) return;
                    const [d, w] = key.split('-');
                    if (!dayMap[d]) dayMap[d] = [];
                    dayMap[d].push(w); // Keep as string "12" to match either string/number ID from JSON
                });

                let combinedWords = [];

                // Fetch data for each day
                for (const dayStr of Object.keys(dayMap)) {
                    // query = fetch(`.../day${dayStr}.json`)
                    const data = await fetchLessonData(dayStr);
                    if (!data || data.length === 0) continue;

                    const targetIds = dayMap[dayStr];
                    // Filter words that match the IDs (converting data ID to string for safety)
                    const found = data.filter(w => targetIds.includes(String(w.id))).map(w => ({
                        ...w,
                        daySource: dayStr, // Add source day info
                        uniqueKey: `${dayStr}-${w.id}` // Ensure unique key for React list
                    }));
                    combinedWords = [...combinedWords, ...found];
                }

                if (isRandom) {
                    // Shuffle
                    for (let i = combinedWords.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [combinedWords[i], combinedWords[j]] = [combinedWords[j], combinedWords[i]];
                    }
                } else {
                    // Sort by Day then ID
                    combinedWords.sort((a, b) => {
                        if (parseInt(a.daySource) !== parseInt(b.daySource)) {
                            return parseInt(a.daySource) - parseInt(b.daySource);
                        }
                        return a.id - b.id;
                    });
                }

                setWords(combinedWords);
            } catch (err) {
                console.error("Error loading bookmarks:", err);
                setErrorMsg("Failed to load bookmark data.");
            } finally {
                setLoading(false);
            }
        }
        loadBookmarks();
    }, [isRandom]); // Reload if sort changes

    const removeBookmark = (wordObj) => {
        setItemToDelete(wordObj);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        if (itemToDelete === 'ALL') {
            localStorage.setItem('vocab_bookmarks', '[]');
            setWords([]);
            setCurrentIndex(0);
        } else {
            const keyToRemove = `${itemToDelete.daySource}-${itemToDelete.id}`;
            const stored = JSON.parse(localStorage.getItem('vocab_bookmarks') || '[]');
            const newBookmarks = stored.filter(k => k !== keyToRemove);
            localStorage.setItem('vocab_bookmarks', JSON.stringify(newBookmarks));

            // Update local state without reload
            const newWords = words.filter(w => w.uniqueKey !== keyToRemove);
            setWords(newWords);

            if (currentIndex >= newWords.length && newWords.length > 0) {
                setCurrentIndex(newWords.length - 1);
            }
        }

        setItemToDelete(null);
    };

    const toggleSortMode = () => {
        const newMode = !isRandom;
        setIsRandom(newMode);
        localStorage.setItem('vocab_sort_mode', newMode ? 'random' : 'sequential');
    };

    const handleNext = () => {
        if (currentIndex >= words.length - 1) return;
        setDirection(1);
        setCurrentIndex(c => c + 1);
    };

    const handlePrev = () => {
        if (currentIndex <= 0) return;
        setDirection(-1);
        setCurrentIndex(c => c - 1);
    };

    // Animation Variants
    const slideVariants = {
        enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0, scale: 0.95 }),
        center: { zIndex: 1, x: 0, opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0, scale: 0.95, transition: { duration: 0.3 } })
    };
    const listContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const listItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    if (loading) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem', textAlign: 'center' }}>Loading your notebook...</div>;

    if (words.length === 0) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <ArrowLeft size={20} /> Back to Home
                    </Link>
                </header>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <Bookmark size={64} style={{ opacity: 0.2 }} />
                    <h2 style={{ margin: 0 }}>Bookmark Notebook is Empty</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        You haven't bookmarked any words yet.<br />
                        Go to a lesson and tap the bookmark icon to add words here.
                    </p>
                    <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Start Learning</Link>
                </div>
            </div>
        );
    }

    if (errorMsg) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{errorMsg}</div>;

    const currentWord = words[currentIndex];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '2rem' }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <ArrowLeft size={20} /> Back
                    </Link>
                    <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem', textAlign: 'right' }}>Bookmark Notebook</h2>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', transition: 'all 0.2s' }}>
                            <ListIcon size={16} /> List
                        </button>
                        <button onClick={() => setViewMode('card')} style={{ background: viewMode === 'card' ? 'var(--accent)' : 'transparent', color: viewMode === 'card' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', transition: 'all 0.2s' }}>
                            <Layers size={16} /> Card
                        </button>
                    </div>
                    <button onClick={toggleSortMode} style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title={isRandom ? "Random Order" : "Sequential Order"}>
                        {isRandom ? <Shuffle size={20} color="var(--accent-purple)" /> : <ListOrdered size={20} color="var(--accent-cyan)" />}
                    </button>

                    <Link to="/test/bookmark" style={{ textDecoration: 'none' }}>
                        <button style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Custom Test with Bookmarks">
                            <GraduationCap size={20} color="var(--success)" />
                        </button>
                    </Link>

                    <button
                        onClick={() => setItemToDelete('ALL')}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'var(--error)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Trash2 size={16} /> Clear All
                    </button>
                </div>
                {viewMode === 'card' && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {currentIndex + 1} / {words.length}
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                    <motion.div key="list-mode" variants={listContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <AnimatePresence mode="popLayout">
                            {words.map((item, idx) => (
                                <motion.div
                                    key={item.uniqueKey}
                                    layout
                                    variants={listItem}
                                    initial="hidden"
                                    animate="show"
                                    exit={{ scale: 0.9, opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="glass-panel-gradient"
                                    style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                        <button onClick={() => removeBookmark(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '5px', opacity: 0.7, transform: 'translateY(2px)' }}>
                                            <Trash2 size={18} />
                                        </button>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', transform: 'translateY(-2px)', display: 'inline-block' }}>{item.word}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Day {item.daySource} #{item.id}</span>
                                        </div>
                                    </div>
                                    <span style={{ color: 'var(--text-secondary)', opacity: hideMeaning ? 0 : 1, transition: 'opacity 0.3s', cursor: hideMeaning ? 'pointer' : 'default', textAlign: 'right', flex: 1, wordBreak: 'keep-all', lineHeight: '1.4' }} onClick={() => hideMeaning && alert(item.raw_meaning)}>
                                        {item.raw_meaning}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div style={{ position: 'relative', height: '400px' }}>
                        <AnimatePresence mode="popLayout" custom={direction}>
                            <motion.div key={currentIndex} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" style={{ width: '100%', height: '100%', position: 'absolute', willChange: 'transform, opacity' }}>
                                <MemoizedFlashcard word={currentWord} onRemove={removeBookmark} />
                            </motion.div>
                        </AnimatePresence>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: 0, width: '100%', zIndex: 10 }}>
                            <button className="btn-primary" onClick={handlePrev} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}>
                                <ChevronLeft /> Prev
                            </button>
                            <button className="btn-primary" onClick={handleNext} disabled={currentIndex === words.length - 1} style={{ opacity: currentIndex === words.length - 1 ? 0.5 : 1 }}>
                                Next <ChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {viewMode === 'list' && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setHideMeaning(!hideMeaning)} style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 100, width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--accent)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {hideMeaning ? <EyeOff size={24} /> : <Eye size={24} />}
                </motion.button>
            )}

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {itemToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                        onClick={() => setItemToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-panel-gradient"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                padding: '2rem',
                                maxWidth: '320px',
                                width: '100%',
                                textAlign: 'center',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                <Trash2 size={32} color="var(--error)" />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
                                {itemToDelete === 'ALL' ? 'Clear All Bookmarks?' : 'Remove Bookmark?'}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
                                {itemToDelete === 'ALL' ? (
                                    <>
                                        This will remove <span style={{ color: 'white', fontWeight: 'bold' }}>ALL words</span><br /> from your notebook. This cannot be undone.
                                    </>
                                ) : (
                                    <>
                                        Are you sure you want to remove <br />
                                        <span style={{ color: 'white', fontWeight: 'bold' }}>"{itemToDelete.word}"</span> from your notebook?
                                    </>
                                )}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setItemToDelete(null)}
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'var(--error)', border: 'none' }}
                                >
                                    {itemToDelete === 'ALL' ? 'Clear All' : 'Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
