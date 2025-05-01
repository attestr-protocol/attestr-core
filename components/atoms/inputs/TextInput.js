// components/atoms/inputs/TextInput.js
import React from 'react';

/**
 * Text input component
 * 
 * @param {Object} props
 * @param {string} props.id - Input id
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether the input is required
 * @param {string} props.error - Error message
 * @param {React.ReactNode} props.startIcon - Icon to display at the start of the input
 * @param {React.ReactNode} props.endIcon - Icon to display at the end of the input
 */
const TextInput = ({
    id,
    name,
    value,
    onChange,
    placeholder = '',
    required = false,
    error = '',
    className = '',
    startIcon,
    endIcon,
    ...props
}) => {
    // Base input classes
    const baseClasses = 'w-full px-4 py-2 border rounded-md bg-white dark:bg-dark-light text-gray-900 dark:text-white focus:outline-none focus:ring-2';

    // Error classes
    const errorClasses = error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:ring-primary';

    // Add padding for icons
    const paddingClasses = startIcon 
        ? 'pl-10' 
        : endIcon 
            ? 'pr-10' 
            : '';

    // Combine all classes
    const inputClasses = [
        baseClasses,
        errorClasses,
        paddingClasses,
        className
    ].join(' ');

    return (
        <div className="w-full relative">
            {startIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    {startIcon}
                </div>
            )}
            
            <input
                id={id}
                name={name}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={inputClasses}
                {...props}
            />
            
            {endIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                    {endIcon}
                </div>
            )}
            
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default TextInput;

