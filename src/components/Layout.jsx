import { Outlet, Link } from 'react-router-dom';
import { BookOpen, Home, Github } from 'lucide-react';

export default function Layout() {
    return (
        <div className="container" style={{ paddingTop: '1.5rem' }}>
            <nav className="glass-panel" style={{
                padding: '0.75rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '9999px',
                width: '100%',
                margin: '0 auto 2rem auto',
                border: '1.5px solid rgba(255, 255, 255, 0.9)'
            }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                        <BookOpen color="white" size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>VocabFlow</span>
                </Link>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <a href="https://jhs34.github.io/" target="_blank" rel="noreferrer" style={{ color: 'white', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}>
                        <Home size={24} />
                    </a>
                </div>
            </nav>

            <main style={{ minHeight: '80vh' }}>
                <Outlet />
            </main>

            <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <p>© {new Date().getFullYear()} VocabFlow. Premium Learning Experience. Made with Antigravity</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>고등부 화이팅</p>
            </footer>
        </div>
    );
}
