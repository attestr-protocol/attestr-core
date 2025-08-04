// components/atoms/display/Badge.tsx
import React, { HTMLAttributes, ReactNode } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant styling */
  variant?: BadgeVariant;
  /** Badge text or content */
  text: ReactNode;
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
    };

    // Size classes
    const sizeClasses: Record<BadgeSize, string> = {
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