/** @type {import('tailwindcss').Config} */
const theme = require('./styles/theme').default;

module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors (default)
        primary: {
          DEFAULT: theme.colors.light.primary.DEFAULT,
          light: theme.colors.light.primary.light,
          dark: theme.colors.light.primary.dark,
        },
        secondary: {
          DEFAULT: theme.colors.light.secondary.DEFAULT,
          light: theme.colors.light.secondary.light,
          dark: theme.colors.light.secondary.dark,
        },
        success: {
          DEFAULT: theme.colors.light.success.DEFAULT,
          light: theme.colors.light.success.light,
          dark: theme.colors.light.success.dark,
        },
        error: {
          DEFAULT: theme.colors.light.error.DEFAULT,
          light: theme.colors.light.error.light,
          dark: theme.colors.light.error.dark,
        },
        warning: {
          DEFAULT: theme.colors.light.warning.DEFAULT,
          light: theme.colors.light.warning.light,
          dark: theme.colors.light.warning.dark,
        },
        info: {
          DEFAULT: theme.colors.light.info.DEFAULT,
          light: theme.colors.light.info.light,
          dark: theme.colors.light.info.dark,
        },
        // Dark mode specific
        dark: {
          DEFAULT: theme.colors.dark.background.DEFAULT,
          light: theme.colors.dark.background.secondary,
          dark: theme.colors.dark.background.tertiary,
        },
      },
      fontFamily: {
        sans: theme.typography.fontFamily.sans.split(', '),
        mono: theme.typography.fontFamily.mono.split(', '),
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      lineHeight: theme.typography.lineHeight,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      boxShadow: theme.boxShadow,
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      backgroundColor: ['active', 'disabled'],
      textColor: ['active', 'disabled'],
      borderColor: ['active', 'focus', 'disabled'],
      ringColor: ['hover', 'active'],
      ringWidth: ['hover', 'active'],
    },
  },
  plugins: [],
}