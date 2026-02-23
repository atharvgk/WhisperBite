import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, UtensilsCrossed, LogOut } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, logout } = useAuth();
    const location = useLocation();

    return (
        <nav className="navbar glass" role="navigation" aria-label="Main navigation">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-logo" aria-label="WhisperBite Home">
                    <UtensilsCrossed size={24} />
                    <span>WhisperBite</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
                    <Link to="/book" className={location.pathname === '/book' ? 'active' : ''}>Book</Link>
                    {isAuthenticated ? (
                        <>
                            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Dashboard</Link>
                            <button onClick={logout} className="navbar-btn logout-btn" aria-label="Logout">
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <Link to="/admin/login" className={location.pathname === '/admin/login' ? 'active' : ''}>Admin</Link>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="navbar-btn theme-btn"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
