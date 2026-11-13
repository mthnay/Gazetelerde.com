"use client";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ variant = 'fab' }) {
    const { theme, toggleTheme } = useTheme();

    // Tıklanan noktadan yayılan dairesel geçiş (destekleyen tarayıcılarda)
    const onClick = (e) => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!document.startViewTransition || reduce) return toggleTheme();
        const r = e.currentTarget.getBoundingClientRect();
        document.documentElement.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
        document.documentElement.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
        document.startViewTransition(() => toggleTheme());
    };

    const label = theme === 'dark' ? 'Gündüz baskısına geç' : 'Gece baskısına geç';
    return (
        <button onClick={onClick} className={variant === 'fab' ? 'theme-fab' : 'icon-btn'} title={label} aria-label={label}>
            {theme === 'dark' ? <Sun size={variant === 'fab' ? 20 : 17} /> : <Moon size={variant === 'fab' ? 20 : 17} />}
        </button>
    );
}
