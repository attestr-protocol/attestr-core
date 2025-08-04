// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import theme from '../styles/theme';

// Types and Interfaces
export interface ColorVariant {
    DEFAULT: string;
    light: string;
    dark: string;
}

export interface AccentColors {
    gold: string;
    purple: string;
    teal: string;
}

export interface ThemeColors {
    primary: ColorVariant;
    secondary: ColorVariant;
    background: {
        DEFAULT: string;
        secondary: string;
        tertiary: string;
    };
    text: {
        primary: string;
        secondary: string;
        tertiary: string;
        inverse: string;
    };
    border: {
        DEFAULT: string;
        focus: string;
    };
    success: ColorVariant;
    warning: ColorVariant;
    error: ColorVariant;
    info: ColorVariant;
    accent: AccentColors;
}

export interface Typography {
    fontFamily: {
        sans: string;
        mono: string;
    };
    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
        '5xl': string;
    };
    fontWeight: {
        normal: string;
        medium: string;
        semibold: string;
        bold: string;
    };
    lineHeight: {
        none: string;
        tight: string;
        normal: string;
        relaxed: string;
    };
}

export interface Spacing {
    px: string;
    0: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
    32: string;
    40: string;
    48: string;
    56: string;
    64: string;
}

export interface BorderRadius {
    none: string;
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
}

export interface BoxShadow {
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    gold: string;
    'gold-sm': string;
    none: string;
}

export interface Transition {
    DEFAULT: string;
    fast: string;
    slow: string;
}

export interface ZIndex {
    0: string;
    10: string;
    20: string;
    30: string;
    40: string;
    50: string;
    auto: string;
}

export interface Theme {
    colors: {
        light: ThemeColors;
        dark: ThemeColors;
    };
    typography: Typography;
    spacing: Spacing;
    borderRadius: BorderRadius;
    boxShadow: BoxShadow;
    transition: Transition;
    zIndex: ZIndex;
}

export interface CurrentTheme extends Omit<Theme, 'colors'> {
    colors: ThemeColors;
    isDark: boolean;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
    theme: CurrentTheme;
    darkMode: boolean;
    toggleDarkMode: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    getColor: (colorPath: string) => string | null;
}

export interface ThemeProviderProps {
    children: ReactNode;
}

// Create context
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Provider component
export function ThemeProvider({ children }: ThemeProviderProps) {
    const [darkMode, setDarkMode] = useState<boolean>(false);

    // Get current theme values based on mode
    const currentTheme = useMemo((): CurrentTheme => {
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
    const setThemeMode = useCallback((mode: ThemeMode) => {
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
    const getColor = useCallback((colorPath: string): string | null => {
        if (!colorPath) return null;

        const parts = colorPath.split('.');
        let colorValue: any = currentTheme.colors;

        for (const part of parts) {
            if (colorValue[part] === undefined) {
                return null;
            }
            colorValue = colorValue[part];
        }

        return typeof colorValue === 'string' ? colorValue : null;
    }, [currentTheme]);

    const value: ThemeContextValue = useMemo(() => ({
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
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}