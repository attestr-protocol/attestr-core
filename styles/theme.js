// styles/theme.js
const theme = {
    // Color palette
    colors: {
        // Light mode
        light: {
            primary: {
                DEFAULT: '#3b82f6', // Vibrant blue - primary action
                light: '#93c5fd',   // Lighter blue for highlights
                dark: '#1d4ed8',    // Darker blue for hover states
            },
            secondary: {
                DEFAULT: '#f59e0b', // Rich amber for accents
                light: '#fcd34d',   // Light amber for highlights
                dark: '#d97706',    // Dark amber for hover states
            },
            background: {
                DEFAULT: '#f8fafc', // Near white background
                secondary: '#f1f5f9', // Light gray for cards, inputs, etc.
                tertiary: '#e2e8f0', // Slightly darker for hover states
            },
            text: {
                primary: '#0f172a',  // Near black for primary text
                secondary: '#334155', // Medium gray for secondary text
                tertiary: '#64748b', // Light gray for disabled/hint text
                inverse: '#f8fafc',  // White text for dark backgrounds
            },
            border: {
                DEFAULT: '#e2e8f0', // Light gray for borders
                focus: '#3b82f6',   // Primary color for focus states
            },
            success: {
                DEFAULT: '#10b981', // Green
                light: '#d1fae5',   // Light green background
                dark: '#059669',    // Dark green
            },
            warning: {
                DEFAULT: '#f59e0b', // Amber
                light: '#fef3c7',   // Light amber background
                dark: '#d97706',    // Dark amber
            },
            error: {
                DEFAULT: '#ef4444', // Red
                light: '#fee2e2',   // Light red background
                dark: '#dc2626',    // Dark red
            },
            info: {
                DEFAULT: '#3b82f6', // Blue
                light: '#dbeafe',   // Light blue background
                dark: '#2563eb',    // Dark blue
            },
            accent: {
                gold: '#fbbf24',    // Gold accent
                purple: '#8b5cf6',  // Purple accent
                teal: '#14b8a6',    // Teal accent
            }
        },

        // Dark mode
        dark: {
            primary: {
                DEFAULT: '#60a5fa', // Brighter blue for dark mode
                light: '#93c5fd',   // Lighter blue for highlights
                dark: '#3b82f6',    // Mid blue for hover states
            },
            secondary: {
                DEFAULT: '#fbbf24',  // Brighter amber for dark mode
                light: '#fcd34d',    // Light amber for highlights
                dark: '#f59e0b',     // Mid amber for hover states
            },
            background: {
                DEFAULT: '#0f172a',   // Deep blue-gray background
                secondary: '#1e293b', // Lighter blue-gray for cards
                tertiary: '#334155',  // Medium blue-gray for hover states
            },
            text: {
                primary: '#f8fafc',   // Near white for primary text
                secondary: '#e2e8f0', // Light gray for secondary text
                tertiary: '#94a3b8',  // Medium gray for disabled/hint text
                inverse: '#0f172a',   // Dark text for light backgrounds
            },
            border: {
                DEFAULT: '#334155',   // Medium blue-gray for borders
                focus: '#60a5fa',     // Primary color for focus states
            },
            success: {
                DEFAULT: '#10b981',   // Green
                light: '#065f46',     // Dark green background
                dark: '#34d399',      // Light green for text
            },
            warning: {
                DEFAULT: '#f59e0b',   // Amber
                light: '#78350f',     // Dark amber background
                dark: '#fbbf24',      // Light amber for text
            },
            error: {
                DEFAULT: '#ef4444',   // Red
                light: '#7f1d1d',     // Dark red background
                dark: '#fca5a5',      // Light red for text
            },
            info: {
                DEFAULT: '#60a5fa',   // Blue
                light: '#1e3a8a',     // Dark blue background
                dark: '#93c5fd',      // Light blue for text
            },
            accent: {
                gold: '#fcd34d',      // Brighter gold for dark mode
                purple: '#a78bfa',    // Brighter purple for dark mode
                teal: '#2dd4bf',      // Brighter teal for dark mode
            }
        },
    },

    // Typography
    typography: {
        fontFamily: {
            sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
        lineHeight: {
            none: '1',
            tight: '1.25',
            normal: '1.5',
            relaxed: '1.75',
        },
    },

    // Spacing
    spacing: {
        px: '1px',
        0: '0',
        0.5: '0.125rem',
        1: '0.25rem',
        1.5: '0.375rem',
        2: '0.5rem',
        2.5: '0.625rem',
        3: '0.75rem',
        3.5: '0.875rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
        40: '10rem',
        48: '12rem',
        56: '14rem',
        64: '16rem',
    },

    // Border radius
    borderRadius: {
        none: '0',
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
    },

    // Box shadow
    boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        gold: '0 10px 25px -5px rgba(251, 191, 36, 0.2)',
        'gold-sm': '0 4px 6px -1px rgba(251, 191, 36, 0.1), 0 2px 4px -1px rgba(251, 191, 36, 0.06)',
        none: 'none',
    },

    // Transition
    transition: {
        DEFAULT: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Z-index
    zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        auto: 'auto',
    },
};

export default theme; 