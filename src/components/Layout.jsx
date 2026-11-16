import { Outlet, Link, useLocation } from 'react-router-dom';
import { Maximize, Minimize, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VocabLogo from './VocabLogo';
import { getStoredBookmarks } from '../utils/vocabLogic';
import { FLUID_SPRING, EASE_OUT } from '../utils/motion';

export default function Layout() {
    const location = useLocation();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [bookmarkCount, setBookmarkCount] = useState(() => getStoredBookmarks().length);

    useEffect(() => {
        function onFullscreenChange() {
            const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
            setIsFullScreen(active);
            document.documentElement.classList.toggle('is-fullscreen', active);
        }

        function syncBookmarks() {
            setBookmarkCount(getStoredBookmarks().length);
        }

        onFullscreenChange();
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        window.addEventListener('bookmarks-updated', syncBookmarks);
        window.addEventListener('storage', syncBookmarks);
        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
            window.removeEventListener('bookmarks-updated', syncBookmarks);
            window.removeEventListener('storage', syncBookmarks);
            document.documentElement.classList.remove('is-fullscreen');
        };
    }, []);

    const toggleFullScreen = () => {
        const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fsElement) {
            const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
            if (req) {
                Promise.resolve(req.call(document.documentElement)).catch((e) => {
                    console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
                });
            }
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    };

    const isReviewActive = location.pathname.startsWith('/review') || location.pathname === '/test/bookmark';
    const isHomeActive = !isReviewActive;

    return (
        <div className="app-shell">
            <header className="top-bar">
                <div className="shell-inner top-bar-inner">
                    <Link
                        to="/"
                        aria-label="VocabFlow 홈"
                        style={{
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            flexShrink: 0
                        }}
                    >
                        <VocabLogo style={{ height: '22px', width: '132px' }} />
                    </Link>

                    <nav className="nav-links" aria-label="주요 메뉴">
                        <Link to="/" className={`nav-link ${isHomeActive ? 'is-active' : ''}`}>
                            <span>단어장</span>
                            {isHomeActive && (
                                <motion.span
                                    layoutId="top-nav-underline"
                                    className="nav-underline"
                                    transition={FLUID_SPRING}
                                />
                            )}
                        </Link>
                        <Link to="/review" className={`nav-link ${isReviewActive ? 'is-active' : ''}`}>
                            <span>북마크 노트</span>
                            <AnimatePresence mode="wait" initial={false}>
                                {bookmarkCount > 0 && (
                                    <motion.span
                                        key={bookmarkCount}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{ duration: 0.16, ease: EASE_OUT }}
                                        className="mono"
                                        style={{ color: 'var(--text-muted)', fontSize: '12px' }}
                                    >
                                        · {bookmarkCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            {isReviewActive && (
                                <motion.span
                                    layoutId="top-nav-underline"
                                    className="nav-underline"
                                    transition={FLUID_SPRING}
                                />
                            )}
                        </Link>
                    </nav>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <a
                            href="https://jhs34.github.io/"
                            target="_blank"
                            rel="noreferrer"
                            className="nav-link hide-mobile"
                            style={{ borderBottom: 'none' }}
                        >
                            <span>블로그</span>
                            <ArrowUpRight size={16} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                        </a>
                        <button
                            type="button"
                            onClick={toggleFullScreen}
                            className="icon-btn"
                            title={isFullScreen ? "전체화면 종료" : "전체화면 전환"}
                            aria-label={isFullScreen ? "전체화면 종료" : "전체화면 전환"}
                        >
                            {isFullScreen ? <Minimize size={16} strokeWidth={1.5} /> : <Maximize size={16} strokeWidth={1.5} />}
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, width: '100%' }}>
                <div className="shell-inner">
                    <Outlet />
                </div>
            </main>

            <footer style={{ borderTop: '1px solid var(--border)', marginTop: '64px', padding: '24px 0' }}>
                <div className="shell-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <span>© {new Date().getFullYear()} VocabFlow · 고등 필수 영단어</span>
                    <span>고등부 화이팅</span>
                </div>
            </footer>
        </div>
    );
}
