// components/atoms/inputs/TextInput.tsx
import React, { InputHTMLAttributes, ReactNode } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Input id */
  id: string;
  /** Input name */
  name: string;
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'datetime-local' | 'date' | 'time';
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Icon to display at the start of the input */
  startIcon?: ReactNode;
  /** Icon to display at the end of the input */
  endIcon?: ReactNode;
  /** Input label */
  label?: string;
  /** Help text */
  helpText?: string;
  /** onBlur handler */
  onBlur?: () => void;
  /** Min value for number inputs */
  min?: number | string;
  /** Max value for number inputs */
  max?: number | string;
  /** Step value for number inputs */
  step?: number | string;
}

const TextInput: React.FC<TextInputProps> = ({
    id,
    name,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    required = false,
    error = '',
    className = '',
    startIcon,
    endIcon,
    label,
    helpText,
    onBlur,
    min,
    max,
    step,
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
        <div className={`w-full ${className}`}>
            {label && (
                <label 
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="relative">
                {startIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        {startIcon}
                    </div>
                )}
                
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    max={max}
                    step={step}
                    className={inputClasses}
                    {...props}
                />
                
                {endIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                        {endIcon}
                    </div>
                )}
            </div>
            
            {helpText && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helpText}</p>
            )}
            
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default TextInput;

