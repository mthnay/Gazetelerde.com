"use client";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const themeCtx = useTheme();
    const { theme, toggleTheme } = themeCtx || { theme: 'dark', toggleTheme: () => { } };
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <button
            onClick={toggleTheme}
            className="floating-theme-toggle"
            title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
        >
            <div className="toggle-content">
                {/* Wrap icons in spans to ensure styled-jsx classes apply correctly to the wrapper */}
                <span className={`icon-wrapper sun-wrapper ${theme === 'light' ? 'active' : ''}`}>
                    <Sun size={22} />
                </span>
                <span className={`icon-wrapper moon-wrapper ${theme === 'dark' ? 'active' : ''}`}>
                    <Moon size={22} />
                </span>
            </div>

            <style jsx>{`
                .floating-theme-toggle {
                    position: fixed;
                    bottom: 32px;
                    right: 32px;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(20, 20, 23, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    cursor: pointer;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    overflow: hidden;
                    color: white;
                }

                /* Light mode override for visibility */
                :global([data-theme='light']) .floating-theme-toggle {
                    background: rgba(255, 255, 255, 0.6);
                    border-color: rgba(0, 0, 0, 0.1);
                    color: black;
                }

                .floating-theme-toggle:hover {
                    transform: translateY(-4px) scale(1.05);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
                    border-color: var(--primary);
                    color: var(--primary);
                }

                .toggle-content {
                    position: relative;
                    width: 24px;
                    height: 24px;
                }

                .icon-wrapper {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: rotate(90deg) scale(0.5);
                    transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
                    pointer-events: none;
                }
                
                .icon-wrapper.active {
                    opacity: 1;
                    transform: rotate(0deg) scale(1);
                }

            `}</style>
        </button>
    );
}
