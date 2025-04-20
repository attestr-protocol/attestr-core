// pages/verify/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import CertificateDetailTemplate from '../../components/page-templates/CertificateDetailTemplate';
import { useCertificateContext } from '../../contexts/CertificateContext';
import { useVerification } from '../../utils/hooks/useVerification';

export default function CertificateDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { verifyExistingCertificate, isLoading } = useCertificateContext();
    const {
        recordCertificateVerification,
        isRecording,
        verificationResult: recordingResult
    } = useVerification();

    const [certificate, setCertificate] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [certificateStatus, setCertificateStatus] = useState(null);
    const [error, setError] = useState(null);

    // Load certificate data when ID is available
    useEffect(() => {
        async function loadCertificate() {
            if (!id) {
                return;
            }

            try {
                const result = await verifyExistingCertificate(id);

                if (result.success) {
                    setCertificate(result);
                    setMetadata(result.metadata);

                    // Determine certificate status
                    let status = 'valid';
                    if (!result.isValid) {
                        status = result.revoked ? 'revoked' : 'invalid';
                    } else if (result.expiryDate && new Date(result.expiryDate) < new Date()) {
                        status = 'expired';
                    }

                    setCertificateStatus(status);
                } else {
                    setError(result.error || 'Certificate not found');
                }
            } catch (err) {
                console.error('Error loading certificate:', err);
                setError('Failed to load certificate. Please try again.');
            }
        }

        loadCertificate();
    }, [id, verifyExistingCertificate]);

    // Handle record verification
    const handleRecordVerification = async () => {
        if (certificate?.certificateId) {
            await recordCertificateVerification(certificate.certificateId);
        }
    };

    return (
        <>
            <Head>
                <title>
                    {certificate?.credential?.title || certificate?.metadata?.credential?.title || 'Certificate Verification'} | VeriChain
                </title>
                <meta
                    name="description"
                    content="View and verify blockchain-based credential details"
                />
            </Head>

            <CertificateDetailTemplate
                isLoading={isLoading}
                certificate={certificate}
                metadata={metadata}
                certificateStatus={certificateStatus}
                onRecordVerification={handleRecordVerification}
                isRecording={isRecording}
                recordingResult={recordingResult}
                error={error}
            />
        </>
    );
}