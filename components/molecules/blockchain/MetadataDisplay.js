// components/molecules/blockchain/MetadataDisplay.js
import React from 'react';

/**
 * Component to display certificate metadata
 * 
 * @param {Object} props
 * @param {Object} props.metadata - Certificate metadata
 */
const MetadataDisplay = ({
    metadata,
    className = '',
    ...props
}) => {
    if (!metadata || Object.keys(metadata).length === 0) {
        return null;
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) {
            return 'N/A';
        }
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className={className} {...props}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metadata.credential && (
                    <>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Title
                            </h3>
                            <p className="text-xl font-medium">
                                {metadata.credential.title || 'Untitled Certificate'}
                            </p>
                        </div>

                        {metadata.credential.description && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Description
                                </h3>
                                <p className="text-lg">
                                    {metadata.credential.description}
                                </p>
                            </div>
                        )}

                        {metadata.credential.issueDate && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Issue Date
                                </h3>
                                <p className="text-lg">
                                    {formatDate(metadata.credential.issueDate)}
                                </p>
                            </div>
                        )}

                        {metadata.credential.expiryDate && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Expiry Date
                                </h3>
                                <p className="text-lg">
                                    {formatDate(metadata.credential.expiryDate)}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {metadata.recipient && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Recipient
                        </h3>
                        <p className="text-xl font-medium">
                            {metadata.recipient.name || 'Unnamed Recipient'}
                        </p>
                        {metadata.recipient.wallet && (
                            <p className="text-sm font-mono text-gray-500 mt-1">
                                {metadata.recipient.wallet}
                            </p>
                        )}
                    </div>
                )}

                {metadata.issuer && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Issuer
                        </h3>
                        <p className="text-xl font-medium">
                            {metadata.issuer.name || 'Unnamed Issuer'}
                        </p>
                        {metadata.issuer.website && (
                            <a
                                href={metadata.issuer.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {metadata.issuer.website}
                            </a>
                        )}
                        {metadata.issuer.wallet && (
                            <p className="text-sm font-mono text-gray-500 mt-1">
                                {metadata.issuer.wallet}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Additional metadata if available */}
            {metadata.additional && Object.keys(metadata.additional).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(metadata.additional).map(([key, value]) => (
                            <div key={key}>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                </h4>
                                <p>{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetadataDisplay;

