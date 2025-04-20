// components/templates/ProfileTemplate.js
import React from 'react';
import WalletConnect from '../organisms/wallet/WalletConnect';
import WalletInfo from '../organisms/wallet/WalletInfo';
import CertificateList from '../organisms/certificate/CertificateList';

/**
 * Template for the profile page
 */
const ProfileTemplate = ({
    address,
    certificates = [],
    isLoading = false,
    onWalletConnect,
    onWalletDisconnect,
    onShareCertificate,
    onViewCertificate,
    className = '',
    ...props
}) => {
    return (
        <div className={className} {...props}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Profile & Wallet</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Manage your blockchain identity and credentials.
                </p>
            </div>

            {address ? (
                <div className="space-y-8">
                    {/* Wallet Information */}
                    <WalletInfo address={address} />

                    {/* Certificates */}
                    <CertificateList
                        certificates={certificates}
                        onShare={onShareCertificate}
                        onView={onViewCertificate}
                        isLoading={isLoading}
                        title="My Credentials"
                        emptyMessage="You do not have any credentials yet."
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

export default ProfileTemplate;

