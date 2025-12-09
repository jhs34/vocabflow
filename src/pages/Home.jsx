import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, GraduationCap } from 'lucide-react';
import { getAvailableDays } from '../utils/vocabLogic';

export default function Home() {
    const [availableDays, setAvailableDays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDays() {
            setLoading(true);
            const days = await getAvailableDays();
            setAvailableDays(days);
            setLoading(false);
        }
        loadDays();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Select Your Lesson
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Choose a day to start studying.
                </p>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Scanning for lessons...</div>
            ) : availableDays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }} className="glass-panel">
                    <p>No lesson files found.</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Please add <code>day1.json</code>, <code>day2.json</code>, etc. to <code>public/words/</code> folder.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
                    {availableDays.map((day) => (
                        <div key={day} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>Day {day}</div>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <Link to={`/study/${day}`} style={{ textDecoration: 'none' }}>
                                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Book size={16} /> Study
                                    </button>
                                </Link>
                                <Link to={`/test/${day}`} style={{ textDecoration: 'none' }}>
                                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <GraduationCap size={16} /> Test
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
