// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import theme from '../styles/theme';

// Create context
const ThemeContext = createContext(null);

// Provider component
export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(false);

    // Get current theme values based on mode
    const currentTheme = useMemo(() => {
        return {
            ...theme,
            colors: darkMode ? theme.colors.dark : theme.colors.light,
            isDark: darkMode,
        };
    }, [darkMode]);

    // Initialize theme from local storage or system preference
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        // Check if user has already set a preference
        if (localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Toggle dark mode
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prevMode => {
            const newMode = !prevMode;

            if (newMode) {
                localStorage.theme = 'dark';
                document.documentElement.classList.add('dark');
            } else {
                localStorage.theme = 'light';
                document.documentElement.classList.remove('dark');
            }

            return newMode;
        });
    }, []);

    // Set specific mode
    const setThemeMode = useCallback((mode) => {
        const isDark = mode === 'dark';

        setDarkMode(isDark);

        if (isDark) {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
        } else {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Get a specific color value
    const getColor = useCallback((colorPath) => {
        if (!colorPath) return null;

        const parts = colorPath.split('.');
        let colorValue = currentTheme.colors;

        for (const part of parts) {
            if (colorValue[part] === undefined) {
                return null;
            }
            colorValue = colorValue[part];
        }

        return colorValue;
    }, [currentTheme]);

    const value = useMemo(() => ({
        theme: currentTheme,
        darkMode,
        toggleDarkMode,
        setThemeMode,
        getColor,
    }), [currentTheme, darkMode, toggleDarkMode, setThemeMode, getColor]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook for components to consume the context
export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}