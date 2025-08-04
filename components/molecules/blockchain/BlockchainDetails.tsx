// components/molecules/blockchain/BlockchainDetails.tsx
import React, { HTMLAttributes } from 'react';
import Address from '../../atoms/display/Address';

interface BlockchainDetailsProps extends HTMLAttributes<HTMLDivElement> {
  /** Certificate ID */
  certificateId?: string;
  /** Issuer address */
  issuerAddress?: string;
  /** Recipient address */
  recipientAddress?: string;
  /** IPFS metadata URI */
  metadataURI?: string;
  /** Transaction hash */
  transactionHash?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component to display certificate blockchain details
 */
const BlockchainDetails: React.FC<BlockchainDetailsProps> = ({
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