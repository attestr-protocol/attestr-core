// pages/profile/index.js with Arweave integration
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useWalletContext } from '../../contexts/WalletContext';
import CertificateListWithArweave from '../../components/organisms/certificate/CertificateListWithArweave';
import WalletInfo from '../../components/organisms/wallet/WalletInfo';
import Card from '../../components/molecules/cards/Card';
import Button from '../../components/atoms/buttons/Button';
import { SwitchHorizontalIcon } from '@heroicons/react/outline';

export default function ProfilePage() {
    const router = useRouter();
    const { address, connect, disconnect } = useWalletContext();
    const [viewRole, setViewRole] = useState('recipient');

    // Handle certificate view action
    const handleViewCertificate = (certificate) => {
        router.push(`/verify/${certificate.certificateId}`);
    };

    // Handle certificate share action
    const handleShareCertificate = (certificate) => {
        if (navigator.share) {
            navigator.share({
                title: certificate.credential?.title || 'Blockchain Certificate',
                text: `Check out my verified credential: ${certificate.credential?.title}`,
                url: `${window.location.origin}/verify/${certificate.certificateId}`,
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        } else {
            // Fallback for browsers that don't support the Web Share API
            const shareUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    alert('Share link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Error copying to clipboard:', err);
                });
        }
    };

    // Toggle between viewing received and issued certificates
    const toggleCertificateView = () => {
        setViewRole(viewRole === 'recipient' ? 'issuer' : 'recipient');
    };

    return (
        <>
            <Head>
                <title>Profile & Wallet | VeriChain</title>
                <meta name="description" content="Manage your blockchain credentials and Arweave storage" />
            </Head>

            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Profile & Wallet</h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Manage your blockchain identity, credentials, and Arweave storage.
                    </p>
                </div>

                {address ? (
                    <div className="space-y-8">
                        {/* Wallet Information */}
                        <WalletInfo
                            address={address}
                            onDisconnect={disconnect}
                        />

                        {/* Certificate View Toggle */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Credentials</h2>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleCertificateView}
                                startIcon={<SwitchHorizontalIcon className="h-4 w-4" />}
                            >
                                {viewRole === 'recipient' ? 'View Issued' : 'View Received'}
                            </Button>
                        </div>

                        {/* Certificate List */}
                        <CertificateListWithArweave
                            walletAddress={address}
                            role={viewRole}
                            onShareCertificate={handleShareCertificate}
                            onViewCertificate={handleViewCertificate}
                            onRequestCertificate={() => router.push('/issue')}
                        />
                    </div>
                ) : (
                    <Card className="text-center py-12 max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Connect your wallet to view and manage your blockchain credentials and Arweave storage.
                        </p>
                        <div className="flex justify-center">
                            <Button
                                variant="primary"
                                onClick={connect}
                                size="lg"
                            >
                                Connect Wallet
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
}