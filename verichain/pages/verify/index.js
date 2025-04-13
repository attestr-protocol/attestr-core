import Head from 'next/head';
import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/solid';

export default function VerifyCertificate() {
    const [certificateId, setCertificateId] = useState('');
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mock certificate data for UI demonstration
    const [certificateData, setCertificateData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate blockchain verification
        setTimeout(() => {
            // Mock verification response
            if (certificateId && certificateId.length > 5) {
                setVerificationStatus('valid');
                setCertificateData({
                    id: certificateId,
                    recipientName: 'John Doe',
                    credentialTitle: 'Bachelor of Computer Science',
                    issuer: 'University of Blockchain',
                    issueDate: '2025-03-15',
                    expiryDate: '2035-03-15',
                    issuerAddress: '0x1234...5678',
                    recipientAddress: '0xabcd...ef01',
                    txHash: '0x9876...fedc',
                });
            } else {
                setVerificationStatus('invalid');
                setCertificateData(null);
            }
            setIsLoading(false);
        }, 2000);
    };

    return (
        <div>
            <Head>
                <title>Verify Certificate | VeriChain</title>
                <meta name="description" content="Verify the authenticity of blockchain credentials" />
            </Head>

            <div className="mb-8">
                <h1 className="text-3xl font-bold">Verify Certificate</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Instantly verify the authenticity of any certificate issued on VeriChain.
                </p>
            </div>

            <div className="card max-w-3xl mx-auto mb-8">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={certificateId}
                        onChange={(e) => setCertificateId(e.target.value)}
                        placeholder="Enter certificate ID or hash"
                        className="input flex-grow"
                        required
                    />
                    <button
                        type="submit"
                        className="btn-primary whitespace-nowrap"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Verify Certificate'}
                    </button>
                </form>
            </div>

            {isLoading && (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying on blockchain...</p>
                </div>
            )}

            {!isLoading && verificationStatus === 'valid' && certificateData && (
                <div className="card max-w-3xl mx-auto border-2 border-green-500">
                    <div className="flex items-center mb-6">
                        <CheckCircleIcon className="h-10 w-10 text-green-500 mr-3" />
                        <div>
                            <h2 className="text-2xl font-bold text-green-700 dark:text-green-500">Certificate Verified</h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                This certificate has been verified as authentic on the blockchain.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recipient</h3>
                            <p className="text-lg font-medium">{certificateData.recipientName}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Credential</h3>
                            <p className="text-lg font-medium">{certificateData.credentialTitle}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Issuer</h3>
                            <p className="text-lg font-medium">{certificateData.issuer}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Issue Date</h3>
                            <p className="text-lg font-medium">{certificateData.issueDate}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</h3>
                            <p className="text-lg font-medium">{certificateData.expiryDate || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h3 className="text-md font-medium mb-2">Blockchain Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Certificate ID</h4>
                                <p className="text-sm font-mono break-all">{certificateData.id}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash</h4>
                                <p className="text-sm font-mono break-all">{certificateData.txHash}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Issuer Address</h4>
                                <p className="text-sm font-mono break-all">{certificateData.issuerAddress}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recipient Address</h4>
                                <p className="text-sm font-mono break-all">{certificateData.recipientAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && verificationStatus === 'invalid' && (
                <div className="card max-w-3xl mx-auto border-2 border-red-500">
                    <div className="flex items-center mb-4">
                        <XCircleIcon className="h-10 w-10 text-red-500 mr-3" />
                        <div>
                            <h2 className="text-2xl font-bold text-red-700 dark:text-red-500">Certificate Invalid</h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                We could not verify this certificate on the blockchain.
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        This certificate either does not exist or has been revoked. Please check the certificate ID and try again.
                    </p>
                </div>
            )}
        </div>
    );
}