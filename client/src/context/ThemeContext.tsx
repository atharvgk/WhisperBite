import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextValue {
    theme: string;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface Props { children: ReactNode; }

export function ThemeProvider({ children }: Props) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('whisperbite-theme');
        return saved || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('whisperbite-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
