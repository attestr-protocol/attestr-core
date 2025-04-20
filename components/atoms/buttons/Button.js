import React from 'react';

/**
 * Basic button component with variants
 * 
 * @param {Object} props
 * @param {string} props.variant - 'primary', 'secondary', or any custom variant
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const Button = ({
    children,
    variant = 'primary',
    fullWidth = false,
    disabled = false,
    className = '',
    ...props
}) => {
    // Base button classes
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';

    // Variant-specific classes
    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-secondary text-dark hover:bg-secondary-dark',
        outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light',
    };

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    // Disabled classes
    const disabledClasses = disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer';

    // Combine all classes
    const btnClasses = [
        baseClasses,
        variantClasses[variant] || variantClasses.primary,
        widthClasses,
        disabledClasses,
        className
    ].join(' ');

    return (
        <button
            className={btnClasses}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;

