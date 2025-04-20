// components/atoms/inputs/DateInput.js
import React from 'react';

/**
 * Date input component
 * 
 * @param {Object} props
 * @param {string} props.id - Input id
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Whether the input is required
 * @param {string} props.error - Error message
 */
const DateInput = ({
    id,
    name,
    value,
    onChange,
    required = false,
    error = '',
    className = '',
    ...props
}) => {
    // Base input classes
    const baseClasses = 'w-full px-4 py-2 border rounded-md bg-white dark:bg-dark-light text-gray-900 dark:text-white focus:outline-none focus:ring-2';

    // Error classes
    const errorClasses = error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:ring-primary';

    // Combine all classes
    const inputClasses = [
        baseClasses,
        errorClasses,
        className
    ].join(' ');

    return (
        <div className="w-full">
            <input
                id={id}
                name={name}
                type="date"
                value={value}
                onChange={onChange}
                required={required}
                className={inputClasses}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default DateInput;

