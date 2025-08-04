// components/atoms/inputs/Checkbox.tsx
import React, { InputHTMLAttributes, ChangeEvent } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Input id */
  id: string;
  /** Input name */
  name: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Change handler */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Label text */
  label?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
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