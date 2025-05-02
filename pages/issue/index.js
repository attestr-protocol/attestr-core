// pages/issue/index.js with Arweave integration
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useWalletContext } from '../../contexts/WalletContext';
import CertificateFormWithStorage from '../../components/organisms/certificate/CertificateFormWithStorage';
import WalletConnect from '../../components/organisms/wallet/WalletConnect';
import { InformationCircleIcon } from '@heroicons/react/outline';

export default function IssuePage() {
    const router = useRouter();
    const { address, connect, disconnect } = useWalletContext();
    const [issuanceSuccess, setIssuanceSuccess] = useState(null);

    // Handle successful issuance
    const handleIssued = (result) => {
        setIssuanceSuccess(result);

        // Redirect to the certificate detail page after successful issuance
        if (result.success && result.blockchain?.certificateId) {
            setTimeout(() => {
                router.push(`/verify/${result.blockchain.certificateId}`);
            }, 2000);
        }
    };

    return (
        <>
            <Head>
                <title>Issue Certificate | VeriChain</title>
                <meta name="description" content="Issue new blockchain-verified credentials with permanent storage on Arweave" />
            </Head>

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Issue New Certificate</h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Create and issue a new blockchain-verified credential with permanent storage on Arweave.
                    </p>
                </div>

                {/* Information panel about permanent storage */}
                <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 text-blue-700 dark:text-blue-300 p-4 rounded-lg mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">About Permanent Storage</h3>
                            <p className="text-sm mt-1">
                                VeriChain uses Arweave for permanent, decentralized storage of credential metadata.
                                This ensures your certificates remain accessible even if the issuing institution no longer exists.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {address ? (
                    <CertificateFormWithStorage
                        walletAddress={address}
                        onIssued={handleIssued}
                    />
                ) : (
                    <WalletConnect
                        onConnect={connect}
                        onDisconnect={disconnect}
                    />
                )}

                {/* Success/Error notification already handled within CertificateFormWithStorage */}
            </div>
        </>
    );
}