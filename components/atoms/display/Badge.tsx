// components/atoms/display/Badge.tsx
import React, { HTMLAttributes, ReactNode } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'cyan' | 'indigo' | 'gray';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant styling */
  variant?: BadgeVariant;
  /** Badge text or content */
  text?: ReactNode;
  /** Badge content as children */
  children?: ReactNode;
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Badge size */
  size?: BadgeSize;
  /** Additional CSS classes */
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    variant = 'primary',
    text,
    children,
    dot = false,
    size = 'md',
    className = '',
    ...props
}) => {
    const { darkMode } = useTheme();

    // Variant classes
    const variantClasses: Record<BadgeVariant, string> = {
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
        indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    // Size classes
    const sizeClasses: Record<BadgeSize, string> = {
        xs: 'text-xs px-1.5 py-0.5',
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
            {text || children}
        </span>
    );
};

export default Badge;