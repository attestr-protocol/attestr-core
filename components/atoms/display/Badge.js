// components/atoms/display/Badge.js
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Enhanced Badge component for status indicators
 * 
 * @param {Object} props
 * @param {string} props.variant - 'primary', 'secondary', 'success', 'warning', 'error', 'info'
 * @param {string} props.text - Badge text
 * @param {boolean} props.dot - Whether to show a dot indicator
 * @param {string} props.size - 'sm', 'md' (default), 'lg'
 */
const Badge = ({
    variant = 'primary',
    text,
    dot = false,
    size = 'md',
    className = '',
    ...props
}) => {
    const { darkMode } = useTheme();

    // Variant classes
    const variantClasses = {
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
    };

    // Size classes
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1',
    };

    // Badge classes
    const badgeClasses = [
        'badge',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={badgeClasses} {...props}>
            {dot && (
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full status-dot-${variant}`} />
            )}
            {text}
        </span>
    );
};

export default Badge;