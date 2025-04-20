// 
import React from 'react';

/**
 * Form field component with label and help text
 * 
 * @param {Object} props
 * @param {string} props.id - Field id
 * @param {string} props.label - Field label
 * @param {React.ReactNode} props.children - Form control
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.helpText - Help text for the field
 * @param {string} props.error - Error message
 */
const FormField = ({
    id,
    label,
    children,
    required = false,
    helpText,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col ${className}`} {...props}>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {children}

            {helpText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;

