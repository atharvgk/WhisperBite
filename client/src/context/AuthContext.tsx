import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
    email: string;
    role: string;
}

interface AuthContextValue {
    token: string | null;
    admin: Admin | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Props { children: ReactNode; }

export function AuthProvider({ children }: Props) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('whisperbite-token'));
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
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

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
