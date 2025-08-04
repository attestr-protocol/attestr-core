// components/atoms/inputs/DateInput.tsx
import React, { InputHTMLAttributes, ChangeEvent } from 'react';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Input id */
  id: string;
  /** Input name */
  name: string;
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Whether the input is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({
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

