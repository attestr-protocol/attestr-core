// pages/verify/index.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { NextPage } from 'next';
import type { FormEvent } from 'react';
import { SearchIcon, QrcodeIcon, InformationCircleIcon } from '@heroicons/react/outline';
import { useCertificateContext } from '../../contexts/CertificateContext';
import Card from '../../components/molecules/cards/Card';
import Button from '../../components/atoms/buttons/Button';
import TextInput from '../../components/atoms/inputs/TextInput';
import VerificationResult from '../../components/organisms/verification/VerificationResult';

interface VerificationResult {
  success: boolean;
  certificateId?: string;
  metadata?: any;
  status?: string;
  error?: string;
}

interface RecordingResult {
  success: boolean;
  error?: string;
}

const VerifyPage: NextPage = () => {
    const router = useRouter();
    const { verifyCertificate, recordVerification, isLoading } = useCertificateContext();

    const [certificateId, setCertificateId] = useState('');
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);

    // Handle certificate verification
    const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!certificateId.trim()) {
            return;
        }

        setError(null);
        const trimmedId = certificateId.trim();
        const result = await verifyCertificate(trimmedId);

        if (result.success) {
            setVerificationResult(result);
        } else {
            setError(result.error || 'Certificate not found');
            setVerificationResult(null);
        }
    };

    // Handle record verification
    const handleRecordVerification = async (): Promise<void> => {
        if (verificationResult?.certificateId) {
            setIsRecording(true);

            try {
                const result = await recordVerification(verificationResult.certificateId);
                setRecordingResult(result);
            } catch (err) {
                setRecordingResult({
                    success: false,
                    error: err.message || 'Failed to record verification'
                });
            } finally {
                setIsRecording(false);
            }
        }
    };

    return (
        <>
            <Head>
                <title>Verify Certificate | VeriChain</title>
                <meta name="description" content="Verify the authenticity of blockchain credentials" />
            </Head>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        Verify Certificate
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Instantly verify the authenticity of any certificate issued on VeriChain.
                    </p>
                </div>

                {/* Verification Form */}
                {!verificationResult && (
                    <Card className="max-w-2xl mx-auto mb-8">
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label htmlFor="certificateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Certificate ID
                                </label>
                                <TextInput
                                    id="certificateId"
                                    value={certificateId}
                                    onChange={(e) => setCertificateId(e.target.value)}
                                    placeholder="Enter certificate ID or hash"
                                    startIcon={<SearchIcon className="h-5 w-5" />}
                                    required
                                    error={error}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => alert("QR Code scanner coming soon!")}
                                >
                                    <QrcodeIcon className="h-5 w-5 mr-2" />
                                    Scan QR Code
                                </Button>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isLoading || !certificateId.trim()}
                                    isLoading={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify Certificate'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Instructions Panel */}
                {!verificationResult && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">
                                        How to Verify a Certificate
                                    </h3>
                                    <div className="mt-2 text-blue-700 dark:text-blue-300">
                                        <p className="mb-2">
                                            To verify a certificate, you need its unique ID. You can find this in one of these ways:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>The certificate ID is usually displayed on the certificate itself</li>
                                            <li>Scan the QR code on the certificate (if available)</li>
                                            <li>Ask the certificate holder for the verification link</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Result */}
                {!isLoading && verificationResult && (
                    <div className="mt-6">
                        <div className="text-center mb-8">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVerificationResult(null)}
                            >
                                ← Verify Another Certificate
                            </Button>
                        </div>

                        <VerificationResult
                            certificate={verificationResult}
                            metadata={verificationResult.metadata}
                            status={verificationResult.status}
                            onRecordVerification={handleRecordVerification}
                            isRecording={isRecording}
                            verificationResult={recordingResult}
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default VerifyPage;