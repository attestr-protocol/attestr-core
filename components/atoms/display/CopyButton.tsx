// components/atoms/display/CopyButton.tsx
import React, { useState, ButtonHTMLAttributes } from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/outline';

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Text to copy */
  text: string;
  /** Message to show on successful copy */
  successMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
    text,
    successMessage = 'Copied!',
    className = '',
    ...props
}) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (): void => {
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