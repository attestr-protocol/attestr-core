// components/templates/IssueCertificateTemplate.js
import React from 'react';
import CertificateForm from '../organisms/certificate/CertificateForm';
import WalletConnect from '../organisms/wallet/WalletConnect';

/**
 * Template for the issue certificate page
 */
const IssueCertificateTemplate = ({
    address,
    isSubmitting = false,
    onWalletConnect,
    onWalletDisconnect,
    onSubmit,
    className = '',
    ...props
}) => {
    return (
        <div className={className} {...props}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Issue New Certificate</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Create and issue a new blockchain-verified credential for an individual.
                </p>
            </div>

            {address ? (
                <div className="card max-w-3xl mx-auto">
                    <CertificateForm
                        onSubmit={onSubmit}
                        isSubmitting={isSubmitting}
                    />
                </div>
            ) : (
                <WalletConnect
                    onConnect={onWalletConnect}
                    onDisconnect={onWalletDisconnect}
                />
            )}
        </div>
    );
};

export default IssueCertificateTemplate;

