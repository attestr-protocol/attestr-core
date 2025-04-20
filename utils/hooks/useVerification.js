import { useState, useCallback } from 'react';
import { recordVerification } from '../blockchain/certificateUtils';

/**
 * Custom hook for verification operations
 * @returns {Object} Verification functions and state
 */
export const useVerification = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);

    // Record a verification
    const recordCertificateVerification = useCallback(async (certificateId) => {
        setIsRecording(true);
        setError(null);
        setVerificationResult(null);

        try {
            const result = await recordVerification(certificateId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to record verification');
            }

            setVerificationResult(result);
            return result;
        } catch (error) {
            console.error('Error recording verification:', error);
            setError(error.message || 'An error occurred while recording the verification');
            return { success: false, error: error.message };
        } finally {
            setIsRecording(false);
        }
    }, []);

    // Reset state
    const resetVerification = useCallback(() => {
        setError(null);
        setVerificationResult(null);
    }, []);

    return {
        recordCertificateVerification,
        resetVerification,
        isRecording,
        error,
        verificationResult,
    };
};