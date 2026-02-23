import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('whisperbite-token'));
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/verify`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setAdmin(data.data.admin);
            } else {
                logout();
            }
        } catch {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (data.success) {
            setToken(data.data.token);
            setAdmin(data.data.admin);
            localStorage.setItem('whisperbite-token', data.data.token);
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const logout = () => {
        setToken(null);
        setAdmin(null);
        localStorage.removeItem('whisperbite-token');
    };

    return (
        <AuthContext.Provider value={{
            token,
            admin,
            loading,
            isAuthenticated: !!token && !!admin,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
