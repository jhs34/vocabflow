import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, GraduationCap, Search, X } from 'lucide-react';
import { getAvailableDays, searchAllWords } from '../utils/vocabLogic';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
    const [availableDays, setAvailableDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null: Day List Mode, []: Word Search Result (Empty or Populated)
    const [isSearching, setIsSearching] = useState(false);

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

    // 렌더링할 Day 리스트 계산 (검색어가 숫자인 경우 바로 필터링)
    const filteredDays = (() => {
        // 단어 검색 결과가 활성화되어 있으면 빈 배열 반환 (UI 분리)
        if (searchResults !== null) return [];

        const trimmed = searchQuery.trim();
        if (!trimmed) return availableDays;

        // 1. "Day 5" 형식
        const dayMatch = trimmed.match(/^day\s*(\d+)$/i);
        if (dayMatch) {
            const num = parseInt(dayMatch[1]);
            return availableDays.includes(num) ? [num] : [];
        }

        // 2. 숫자만 있는 경우 ("5", "12")
        if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed);
            return availableDays.includes(num) ? [num] : [];
        }

        // 3. 그 외 (단어 검색 전 단계 등) - 일단 전체 보여주거나, 사용자 경험에 따라 다름.
        // 여기서는 숫자 형식이 아니면(단어 검색어라면) Day는 안 보여주는 게 낫다? 
        // 아니면 엔터 치기 전까지는 그냥 전체 목록 보여주는 게 나을 수도 있음.
        // 사용자가 "apple"을 치는 동안에는 Day 목록이 유지되다가 엔터 치면 결과로 바뀌는 게 자연스러움.
        return availableDays;
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
            <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <motion.h1
                    initial={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-gradient-multi"
                    style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.03em' }}
                >
                    Select Your Lesson
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '3rem' }}
                >
                    Choose a day to start studying.
                </motion.p>

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
                // --- Day 목록 모드 (기본 + 숫자 필터링) ---
                <>
                    {filteredDays.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }} className="glass-panel">
                            {/* 필터링 결과가 없다는 건, 해당 Day 파일이 없다는 뜻 */}
                            {searchQuery ? `Day ${searchQuery} not found.` : "No lesson files found."}
                        </div>
                    ) : (
                        <motion.div
                            key={searchQuery}
                            variants={container}
                            initial="hidden"
                            animate="show"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '2rem' }}
                        >
                            {filteredDays.map((day) => (
                                <motion.div key={day} variants={item} className="glass-panel-gradient" style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    cursor: 'default',
                                    textAlign: 'center',
                                    aspectRatio: '1 / 1',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>Day <span style={{ color: 'var(--accent-purple)' }}>{day}</span></div>

                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <Link to={`/study/${day}`} style={{ textDecoration: 'none' }}>
                                            <button className="btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }}>
                                                <Book size={16} /> Study
                                            </button>
                                        </Link>
                                        <Link to={`/test/${day}`} style={{ textDecoration: 'none' }}>
                                            <button className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.6rem', fontSize: '0.9rem' }}>
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
        </div>
    );
}
