// components/molecules/cards/StatusCard.tsx
import React from 'react';
import Status from '../../atoms/display/Status';

type CertificateStatus = 'valid' | 'invalid' | 'expired' | 'revoked';

interface StatusCardProps {
    /** Certificate status */
    status?: CertificateStatus;
    /** Card title */
    title?: string;
    /** Status message */
    message?: string;
    /** Additional CSS classes */
    className?: string;
    /** Additional props */
    [key: string]: any;
}

/**
 * Status card displaying certificate validation status
 */
const StatusCard: React.FC<StatusCardProps> = ({
    status = 'valid',
    title,
    message,
    className = '',
    ...props
}) => {
    const statusConfig = {
        valid: {
            border: 'border-green-500',
            title: title || 'Certificate Verified',
            message: message || 'This certificate has been verified as authentic on the blockchain.',
        },
        invalid: {
            border: 'border-red-500',
            title: title || 'Certificate Invalid',
            message: message || 'We could not verify this certificate on the blockchain.',
        },
        expired: {
            border: 'border-yellow-500',
            title: title || 'Certificate Expired',
            message: message || 'This certificate is authentic but has expired.',
        },
        revoked: {
            border: 'border-red-500',
            title: title || 'Certificate Revoked',
            message: message || 'This certificate has been revoked by the issuer.',
        },
    };

    const config = statusConfig[status] || statusConfig.valid;

    const cardClasses = [
        'card max-w-3xl mx-auto border-2',
        config.border,
        className
    ].join(' ');

    return (
        <div className={cardClasses} {...props}>
            <div className="flex items-center mb-4">
                <Status status={status} className="mr-3" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {config.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        {config.message}
                    </p>
                </div>
            </div>
            {props.children}
        </div>
    );
};

export default StatusCard;

