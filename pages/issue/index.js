// pages/issue/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useWalletContext } from '../../contexts/WalletContext';
import { useCertificateContext } from '../../contexts/CertificateContext';
import CertificateForm from '../../components/organisms/certificate/CertificateForm';
import WalletConnect from '../../components/organisms/wallet/WalletConnect';
import Card from '../../components/molecules/cards/Card';
import { InformationCircleIcon } from '@heroicons/react/outline';

export default function IssuePage() {
    const router = useRouter();
    const { address, connect, disconnect } = useWalletContext();
    const {
        issueNewCertificate,
        initializeArweaveStorage,
        isLoading,
        storageInitialized
    } = useCertificateContext();

    const [issuanceSuccess, setIssuanceSuccess] = useState(null);
    const [isStorageInitializing, setIsStorageInitializing] = useState(false);
    const [storageError, setStorageError] = useState(null);

    // Handle Arweave storage initialization
    const handleInitializeStorage = async () => {
        setIsStorageInitializing(true);
        setStorageError(null);

        try {
            // For demo purposes, initialize with a temporary wallet
            // In production, you would use a real wallet or connect to ArConnect/ArweaveWallet
            const result = await initializeArweaveStorage();

            if (!result) {
                setStorageError('Failed to initialize Arweave storage. Please try again.');
            }
        } catch (error) {
            console.error('Error initializing storage:', error);
            setStorageError(error.message || 'An unexpected error occurred');
        } finally {
            setIsStorageInitializing(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (formData) => {
        try {
            // Add issuer wallet address to form data
            const certificateData = {
                ...formData,
                issuerWallet: address,
                issuerName: 'VeriChain', // Would be pulled from user profile in a real app
            };

            const result = await issueNewCertificate(certificateData);

            if (result.success) {
                setIssuanceSuccess(result);

                // Redirect to the certificate detail page after successful issuance
                setTimeout(() => {
                    router.push(`/verify/${result.certificateId}`);
                }, 2000);
            } else {
                setIssuanceSuccess({
                    success: false,
                    error: result.error || 'Failed to issue certificate'
                });
            }

            return result;
        } catch (error) {
            console.error('Error issuing certificate:', error);
            setIssuanceSuccess({
                success: false,
                error: error.message || 'An unexpected error occurred'
            });
            return { success: false, error: error.message };
        }
    };

    return (
        <>
            <Head>
                <title>Issue Certificate | VeriChain</title>
                <meta name="description" content="Issue new blockchain-verified credentials" />
            </Head>

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Issue New Certificate</h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Create and issue a new blockchain-verified credential with permanent storage on Arweave.
                    </p>
                </div>

                {/* Storage Error Notification */}
                {storageError && (
                    <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">Storage Error</h3>
                                <p className="text-sm mt-1">{storageError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Storage Initialization Info */}
                {isStorageInitializing && (
                    <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">Initializing Arweave Storage</h3>
                                <p className="text-sm mt-1">
                                    Setting up Arweave for permanent data storage. This process may take a moment.
                                </p>
                                <div className="mt-2">
                                    <div className="w-40 h-2 bg-yellow-200 dark:bg-yellow-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 dark:bg-yellow-400 animate-pulse rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {address ? (
                    <Card className="max-w-3xl mx-auto">
                        <CertificateForm
                            onSubmit={handleSubmit}
                            isSubmitting={isLoading}
                            storageInitialized={storageInitialized}
                            onInitializeStorage={handleInitializeStorage}
                        />
                    </Card>
                ) : (
                    <WalletConnect
                        onConnect={connect}
                        onDisconnect={disconnect}
                    />
                )}

                {/* Success/Error notification */}
                {issuanceSuccess && (
                    <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg ${issuanceSuccess.success
                        ? 'bg-green-100 border border-green-500 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 border border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                        {issuanceSuccess.success ? (
                            <div>
                                <h3 className="font-bold mb-1">Certificate Issued Successfully</h3>
                                <p>Certificate ID: {issuanceSuccess.certificateId}</p>
                                {issuanceSuccess.arweaveTxId && (
                                    <p className="text-sm mt-1">Arweave TX: {issuanceSuccess.arweaveTxId.substring(0, 12)}...</p>
                                )}
                                <p className="text-sm mt-1">Redirecting to certificate details...</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="font-bold mb-1">Error Issuing Certificate</h3>
                                <p>{issuanceSuccess.error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}