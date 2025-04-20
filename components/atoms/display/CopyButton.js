// components/atoms/display/CopyButton.js
import React, { useState } from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/outline';

/**
 * Button to copy text to clipboard
 * 
 * @param {Object} props
 * @param {string} props.text - Text to copy
 * @param {string} props.successMessage - Message to show on successful copy
 */
const CopyButton = ({
    text,
    successMessage = 'Copied!',
    className = '',
    ...props
}) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (!text) {
            return;
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const buttonClasses = [
        'p-2 rounded transition-colors',
        copied
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-light',
        className
    ].join(' ');

    return (
        <button
            onClick={copyToClipboard}
            className={buttonClasses}
            title={copied ? successMessage : 'Copy to clipboard'}
            {...props}
        >
            <DocumentDuplicateIcon className="h-5 w-5" />
        </button>
    );
};

export default CopyButton;