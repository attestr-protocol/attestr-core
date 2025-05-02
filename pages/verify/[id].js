// pages/verify/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import CertificateDetailTemplate from '../../components/page-templates/CertificateDetailTemplate';
import { useCertificateContext } from '../../contexts/CertificateContext';

export default function CertificateDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const {
        verifyCertificate,
        recordVerification,
        isLoading
    } = useCertificateContext();

    const [certificate, setCertificate] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [certificateStatus, setCertificateStatus] = useState(null);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingResult, setRecordingResult] = useState(null);

    // Load certificate data when ID is available
    useEffect(() => {
        async function loadCertificate() {
            if (!id) {
                return;
            }

            try {
                const result = await verifyCertificate(id);

                if (result.success) {
                    setCertificate(result);
                    setMetadata(result.metadata);

                    // Set certificate status (using the status from result or determine it)
                    setCertificateStatus(result.status || 'valid');
                } else {
                    setError(result.error || 'Certificate not found');
                }
            } catch (err) {
                console.error('Error loading certificate:', err);
                setError('Failed to load certificate. Please try again.');
            }
        }

        loadCertificate();
    }, [id, verifyCertificate]);

    // Handle record verification
    const handleRecordVerification = async () => {
        if (certificate?.certificateId) {
            setIsRecording(true);

            try {
                const result = await recordVerification(certificate.certificateId);
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