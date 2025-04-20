// pages/verify/index.js
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import VerifyCertificateTemplate from '../../components/page-templates/VerifyCertificateTemplate';
import { useCertificateContext } from '../../contexts/CertificateContext';
import { useVerification } from '../../utils/hooks/useVerification';

export default function VerifyPage() {
    const router = useRouter();
    const { verifyExistingCertificate, isLoading } = useCertificateContext();
    const {
        recordCertificateVerification,
        isRecording,
        verificationResult: recordingResult
    } = useVerification();

    const [verificationResult, setVerificationResult] = useState(null);

    // Handle certificate verification
    const handleVerify = async (certificateId) => {
        const result = await verifyExistingCertificate(certificateId);

        if (result.success) {
            // Determine certificate status
            let status = 'valid';
            if (!result.isValid) {
                status = result.revoked ? 'revoked' : 'invalid';
            } else if (result.expiryDate && new Date(result.expiryDate) < new Date()) {
                status = 'expired';
            }

            setVerificationResult({
                certificate: result,
                metadata: result.metadata,
                status: status
            });
        } else {
            setVerificationResult({
                certificate: null,
                metadata: null,
                status: 'invalid',
                error: result.error
            });
        }
    };

    // Handle record verification
    const handleRecordVerification = async () => {
        if (verificationResult?.certificate?.certificateId) {
            await recordCertificateVerification(verificationResult.certificate.certificateId);
        }
    };

    return (
        <>
            <Head>
                <title>Verify Certificate | VeriChain</title>
                <meta name="description" content="Verify the authenticity of blockchain credentials" />
            </Head>

            <VerifyCertificateTemplate
                isVerifying={isLoading}
                verificationResult={verificationResult}
                onVerify={handleVerify}
                onRecordVerification={handleRecordVerification}
                isRecording={isRecording}
                recordingResult={recordingResult}
            />
        </>
    );
}