// pages/verify/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { NextPage } from 'next';
import CertificateDetailTemplate from '../../components/page-templates/CertificateDetailTemplate';
import { useCertificateContext } from '../../contexts/CertificateContext';

interface CertificateData {
  certificateId?: string;
  credential?: {
    title?: string;
  };
  metadata?: {
    credential?: {
      title?: string;
    };
  };
  status?: string;
  success?: boolean;
  error?: string;
}

interface RecordingResult {
  success: boolean;
  error?: string;
}

const CertificateDetailPage: NextPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const {
        verifyCertificate,
        recordVerification,
        isLoading
    } = useCertificateContext();

    const [certificate, setCertificate] = useState<CertificateData | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [certificateStatus, setCertificateStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);

    // Load certificate data when ID is available
    useEffect(() => {
        async function loadCertificate(): Promise<void> {
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
    const handleRecordVerification = async (): Promise<void> => {
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
                    {certificate?.credential?.title || certificate?.metadata?.credential?.title || 'Attestation Verification'} | Attestr Protocol
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
};

export default CertificateDetailPage;