// components/molecules/forms/FormField.js
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Enhanced form field component with label and help text
 * 
 * @param {Object} props
 * @param {string} props.id - Field id
 * @param {string} props.label - Field label
 * @param {React.ReactNode} props.children - Form control
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.helpText - Help text for the field
 * @param {string} props.error - Error message
 * @param {string} props.labelSize - 'sm', 'md' (default), 'lg'
 */
const FormField = ({
    id,
    label,
    children,
    required = false,
    helpText,
    error,
    labelSize = 'md',
    className = '',
    ...props
}) => {
    const { darkMode } = useTheme();

    // Label size classes
    const labelSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <div className={`mb-4 ${className}`} {...props}>
            {label && (
                <label
                    htmlFor={id}
                    className={`block ${labelSizeClasses[labelSize] || labelSizeClasses.md} font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {label}
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            {children}

            {helpText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}

            {error && (
                <p className="mt-1 text-sm text-error">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;