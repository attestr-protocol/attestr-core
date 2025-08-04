// components/templates/VerifyCertificateTemplate.tsx
import React from 'react';
import VerificationForm from '../organisms/verification/VerificationForm';
import VerificationResult from '../organisms/verification/VerificationResult';

interface VerifyCertificateTemplateProps {
    isVerifying?: boolean;
    verificationResult?: any;
    onVerify?: (certificateId: string) => void;
    onRecordVerification?: () => void;
    isRecording?: boolean;
    recordingResult?: any;
    className?: string;
}

/**
 * Template for the verify certificate page
 */
const VerifyCertificateTemplate: React.FC<VerifyCertificateTemplateProps> = ({
    isVerifying = false,
    verificationResult,
    onVerify,
    onRecordVerification,
    isRecording = false,
    recordingResult,
    className = '',
    ...props
}) => {
    return (
        <div className={className} {...props}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Verify Certificate</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Instantly verify the authenticity of any certificate issued on VeriChain.
                </p>
            </div>

            <VerificationForm
                onSubmit={onVerify!}
                isLoading={isVerifying}
                className="max-w-3xl mx-auto mb-8"
            />

            {isVerifying && (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying on blockchain...</p>
                </div>
            )}

            {!isVerifying && verificationResult && (
                <VerificationResult
                    certificate={verificationResult.certificate}
                    metadata={verificationResult.metadata}
                    status={verificationResult.status}
                    onRecordVerification={onRecordVerification}
                    isRecording={isRecording}
                    verificationResult={recordingResult}
                    className="max-w-4xl mx-auto"
                />
            )}
        </div>
    );
};

export default VerifyCertificateTemplate;