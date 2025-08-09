// components/atoms/inputs/Select.tsx
import React, { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Select id */
  id: string;
  /** Select name */
  name: string;
  /** Selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Options to display */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Help text */
  helpText?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  required = false,
  error = '',
  className = '',
  helpText,
  ...props
}) => {
  // Base select classes
  const baseClasses = 'w-full px-4 py-2 border rounded-md bg-white dark:bg-dark-light text-gray-900 dark:text-white focus:outline-none focus:ring-2';

  // Error classes
  const errorClasses = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-300 dark:border-gray-600 focus:ring-primary';

  // Combine all classes
  const selectClasses = [
    baseClasses,
    errorClasses,
    className
  ].join(' ');

  return (
    <div className="w-full">
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;