// components/atoms/inputs/Checkbox.js
import React from 'react';

/**
 * Checkbox component
 * 
 * @param {Object} props
 * @param {string} props.id - Input id
 * @param {string} props.name - Input name
 * @param {boolean} props.checked - Whether the checkbox is checked
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Label text
 * @param {boolean} props.required - Whether the input is required
 */
const Checkbox = ({
    id,
    name,
    checked,
    onChange,
    label,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className="flex items-center">
            <input
                id={id}
                name={name}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                required={required}
                className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${className}`}
                {...props}
            />
            {label && (
                <label
                    htmlFor={id}
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
        </div>
    );
};

export default Checkbox;