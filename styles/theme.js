// styles/theme.js
const theme = {
    // Color palette
    colors: {
        // Light mode
        light: {
            primary: {
                DEFAULT: '#2563EB', // Rich blue - primary action
                light: '#60A5FA',   // Lighter blue for highlights
                dark: '#1D4ED8',    // Darker blue for hover states
            },
            secondary: {
                DEFAULT: '#F59E0B', // Warm amber for secondary actions
                light: '#FCD34D',   // Light amber for highlights
                dark: '#D97706',    // Dark amber for hover states
            },
            background: {
                DEFAULT: '#FFFFFF', // Pure white background
                secondary: '#F9FAFB', // Light gray for cards, inputs, etc.
                tertiary: '#F3F4F6', // Slightly darker for hover states
            },
            text: {
                primary: '#111827',  // Near black for primary text
                secondary: '#4B5563', // Medium gray for secondary text
                tertiary: '#9CA3AF', // Light gray for disabled/hint text
                inverse: '#FFFFFF',  // White text for dark backgrounds
            },
            border: {
                DEFAULT: '#E5E7EB', // Light gray for borders
                focus: '#2563EB',   // Primary color for focus states
            },
            success: {
                DEFAULT: '#10B981', // Green
                light: '#D1FAE5',   // Light green background
                dark: '#059669',    // Dark green
            },
            warning: {
                DEFAULT: '#F59E0B', // Amber
                light: '#FEF3C7',   // Light amber background
                dark: '#D97706',    // Dark amber
            },
            error: {
                DEFAULT: '#EF4444', // Red
                light: '#FEE2E2',   // Light red background
                dark: '#DC2626',    // Dark red
            },
            info: {
                DEFAULT: '#3B82F6', // Blue
                light: '#DBEAFE',   // Light blue background
                dark: '#2563EB',    // Dark blue
            },
        },

        // Dark mode
        dark: {
            primary: {
                DEFAULT: '#3B82F6', // Medium blue - primary action
                light: '#93C5FD',   // Lighter blue for highlights
                dark: '#1D4ED8',    // Darker blue for hover states
            },
            secondary: {
                DEFAULT: '#EAB308',  // Amber for secondary actions
                light: '#FDE68A',    // Light amber for highlights
                dark: '#CA8A04',     // Dark amber for hover states
            },
            background: {
                DEFAULT: '#0F172A',   // Dark blue-gray background
                secondary: '#1E293B', // Lighter blue-gray for cards
                tertiary: '#334155',  // Medium blue-gray for hover states
            },
            text: {
                primary: '#F9FAFB',   // Nearly white for primary text
                secondary: '#E5E7EB', // Light gray for secondary text
                tertiary: '#9CA3AF',  // Medium gray for disabled/hint text
                inverse: '#111827',   // Dark text for light backgrounds
            },
            border: {
                DEFAULT: '#334155',   // Medium blue-gray for borders
                focus: '#3B82F6',     // Primary color for focus states
            },
            success: {
                DEFAULT: '#10B981',   // Green
                light: '#065F46',     // Dark green background
                dark: '#34D399',      // Light green for text
            },
            warning: {
                DEFAULT: '#F59E0B',   // Amber
                light: '#78350F',     // Dark amber background
                dark: '#FBBF24',      // Light amber for text
            },
            error: {
                DEFAULT: '#EF4444',   // Red
                light: '#7F1D1D',     // Dark red background
                dark: '#FCA5A5',      // Light red for text
            },
            info: {
                DEFAULT: '#3B82F6',   // Blue
                light: '#1E3A8A',     // Dark blue background
                dark: '#93C5FD',      // Light blue for text
            },
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
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
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