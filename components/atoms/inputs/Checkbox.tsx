// components/atoms/inputs/Checkbox.tsx
import React, { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Input id */
  id: string;
  /** Input name */
  name: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Help text */
  helpText?: string;
  /** Error message */
  error?: string;
  /** onBlur handler */
  onBlur?: () => void;
}

const Checkbox: React.FC<CheckboxProps> = ({
    id,
    name,
    checked,
    onChange,
    label,
    required = false,
    className = '',
    helpText,
    error,
    onBlur,
    ...props
}) => {
    return (
        <div className={`${className}`}>
            <div className="flex items-center">
                <input
                    id={id}
                    name={name}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    onBlur={onBlur}
                    required={required}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
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
            
            {helpText && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helpText}</p>
            )}
            
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Checkbox;