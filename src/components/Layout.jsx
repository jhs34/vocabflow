import { Outlet, Link } from 'react-router-dom';
import { BookOpen, Home, Maximize, Minimize } from 'lucide-react';
import { useState, useEffect } from 'react';
import VocabLogo from './VocabLogo';

export default function Layout() {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        function onFullscreenChange() {
            setIsFullScreen(Boolean(document.fullscreenElement));
        }

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <div className="container" style={{ paddingTop: '1.5rem' }}>
            <nav className="glass-panel" style={{
                padding: '0.5rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '9999px',
                width: '100%',
                margin: '0 auto 2rem auto',
                border: '1.5px solid rgba(255, 255, 255, 0.9)'
            }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', height: '100%', gap: '0rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', width: '28px', height: '28px', borderRadius: '50%', marginLeft: '-5px' }}></div>
                    <VocabLogo style={{ height: '37px', width: '148px', transform: 'translateY(0px)' }} />
                </Link>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={toggleFullScreen}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                        }}
                        title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>
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
