import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    BadgeCheckIcon
} from '@heroicons/react/outline';
import { verifyCertificate, recordVerification } from '../../utils/blockchain/contractUtils';
import { retrieveCertificateMetadata } from '../../utils/storage/ipfsStorage';

export default function CertificateDetail() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    // Load certificate data when ID is available
    useEffect(() => {
        async function loadCertificate() {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                // Verify certificate on blockchain
                const result = await verifyCertificate(id);

                setCertificate(result);

                // If certificate is valid and has metadata URI, fetch metadata
                if (result.success && result.metadataURI) {
                    try {
                        const metadataResult = await retrieveCertificateMetadata(result.metadataURI);
                        setMetadata(metadataResult);
                    } catch (metadataError) {
                        console.error('Error fetching metadata:', metadataError);
                        // Continue even if metadata fetch fails
                    }
                }
            } catch (err) {
                console.error('Error loading certificate:', err);
                setError('Failed to load certificate. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        loadCertificate();
    }, [id]);

    // Determine certificate status
    const getCertificateStatus = () => {
        if (!certificate || !certificate.success) {
            return { status: 'unknown', label: 'Unknown', icon: XCircleIcon, color: 'text-gray-500' };
        }

        if (!certificate.isValid) {
            return certificate.revoked
                ? { status: 'revoked', label: 'Revoked', icon: XCircleIcon, color: 'text-red-500' }
                : { status: 'invalid', label: 'Invalid', icon: XCircleIcon, color: 'text-red-500' };
        }

        // Check if expired
        if (certificate.expiryDate) {
            const expiryDate = new Date(certificate.expiryDate);
            if (expiryDate < new Date()) {
                return { status: 'expired', label: 'Expired', icon: ClockIcon, color: 'text-yellow-500' };
            }
        }

        return { status: 'valid', label: 'Valid', icon: CheckCircleIcon, color: 'text-green-500' };
    };

    // Record third-party verification
    const handleRecordVerification = async () => {
        if (!id) return;

        setVerifying(true);

        try {
            const result = await recordVerification(id);
            setVerificationResult(result);
        } catch (err) {
            console.error('Error recording verification:', err);
            setVerificationResult({
                success: false,
                error: 'Failed to record verification. Please try again.'
            });
        } finally {
            setVerifying(false);
        }
    };

    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format wallet address
    const formatAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading certificate...</p>
                </div>
            </div>
        );
    }

    if (error || !certificate || !certificate.success) {
        return (
            <div className="card max-w-3xl mx-auto border-2 border-red-500 my-8">
                <div className="flex items-center mb-4">
                    <XCircleIcon className="h-10 w-10 text-red-500 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-red-700 dark:text-red-500">Certificate Not Found</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {error || "We couldn't find this certificate on the blockchain."}
                        </p>
                    </div>
                </div>
                <button onClick={() => router.push('/verify')} className="btn-primary mt-4">
                    Try Another Certificate
                </button>
            </div>
        );
    }

    const status = getCertificateStatus();
    const StatusIcon = status.icon;

    // Get recipient name and issuer name from metadata if available
    const recipientName = metadata?.recipient?.name || formatAddress(certificate.recipient);
    const issuerName = metadata?.issuer?.name || formatAddress(certificate.issuer);

    return (
        <div>
            <Head>
                <title>Certificate Verification | VeriChain</title>
                <meta name="description" content="Verify the authenticity of blockchain credentials" />
            </Head>

            <div className="max-w-4xl mx-auto">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg mb-6 flex items-center ${status.status === 'valid' ? 'bg-green-100 dark:bg-green-900 bg-opacity-70' :
                        status.status === 'expired' ? 'bg-yellow-100 dark:bg-yellow-900 bg-opacity-70' :
                            'bg-red-100 dark:bg-red-900 bg-opacity-70'
                    }`}>
                    <StatusIcon className={`h-8 w-8 ${status.color} mr-3`} />
                    <div>
                        <h2 className={`text-xl font-bold ${status.color}`}>
                            Certificate {status.label}
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300">
                            {status.status === 'valid'
                                ? 'This certificate has been verified as authentic on the blockchain.'
                                : status.status === 'expired'
                                    ? 'This certificate is authentic but has expired.'
                                    : 'This certificate is not valid or has been revoked.'}
                        </p>
                    </div>
                </div>

                {/* Certificate Content */}
                <div className="card mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-primary-light dark:bg-primary-dark rounded-lg flex items-center justify-center">
                            <AcademicCapIcon className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-right">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Certificate ID
                            </h3>
                            <p className="text-sm font-mono">
                                {certificate.certificateId}
                            </p>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">
                        {metadata?.credential?.title || 'Blockchain Certificate'}
                    </h1>

                    {metadata?.credential?.description && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                            {metadata.credential.description}
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Recipient
                            </h3>
                            <p className="text-xl font-medium">{recipientName}</p>
                            <p className="text-sm font-mono text-gray-500 mt-1">
                                {certificate.recipient}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Issuer
                            </h3>
                            <p className="text-xl font-medium">{issuerName}</p>
                            <p className="text-sm font-mono text-gray-500 mt-1">
                                {certificate.issuer}
                            </p>
                            {metadata?.issuer?.website && (
                                <a
                                    href={metadata.issuer.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {metadata.issuer.website}
                                </a>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Issue Date
                            </h3>
                            <p className="text-lg">{formatDate(certificate.issueDate)}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Expiry Date
                            </h3>
                            <p className="text-lg">
                                {certificate.expiryDate ? formatDate(certificate.expiryDate) : 'No Expiration'}
                            </p>
                        </div>
                    </div>

                    {/* Additional Metadata */}
                    {metadata?.additional && Object.keys(metadata.additional).length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                            <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(metadata.additional).map(([key, value]) => (
                                    <div key={key}>
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </h4>
                                        <p>{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Blockchain Information */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-primary mr-2" />
                        Blockchain Verification
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Certificate ID
                            </h3>
                            <p className="text-sm font-mono break-all">{certificate.certificateId}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Metadata URI
                            </h3>
                            <p className="text-sm font-mono break-all">
                                {certificate.metadataURI || 'No metadata URI available'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Verification Actions */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <BadgeCheckIcon className="h-5 w-5 text-primary mr-2" />
                        Record Verification
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Record your verification of this certificate on the blockchain for audit purposes.
                    </p>

                    {verificationResult ? (
                        <div className={`p-4 rounded-lg ${verificationResult.success
                                ? 'bg-green-100 dark:bg-green-900'
                                : 'bg-red-100 dark:bg-red-900'
                            }`}>
                            {verificationResult.success ? (
                                <div>
                                    <h3 className="font-bold text-green-700 dark:text-green-300 mb-2">
                                        Verification Recorded Successfully
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        Your verification has been recorded on the blockchain.
                                    </p>
                                    <p className="text-sm font-mono break-all">
                                        Verification ID: {verificationResult.verificationId}
                                    </p>
                                    <p className="text-sm font-mono break-all">
                                        Transaction Hash: {verificationResult.transactionHash}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">
                                        Verification Failed
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {verificationResult.error || 'An error occurred while recording your verification.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={handleRecordVerification}
                            disabled={verifying}
                            className="btn-primary"
                        >
                            {verifying ? 'Recording Verification...' : 'Record My Verification'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}