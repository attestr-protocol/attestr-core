// components/molecules/notifications/ErrorNotification.js
import React, { useEffect } from 'react';
import { XCircleIcon, XIcon, ExclamationIcon, InformationCircleIcon } from '@heroicons/react/outline';

/**
 * Error notification component
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {string} props.type - Error type: 'user-rejected', 'network', 'generic'
 * @param {boolean} props.show - Whether to show the notification
 * @param {Function} props.onDismiss - Function to call when notification is dismissed
 * @param {number} props.autoHideDelay - Delay in ms before auto-hiding notification (0 = no auto-hide)
 */
const ErrorNotification = ({
    message,
    type = 'generic',
    show = false,
    onDismiss,
    autoHideDelay = 5000,
    className = '',
    ...props
}) => {
    // Auto-hide notification after specified delay
    useEffect(() => {
        if (show && autoHideDelay > 0) {
            const timer = setTimeout(() => {
                if (onDismiss) {
                    onDismiss();
                }
            }, autoHideDelay);

            return () => clearTimeout(timer);
        }
    }, [show, autoHideDelay, onDismiss]);

    if (!show) {
        return null;
    }

    // Get icon and styling based on error type
    const getTypeConfig = () => {
        switch (type) {
            case 'user-rejected':
                return {
                    icon: InformationCircleIcon,
                    bgColor: 'bg-blue-50 dark:bg-blue-900',
                    borderColor: 'border-blue-400 dark:border-blue-700',
                    textColor: 'text-blue-700 dark:text-blue-200',
                    title: 'Connection Cancelled',
                };
            case 'network':
                return {
                    icon: ExclamationIcon,
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900',
                    borderColor: 'border-yellow-400 dark:border-yellow-700',
                    textColor: 'text-yellow-700 dark:text-yellow-200',
                    title: 'Network Issue',
                };
            case 'generic':
            default:
                return {
                    icon: XCircleIcon,
                    bgColor: 'bg-red-50 dark:bg-red-900',
                    borderColor: 'border-red-400 dark:border-red-700',
                    textColor: 'text-red-700 dark:text-red-200',
                    title: 'Error',
                };
        }
    };

    const config = getTypeConfig();
    const Icon = config.icon;

    const notificationClasses = [
        'fixed bottom-6 right-6 p-4 rounded-lg shadow-lg border',
        'transition-opacity duration-300 ease-in-out',
        config.bgColor,
        config.borderColor,
        config.textColor,
        className
    ].join(' ');

    return (
        <div className={notificationClasses} role="alert" {...props}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium">{config.title}</h3>
                    <div className="mt-1 text-sm">
                        <p>{message}</p>
                    </div>

                    {type === 'network' && (
                        <div className="mt-2">
                            <button
                                type="button"
                                className="text-sm font-medium underline hover:text-opacity-75 focus:outline-none"
                                onClick={() => {
                                    if (window.ethereum) {
                                        window.ethereum.request({
                                            method: 'wallet_switchEthereumChain',
                                            params: [{ chainId: '0x13881' }], // Mumbai chainId in hex
                                        }).catch(console.error);
                                    }
                                    if (onDismiss) {
                                        onDismiss();
                                    }
                                }}
                            >
                                Switch to Mumbai
                            </button>
                        </div>
                    )}
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.textColor} hover:bg-opacity-20 focus:ring-offset-${config.bgColor}`}
                            onClick={onDismiss}
                        >
                            <span className="sr-only">Dismiss</span>
                            <XIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorNotification;