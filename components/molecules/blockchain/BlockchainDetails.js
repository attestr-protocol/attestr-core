// components/molecules/blockchain/BlockchainDetails.js
import React from 'react';
import Address from '../../atoms/display/Address';

/**
 * Component to display certificate blockchain details
 * 
 * @param {Object} props
 * @param {string} props.certificateId - Certificate ID
 * @param {string} props.issuerAddress - Issuer address
 * @param {string} props.recipientAddress - Recipient address
 * @param {string} props.metadataURI - IPFS metadata URI
 * @param {string} props.transactionHash - Transaction hash
 */
const BlockchainDetails = ({
    certificateId,
    issuerAddress,
    recipientAddress,
    metadataURI,
    transactionHash,
    className = '',
    ...props
}) => {
    return (
        <div className={className} {...props}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificateId && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Certificate ID
                        </h4>
                        <p className="text-sm font-mono break-all">{certificateId}</p>
                    </div>
                )}

                {transactionHash && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Transaction Hash
                        </h4>
                        <p className="text-sm font-mono break-all">{transactionHash}</p>
                    </div>
                )}

                {issuerAddress && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Issuer Address
                        </h4>
                        <p className="text-sm font-mono break-all">{issuerAddress}</p>
                    </div>
                )}

                {recipientAddress && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Recipient Address
                        </h4>
                        <p className="text-sm font-mono break-all">{recipientAddress}</p>
                    </div>
                )}

                {metadataURI && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Metadata URI
                        </h4>
                        <p className="text-sm font-mono break-all">{metadataURI}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockchainDetails;