// components/atoms/buttons/Button.js
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Enhanced button component with variants
 * 
 * @param {Object} props
 * @param {string} props.variant - 'primary', 'secondary', 'outline', 'ghost', 'danger', 'success'
 * @param {string} props.size - 'sm', 'md' (default), 'lg'
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.isLoading - Whether to show loading state
 * @param {React.ReactNode} props.startIcon - Icon component to display before text
 * @param {React.ReactNode} props.endIcon - Icon component to display after text
 */
const Button = ({
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
    const sizeClasses = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    // Variant classes (already defined in globals.css)
    const variantClasses = {
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