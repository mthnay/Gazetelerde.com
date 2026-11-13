"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => { } });

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');

    // İlk tema layout'taki inline script ile <html data-theme> üzerine yazılır;
    // burada sadece o değeri state'e alıyoruz.
    useEffect(() => {
        const current = document.documentElement.getAttribute('data-theme');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (current === 'light' || current === 'dark') setTheme(current);
    }, []);

    // Tema DOM'a eşzamanlı yazılır (View Transition anlık görüntüsü doğru alınsın diye)
    const toggleTheme = () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch { /* yoksay */ }
        setTheme(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
