import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAvailableDays, searchAllWords, safeParseJSON } from '../utils/vocabLogic';
import { EASE_OUT, FLUID_SPRING, TACTILE_SPRING, pageVariants, getStaggerDelay } from '../utils/motion';

export default function Home() {
    const [availableDays, setAvailableDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [favorites, setFavorites] = useState(() =>
        safeParseJSON(localStorage.getItem('my_vocab_favorites'), [])
    );
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('my_vocab_favorites', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        async function loadDays() {
            setLoading(true);
            const days = await getAvailableDays();
            setAvailableDays(days);
            setLoading(false);
        }
        loadDays();
    }, []);

    // '/' 단축키로 검색창 포커스, 'Escape'로 초기화
    useEffect(() => {
        function handleKeyDown(e) {
            const tag = document.activeElement?.tagName;
            const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

            if (e.key === '/' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                setSearchQuery('');
                setSearchResults(null);
                setIsSearching(false);
                searchInputRef.current?.blur();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleInputChange = (e) => {
        const nextVal = e.target.value;
        setSearchQuery(nextVal);
        const trimmed = nextVal.trim();
        if (!trimmed || /^\d+$/.test(trimmed) || /^day\s*\d+$/i.test(trimmed)) {
            setSearchResults(null);
            setIsSearching(false);
        } else {
            setIsSearching(true);
        }
    };

    useEffect(() => {
        const query = searchQuery.trim();
        if (!query || /^\d+$/.test(query) || /^day\s*\d+$/i.test(query)) {
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            const results = await searchAllWords(query, availableDays);
            if (!cancelled) {
                setSearchResults(results);
                setIsSearching(false);
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery, availableDays]);

    const handleFormSubmit = (e) => e.preventDefault();

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults(null);
        setIsSearching(false);
        searchInputRef.current?.focus();
    };

    const toggleFavorite = (day) => {
        setFavorites(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const filteredDays = (() => {
        if (searchResults !== null) return [];

        let currentDays = availableDays;
        if (showFavoritesOnly) {
            currentDays = currentDays.filter(day => favorites.includes(day));
        }

        const trimmed = searchQuery.trim();
        if (!trimmed) return currentDays;

        const dayMatch = trimmed.match(/^day\s*(\d+)$/i);
        if (dayMatch) {
            const num = parseInt(dayMatch[1], 10);
            return currentDays.includes(num) ? [num] : [];
        }

        if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            return currentDays.includes(num) ? [num] : [];
        }

        return currentDays;
    })();

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            style={{ paddingBottom: '32px' }}
        >
            <section className="page-header-split">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h1 style={{ fontSize: '28px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}>
                        고등 필수 영단어
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span className="tabular">총 {availableDays.length || 50}개 Day</span>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="tabular">즐겨찾기 {favorites.length}개</span>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span>카드 암기 및 주관식 뜻 시험</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '0 1 auto' }}>
                    <div className="segmented" role="group" aria-label="단어장 필터">
                        <button
                            type="button"
                            onClick={() => setShowFavoritesOnly(false)}
                            className={`segmented-btn ${!showFavoritesOnly ? 'is-active' : ''}`}
                        >
                            {!showFavoritesOnly && (
                                <motion.span
                                    layoutId="home-filter-indicator"
                                    className="segmented-indicator"
                                    transition={FLUID_SPRING}
                                />
                            )}
                            <span>전체</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFavoritesOnly(true)}
                            className={`segmented-btn ${showFavoritesOnly ? 'is-active' : ''}`}
                        >
                            {showFavoritesOnly && (
                                <motion.span
                                    layoutId="home-filter-indicator"
                                    className="segmented-indicator"
                                    transition={FLUID_SPRING}
                                />
                            )}
                            <span>즐겨찾기</span>
                            {favorites.length > 0 && (
                                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {favorites.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <form
                        onSubmit={handleFormSubmit}
                        style={{ position: 'relative', width: '280px', maxWidth: '100%', flexGrow: 1 }}
                    >
                        <Search
                            size={16}
                            strokeWidth={1.5}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="input-field"
                            placeholder="단어, 뜻, Day 검색"
                            aria-label="단어, 뜻 또는 Day 번호 검색"
                            value={searchQuery}
                            onChange={handleInputChange}
                            style={{ paddingLeft: '36px', paddingRight: '36px' }}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            name="vocab-search-input"
                            enterKeyHint="search"
                            inputMode="search"
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="검색어 지우기"
                                className="icon-btn"
                                style={{
                                    position: 'absolute',
                                    right: '4px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '28px',
                                    height: '28px'
                                }}
                            >
                                <X size={16} strokeWidth={1.5} />
                            </button>
                        ) : (
                            <kbd
                                className="keycap hide-mobile"
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none'
                                }}
                            >
                                /
                            </kbd>
                        )}
                    </form>
                </div>
            </section>

            {loading ? (
                <div
                    className="surface-card"
                    style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}
                >
                    단어장 목록을 불러오는 중입니다
                </div>
            ) : isSearching ? (
                <div
                    className="surface-card"
                    style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}
                >
                    단어를 검색하는 중입니다
                </div>
            ) : searchResults !== null ? (
                <motion.div
                    key="search-results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                    <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }} className="tabular">
                        &ldquo;{searchQuery.trim()}&rdquo; 검색 결과 {searchResults.length}건
                    </div>
                    {searchResults.length === 0 ? (
                        <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            일치하는 단어가 없습니다
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {searchResults.map((result, idx) => (
                                <motion.div
                                    key={`${result.day}-${result.id}-${idx}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.28,
                                        ease: EASE_OUT,
                                        delay: getStaggerDelay(idx),
                                    }}
                                >
                                    <Link
                                        to={`/study/${result.day}`}
                                        className="word-row"
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap', minWidth: 0 }}>
                                            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {result.word}
                                            </span>
                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                {result.raw_meaning}
                                            </span>
                                        </div>
                                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                            Day {String(result.day).padStart(2, '0')} · #{String(result.id).padStart(2, '0')}
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            ) : filteredDays.length === 0 ? (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="surface-card"
                    style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                >
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {showFavoritesOnly
                            ? '즐겨찾기한 Day가 없습니다. 각 Day 카드 우측 상단 별 아이콘을 눌러 추가할 수 있습니다'
                            : searchQuery
                                ? `Day ${searchQuery.trim()} 단어장을 찾을 수 없습니다`
                                : '단어장 파일이 없습니다'}
                    </p>
                    {showFavoritesOnly && (
                        <button type="button" className="btn-secondary btn-sm" onClick={() => setShowFavoritesOnly(false)}>
                            전체 Day 보기
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="day-grid">
                    {filteredDays.map((day, index) => {
                        const isFav = favorites.includes(day);
                        return (
                            <motion.div
                                key={day}
                                layout="position"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    layout: FLUID_SPRING,
                                    opacity: { duration: 0.3, ease: EASE_OUT, delay: getStaggerDelay(index) },
                                    y: { duration: 0.32, ease: EASE_OUT, delay: getStaggerDelay(index) },
                                }}
                                className={`surface-card day-card ${isFav ? 'is-selected' : ''}`}
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                        <span className="tabular" style={{ fontSize: '17px', fontWeight: 500, lineHeight: 1.25, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                            Day {day}
                                        </span>
                                        <span className="mono" style={{ fontSize: '12px', lineHeight: 1.3, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            40단어
                                        </span>
                                    </div>

                                    <motion.button
                                        type="button"
                                        onClick={() => toggleFavorite(day)}
                                        whileTap={{ scale: 0.88 }}
                                        className={`icon-btn ${isFav ? 'is-active' : ''}`}
                                        style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }}
                                        aria-label={isFav ? `Day ${day} 즐겨찾기 해제` : `Day ${day} 즐겨찾기 추가`}
                                        title={isFav ? `Day ${day} 즐겨찾기 해제` : `Day ${day} 즐겨찾기 추가`}
                                    >
                                        <motion.span
                                            key={isFav ? 'fav-on' : 'fav-off'}
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            transition={TACTILE_SPRING}
                                            style={{ display: 'inline-flex' }}
                                        >
                                            <Star size={16} strokeWidth={1.5} fill={isFav ? 'currentColor' : 'none'} />
                                        </motion.span>
                                    </motion.button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <Link to={`/study/${day}`} className="btn-secondary btn-sm">
                                        학습
                                    </Link>
                                    <Link to={`/test/${day}`} className="btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>
                                        시험
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
