// pages/issue/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import IssueCertificateTemplate from '../../components/page-templates/IssueCertificateTemplate';
import { useWalletContext } from '../../contexts/WalletContext';
import { useCertificateContext } from '../../contexts/CertificateContext';
import { formatCertificateMetadata, storeCertificateMetadata } from '../../utils/storage/ipfsStorage';

export default function IssuePage() {
    const router = useRouter();
    const { address, connect, disconnect } = useWalletContext();
    const { issueNewCertificate, isLoading } = useCertificateContext();

    const [issuanceSuccess, setIssuanceSuccess] = useState(null);

    // Handle form submission
    const handleSubmit = async (formData) => {
        try {
            // Add issuer wallet address to form data
            const certificateData = {
                ...formData,
                issuerWallet: address,
                issuerName: 'VeriChain Institution', // Would be pulled from user profile in a real app
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

            <IssueCertificateTemplate
                address={address}
                isSubmitting={isLoading}
                onWalletConnect={connect}
                onWalletDisconnect={disconnect}
                onSubmit={handleSubmit}
            />

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
        </>
    );
}