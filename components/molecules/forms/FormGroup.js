// components/molecules/forms/FormGroup.js
import React from 'react';

/**
 * Enhanced form group component to organize form fields
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form fields
 * @param {number} props.columns - Number of columns in the grid (1-4)
 * @param {string} props.title - Optional group title
 * @param {string} props.description - Optional group description
 * @param {boolean} props.divider - Whether to show a divider at the bottom
 */
const FormGroup = ({
    children,
    columns = 1,
    title = '',
    description = '',
    divider = false,
    className = '',
    ...props
}) => {
    // Column grid classes
    const colClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    const gridClass = colClasses[columns] || colClasses[1];

    const hasHeader = title || description;

    return (
        <div className={`mb-8 ${divider ? 'pb-8 border-b border-gray-200 dark:border-gray-700' : ''} ${className}`} {...props}>
            {hasHeader && (
                <div className="mb-6">
                    {title && (
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div className={`grid ${gridClass} gap-x-6 gap-y-4`}>
                {children}
            </div>
        </div>
    );
};

export default FormGroup;