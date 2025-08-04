// components/page-templates/ProfileTemplate.js
import React from 'react';
import { DocumentDuplicateIcon, ShareIcon, ExternalLinkIcon } from '@heroicons/react/outline';
import Card from '../molecules/cards/Card';
import Button from '../atoms/buttons/Button';
import Badge from '../atoms/display/Badge';
import Status from '../atoms/display/Status';
import Address from '../atoms/display/Address';
import CopyButton from '../atoms/display/CopyButton';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileTemplateProps {
    address?: string;
    certificates?: any[];
    isLoading?: boolean;
    onWalletConnect?: () => void;
    onWalletDisconnect?: () => void;
    onShareCertificate?: (certificate: any) => void;
    onViewCertificate?: (certificate: any) => void;
    className?: string;
}

/**
 * Enhanced template for the profile page
 */
const ProfileTemplate: React.FC<ProfileTemplateProps> = ({
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
    const { darkMode } = useTheme();

    // Format dates
    const formatDate = (dateString: string) => {
        if (!dateString) {
            return 'N/A';
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={className} {...props}>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile & Wallet</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Manage your blockchain identity and credentials.
                </p>
            </header>

            {address ? (
                <div className="space-y-8">
                    {/* Wallet Information */}
                    <Card variant="default" hover={false}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Wallet Connected</h2>
                                <div className="flex items-center">
                                    <span className="bg-primary bg-opacity-10 dark:bg-opacity-20 px-3 py-2 rounded-md font-mono text-primary dark:text-primary-light">
                                        <Address address={address} />
                                    </span>
                                    <CopyButton text={address} className="ml-2" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Connected with MetaMask
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={onWalletDisconnect}
                                className="mt-4 sm:mt-0"
                            >
                                Disconnect
                            </Button>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium mb-2">Network Information</h3>
                            <div className="bg-gray-50 dark:bg-dark rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">
                                    <div>
                                        <span className="block font-medium text-gray-500 dark:text-gray-400">
                                            Chain ID
                                        </span>
                                        <span>Polygon Amoy Testnet (80002)</span>
                                    </div>
                                    <div>
                                        <span className="block font-medium text-gray-500 dark:text-gray-400">
                                            Status
                                        </span>
                                        <div className="flex items-center">
                                            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                            Connected
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Certificates */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Credentials</h2>
                            <Badge
                                variant="primary"
                                text={`${certificates.length} Credentials`}
                                size="md"
                            />
                        </div>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your credentials...</p>
                            </div>
                        ) : certificates.length > 0 ? (
                            <div className="space-y-4">
                                {certificates.map((certificate) => {
                                    // Get certificate status
                                    let status = 'valid';
                                    if (!certificate.isValid) {
                                        status = certificate.revoked ? 'revoked' : 'invalid';
                                    } else if (certificate.expiryDate && new Date(certificate.expiryDate) < new Date()) {
                                        status = 'expired';
                                    }

                                    // Get title and issuer
                                    const title = certificate.metadata?.credential?.title || 'Certificate';
                                    const issuer = certificate.metadata?.issuer?.name || `Issuer: ${certificate.issuer.substring(0, 6)}...`;

                                    return (
                                        <Card
                                            key={certificate.certificateId}
                                            variant="outline"
                                            className="hover:shadow-md transition-shadow overflow-hidden"
                                        >
                                            <div className={`absolute top-0 left-0 w-1 h-full bg-${status === 'valid' ? 'success' : status === 'expired' ? 'warning' : 'error'}`}></div>
                                            <div className="pl-2">
                                                <div className="flex flex-col md:flex-row justify-between">
                                                    <div>
                                                        <div className="mb-2">
                                                            <Status status={status as any} />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                            {title}
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-300 mb-3">{issuer}</p>
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <div>
                                                                <span className="block font-medium">Issue Date</span>
                                                                {formatDate(certificate.issueDate)}
                                                            </div>
                                                            {certificate.expiryDate && (
                                                                <div>
                                                                    <span className="block font-medium">Expiry Date</span>
                                                                    {formatDate(certificate.expiryDate)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex mt-4 md:mt-0 space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onShareCertificate?.(certificate)}
                                                            startIcon={<ShareIcon className="h-5 w-5" />}
                                                        >
                                                            Share
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onViewCertificate?.(certificate)}
                                                            startIcon={<ExternalLinkIcon className="h-5 w-5" />}
                                                        >
                                                            View
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center">
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">ID:</span>
                                                        <span className="text-xs font-mono truncate text-gray-500 dark:text-gray-400">{certificate.certificateId}</span>
                                                        <CopyButton text={certificate.certificateId} className="ml-1 p-1 h-6 w-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card variant="flat" className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    You don&apos;t have any credentials yet.
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => window.location.href = '/issue'}
                                >
                                    Request a Credential
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            ) : (
                <Card variant="default" className="text-center py-12 max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Connect your wallet to view and manage your blockchain credentials.
                    </p>
                    <div className="flex justify-center">
                        <Button
                            variant="primary"
                            onClick={onWalletConnect}
                            size="lg"
                        >
                            Connect with MetaMask
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ProfileTemplate;