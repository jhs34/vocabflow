import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Layers, List as ListIcon, Eye, EyeOff } from 'lucide-react';
import { fetchLessonData } from '../utils/vocabLogic';

export default function Study() {
    const { dayId } = useParams();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
    const [hideMeaning, setHideMeaning] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const originalData = await fetchLessonData(dayId);
            // Random shuffle for Study mode too
            const shuffled = [...originalData];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setWords(shuffled);
            setLoading(false);
        }
        load();
    }, [dayId]);

    const handleNext = () => {
        if (isAnimating || currentIndex >= words.length - 1) return;

        setIsAnimating(true);
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(c => c + 1);
            setIsAnimating(false);
        }, 150);
    };

    const handlePrev = () => {
        if (isAnimating || currentIndex <= 0) return;

        setIsAnimating(true);
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(c => c - 1);
            setIsAnimating(false);
        }, 150);
    };

    if (loading) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem' }}>Loading...</div>;
    if (words.length === 0) return <div className="glass-panel" style={{ margin: '2rem', padding: '2rem' }}>No words found.</div>;

    const currentWord = words[currentIndex];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <ArrowLeft size={20} /> Back
                    </Link>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {viewMode === 'list' && (
                            <button
                                onClick={() => setHideMeaning(!hideMeaning)}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    color: hideMeaning ? 'var(--accent)' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                title={hideMeaning ? "Show Meanings" : "Hide Meanings"}
                            >
                                {hideMeaning ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        )}

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
                    </div>

                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Day {dayId}</span>
                </div>
                {viewMode === 'card' && (
                    <div style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {currentIndex + 1} / {words.length}
                    </div>
                )}
            </header>

            {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {words.map((item, idx) => (
                        <div key={item.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7, minWidth: '24px' }}>{idx + 1}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{item.word}</span>
                            </div>
                            <span style={{
                                color: 'var(--text-secondary)',
                                opacity: hideMeaning ? 0 : 1,
                                transition: 'opacity 0.3s',
                                cursor: hideMeaning ? 'pointer' : 'default'
                            }}
                                onClick={() => hideMeaning && alert(item.raw_meaning)} // Optional: click to peek? Removed for now to keep simple as requested "transparent"
                            >
                                {item.raw_meaning}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* 3D Flip Card Container */}
                    <div
                        style={{ perspective: '1000px', cursor: 'pointer', height: '300px' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            transition: 'transform 0.6s',
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}>
                            {/* Front */}
                            <div className="glass-panel" style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid rgba(139, 92, 246, 0.3)'
                            }}>
                                <h2 style={{ fontSize: '3rem', fontWeight: '800', margin: 0 }}>{currentWord.word}</h2>
                                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Click to see meaning</p>
                            </div>

                            {/* Back */}
                            <div className="glass-panel" style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(30, 41, 59, 0.9)'
                            }}>
                                <h3 style={{ fontSize: '1.5rem', color: '#fff', textAlign: 'center', padding: '0 1rem' }}>{currentWord.raw_meaning}</h3>
                                {/* 디버그용: 정답 목록 표시 */}
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                                    Answer: {currentWord.answer_list.join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                        <button className="btn-primary" onClick={handlePrev} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}>
                            <ChevronLeft /> Prev
                        </button>
                        <button className="btn-primary" onClick={handleNext} disabled={currentIndex === words.length - 1} style={{ opacity: currentIndex === words.length - 1 ? 0.5 : 1 }}>
                            Next <ChevronRight />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
