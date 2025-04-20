// components/atoms/display/Badge.js
import React from 'react';

/**
 * Badge component for status indicators
 * 
 * @param {Object} props
 * @param {string} props.variant - 'success', 'warning', 'error', 'info'
 * @param {string} props.text - Badge text
 */
const Badge = ({
    variant = 'info',
    text,
    className = '',
    ...props
}) => {
    const variantClasses = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        primary: 'bg-primary-light text-primary-dark dark:bg-primary-dark dark:text-primary-light',
    };

    const badgeClasses = [
        'px-2 py-1 rounded-full text-sm font-medium inline-flex items-center',
        variantClasses[variant] || variantClasses.info,
        className
    ].join(' ');

    return (
        <span className={badgeClasses} {...props}>
            {text}
        </span>
    );
};

export default Badge;

