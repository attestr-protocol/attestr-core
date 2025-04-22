// components/molecules/cards/Card.js
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Generic card component with various styling options
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - 'default', 'flat', 'outline', 'colored'
 * @param {string} props.color - 'primary', 'secondary', 'success', 'warning', 'error', 'info'
 * @param {boolean} props.hover - Whether to add hover effect
 * @param {string} props.padding - 'none', 'sm', 'md' (default), 'lg'
 */
const Card = ({
    children,
    variant = 'default',
    color = 'primary',
    hover = true,
    padding = 'md',
    className = '',
    ...props
}) => {
    const { darkMode } = useTheme();

    // Base styles always applied
    const baseStyles = 'rounded-lg transition-all';

    // Variant specific styles
    const variantStyles = {
        default: 'bg-white dark:bg-dark-light shadow-md',
        flat: 'bg-white dark:bg-dark-light',
        outline: 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-light',
        colored: `bg-${color}-light dark:bg-${color}-light bg-opacity-10 dark:bg-opacity-10`,
    };

    // Hover effects
    const hoverStyles = hover ? {
        default: 'hover:shadow-lg',
        flat: 'hover:bg-gray-50 dark:hover:bg-dark-dark',
        outline: 'hover:border-gray-300 dark:hover:border-gray-600',
        colored: `hover:bg-${color}-light hover:bg-opacity-20 dark:hover:bg-opacity-20`,
    } : {};

    // Padding options
    const paddingStyles = {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };

    const cardClasses = [
        baseStyles,
        variantStyles[variant] || variantStyles.default,
        hover ? hoverStyles[variant] || '' : '',
        paddingStyles[padding] || paddingStyles.md,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={cardClasses} {...props}>
            {children}
        </div>
    );
};

export default Card;