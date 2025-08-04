// components/atoms/buttons/Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant styling */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  isLoading?: boolean;
  /** Icon component to display before text */
  startIcon?: ReactNode;
  /** Icon component to display after text */
  endIcon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Button content */
  children?: ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    isLoading = false,
    startIcon = null,
    endIcon = null,
    className = '',
    ...props
}) => {
    const { darkMode } = useTheme();

    // Size classes
    const sizeClasses: Record<ButtonSize, string> = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    // Variant classes (already defined in globals.css)
    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
        success: 'btn-success',
    };

    // Width classes
    const widthClass = fullWidth ? 'w-full' : '';

    // Combine all classes
    const buttonClasses = [
        'btn',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || '',
        widthClass,
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={buttonClasses}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className="spinner mr-2" aria-hidden="true"></span>
            )}

            {!isLoading && startIcon && (
                <span className="mr-2">{startIcon}</span>
            )}

            {children}

            {!isLoading && endIcon && (
                <span className="ml-2">{endIcon}</span>
            )}
        </button>
    );
};

export default Button;