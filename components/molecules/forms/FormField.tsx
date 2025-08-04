// components/molecules/forms/FormField.tsx
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

type LabelSize = 'sm' | 'md' | 'lg';

interface FormFieldProps {
    /** Field id */
    id?: string;
    /** Field label */
    label?: string;
    /** Form control */
    children?: React.ReactNode;
    /** Whether the field is required */
    required?: boolean;
    /** Help text for the field */
    helpText?: string;
    /** Error message */
    error?: string;
    /** Label size */
    labelSize?: LabelSize;
    /** Additional CSS classes */
    className?: string;
    /** Additional props */
    [key: string]: any;
}

/**
 * Enhanced form field component with label and help text
 */
const FormField: React.FC<FormFieldProps> = ({
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