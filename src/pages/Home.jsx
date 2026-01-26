import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book, GraduationCap, Search, X, Star, Bookmark } from 'lucide-react';
import { getAvailableDays, searchAllWords } from '../utils/vocabLogic';
import { motion, AnimatePresence } from 'framer-motion';
import VocabLogo from '../components/VocabLogo';

export default function Home() {
    const [availableDays, setAvailableDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null: Day List Mode, []: Word Search Result (Empty or Populated)
    const [isSearching, setIsSearching] = useState(false);

    // Favorites Logic
    const [favorites, setFavorites] = useState([]);
    const [isFavoritesLoaded, setIsFavoritesLoaded] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const longPressTimer = useRef(null);

    // Load Favorites from LocalStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('my_vocab_favorites');
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load favorites", e);
        } finally {
            setIsFavoritesLoaded(true);
        }
    }, []);

    // Save Favorites to LocalStorage whenever it changes
    useEffect(() => {
        if (isFavoritesLoaded) {
            localStorage.setItem('my_vocab_favorites', JSON.stringify(favorites));
        }
    }, [favorites, isFavoritesLoaded]);

    useEffect(() => {
        async function loadDays() {
            setLoading(true);
            const days = await getAvailableDays();
            setAvailableDays(days);
            setLoading(false);
        }
        loadDays();
    }, []);

    // 단순 상태 업데이트만 수행
    const handleInputChange = (e) => setSearchQuery(e.target.value);

    // 실시간 검색 로직 (Debounce 적용)
    useEffect(() => {
        const query = searchQuery.trim();

        // 1. 검색어가 없으면 초기화
        if (!query) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }

        // 2. 숫자(Day) 검색인 경우 -> 즉시 필터링 (별도 API 호출 불필요)
        if (/^\d+$/.test(query) || /^day\s*\d+$/i.test(query)) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }

        // 3. 단어 검색 -> 0.5초 딜레이 후 실행
        setIsSearching(true);
        const timer = setTimeout(async () => {
            const results = await searchAllWords(query);
            setSearchResults(results);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 폼 제출 방지 (엔터키 눌러도 새로고침 안되게)
    const handleFormSubmit = (e) => e.preventDefault();

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults(null);
        setIsSearching(false);
    };

    // Favorites Implementation
    const toggleFavorite = (day) => {
        setFavorites(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day];
            }
        });

        // Visual feedback (optional vibration)
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const startPress = (day) => {
        longPressTimer.current = setTimeout(() => {
            toggleFavorite(day);
        }, 600); // 800ms -> 600ms for better responsiveness
    };

    const cancelPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // 렌더링할 Day 리스트 계산 (검색어 + 즐겨찾기 필터)
    const filteredDays = (() => {
        // 단어 검색 결과가 활성화되어 있으면 빈 배열 반환 (UI 분리)
        if (searchResults !== null) return [];

        let currentDays = availableDays;

        // 즐겨찾기 필터 적용
        if (showFavoritesOnly) {
            currentDays = currentDays.filter(day => favorites.includes(day));
        }

        const trimmed = searchQuery.trim();
        if (!trimmed) return currentDays;

        // 1. "Day 5" 형식
        const dayMatch = trimmed.match(/^day\s*(\d+)$/i);
        if (dayMatch) {
            const num = parseInt(dayMatch[1]);
            return currentDays.includes(num) ? [num] : [];
        }

        // 2. 숫자만 있는 경우 ("5", "12")
        if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed);
            return currentDays.includes(num) ? [num] : [];
        }

        return currentDays;
    })();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
        show: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1] /* Apple-style ease */
            }
        }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <VocabLogo
                    style={{
                        width: 'min(90vw, 650px)',
                        aspectRatio: '3/1',
                        margin: '-2.5rem auto -3rem auto',
                    }}
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.p
                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}
                >
                    Choose a day to start studying.
                </motion.p>

                {/* Review Notebook Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.8 }}
                    style={{ marginBottom: '2rem' }}
                >
                    <Link to="/review" style={{ textDecoration: 'none' }}>
                        <button className="glass-panel-gradient"
                            style={{
                                padding: '0.8rem 2rem',
                                borderRadius: '50px',
                                border: '1px solid var(--accent-pink)',
                                background: 'rgba(236, 72, 153, 0.1)',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Bookmark size={20} fill="white" />
                            Open Bookmark Notebook
                        </button>
                    </Link>
                </motion.div>

                {/* Search Bar */}
                <motion.form
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handleFormSubmit}
                    style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}
                >
                    <div className="glass-panel-gradient pill" style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center' }}>
                            <Search size={20} color="var(--text-secondary)" />
                        </div>
                        <input
                            type="text"
                            placeholder="Type Day number (e.g. 5) or Enter Word..."
                            value={searchQuery}
                            onChange={handleInputChange}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                flex: 1,
                                outline: 'none',
                                fontSize: '1.1rem',
                                padding: '1rem',
                                boxShadow: 'none'
                            }}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            name="vocab-search-input"
                            enterKeyHint="search"
                            inputMode="search"
                            data-1p-ignore="true"
                        />
                        {searchQuery && (
                            <button type="button" onClick={clearSearch} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', paddingRight: '1rem', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </motion.form>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Scanning for lessons...</div>
            ) : isSearching ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Searching words...</div>
            ) : searchResults !== null ? (
                // --- 단어 검색 결과 모드 ---
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Found {searchResults.length} matches for "{searchQuery}"
                    </div>
                    {searchResults.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>No matches found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {searchResults.map((result, idx) => (
                                <Link to={`/study/${result.day}`} key={`${result.day}-${result.id}-${idx}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.2rem' }}>{result.word}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{result.raw_meaning}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--accent-cyan)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            Day {result.day}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // --- Day 목록 모드 (기본 + 숫자 필터링 + 즐겨찾기 필터링) ---
                <>
                    {filteredDays.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }} className="glass-panel">
                            {showFavoritesOnly
                                ? "No favorite lessons yet. Long press a day to add it!"
                                : (searchQuery ? `Day ${searchQuery} not found.` : "No lesson files found.")}
                        </div>
                    ) : (
                        <motion.div
                            key={searchQuery + showFavoritesOnly} // Re-animate when filter changes
                            variants={container}
                            initial="hidden"
                            animate="show"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.9rem' }}
                        >
                            {filteredDays.map((day) => (
                                <motion.div
                                    key={day}
                                    variants={item}
                                    className={`glass-panel-gradient ${favorites.includes(day) ? 'is-favorite' : ''}`}

                                    // Long Press Events
                                    onMouseDown={() => startPress(day)}
                                    onMouseUp={cancelPress}
                                    onMouseLeave={cancelPress}
                                    onTouchStart={() => startPress(day)}
                                    onTouchEnd={cancelPress}

                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        cursor: 'default',
                                        textAlign: 'center',
                                        aspectRatio: '1 / 1',
                                        justifyContent: 'center',
                                        position: 'relative', // For absolute positioning of Star
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        WebkitTouchCallout: 'none'
                                    }}
                                >
                                    {/* Favorite Star Indicator */}
                                    {/* Favorite Indicator (handled by CSS class) */}

                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>Day <span style={{ color: 'var(--accent-purple)' }}>{day}</span></div>

                                    <div style={{ display: 'grid', gap: '0.5rem', width: '100%' }}>
                                        <Link to={`/study/${day}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                                            <button className="btn-primary" style={{ width: '90%', padding: '0.5rem', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                <Book size={16} /> Study
                                            </button>
                                        </Link>
                                        <Link to={`/test/${day}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                                            <button className="btn-primary" style={{ width: '90%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                <GraduationCap size={16} /> Test
                                            </button>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </>
            )}

            {/* Favorite Floating Action Button */}
            {!isSearching && searchResults === null && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '2rem',
                        zIndex: 100,
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '50%',
                        background: showFavoritesOnly ? 'var(--accent-purple)' : 'rgba(30, 41, 59, 0.8)',
                        color: 'white',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Star size={24} fill={showFavoritesOnly ? "white" : "none"} />
                </motion.button>
            )}
        </div>
    );
}
