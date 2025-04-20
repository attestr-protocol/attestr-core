// components/templates/CertificateDetailTemplate.js
import React from 'react';
import VerificationResult from '../organisms/verification/VerificationResult';

/**
 * Template for the certificate detail page
 */
const CertificateDetailTemplate = ({
    isLoading = false,
    certificate,
    metadata,
    certificateStatus,
    onRecordVerification,
    isRecording = false,
    recordingResult,
    error,
    className = '',
    ...props
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading certificate...</p>
                </div>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="card max-w-3xl mx-auto border-2 border-red-500 my-8">
                <div className="flex items-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-red-500 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <h2 className="text-2xl font-bold text-red-700 dark:text-red-500">Certificate Not Found</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {error || "We couldn't find this certificate on the blockchain."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.location.href = '/verify'}
                    className="btn-primary mt-4"
                >
                    Try Another Certificate
                </button>
            </div>
        );
    }

    return (
        <div className={`max-w-4xl mx-auto ${className}`} {...props}>
            <VerificationResult
                certificate={certificate}
                metadata={metadata}
                status={certificateStatus}
                onRecordVerification={onRecordVerification}
                isRecording={isRecording}
                verificationResult={recordingResult}
            />
        </div>
    );
};

export default CertificateDetailTemplate;