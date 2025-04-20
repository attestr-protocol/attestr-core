// components/molecules/forms/FormGroup.js
import React from 'react';

/**
 * Form group component to wrap form fields
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form fields
 */
const FormGroup = ({
    children,
    columns = 1,
    className = '',
    ...props
}) => {
    const colClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    const formGroupClasses = [
        'grid',
        colClasses[columns] || colClasses[1],
        'gap-6',
        className
    ].join(' ');

    return (
        <div className={formGroupClasses} {...props}>
            {children}
        </div>
    );
};

export default FormGroup;

