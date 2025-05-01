// utils/hooks/useVerification.js
import { useState, useCallback } from 'react';
import { recordVerification, getVerificationDetails } from '../blockchain/certificateUtils';

/**
 * Custom hook for verification operations
 * @returns {Object} Verification functions and state
 */
export const useVerification = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [verificationHistory, setVerificationHistory] = useState([]);

    // Record a verification
    const recordCertificateVerification = useCallback(async (certificateId) => {
        setIsRecording(true);
        setError(null);
        setVerificationResult(null);

        try {
            console.log(`Recording verification for certificate: ${certificateId}`);
            const result = await recordVerification(certificateId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to record verification');
            }

            setVerificationResult(result);

            // Add to verification history
            setVerificationHistory(prev => [result, ...prev]);

            return result;
        } catch (error) {
            console.error('Error recording verification:', error);
            setError(error.message || 'An error occurred while recording the verification');
            return { success: false, error: error.message };
        } finally {
            setIsRecording(false);
        }
    }, []);

    // Get verification details
    const getVerification = useCallback(async (verificationId) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getVerificationDetails(verificationId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to get verification details');
            }

            return result;
        } catch (error) {
            console.error('Error getting verification details:', error);
            setError(error.message || 'An error occurred while getting verification details');
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Reset state
    const resetVerification = useCallback(() => {
        setError(null);
        setVerificationResult(null);
    }, []);

    // Load verification history from local storage
    const loadVerificationHistory = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const savedHistory = localStorage.getItem('verificationHistory');
            if (savedHistory) {
                setVerificationHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Error loading verification history:', error);
        }
    }, []);

    // Save verification history to local storage
    const saveVerificationHistory = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            localStorage.setItem('verificationHistory', JSON.stringify(verificationHistory));
        } catch (error) {
            console.error('Error saving verification history:', error);
        }
    }, [verificationHistory]);

    // Clear verification history
    const clearVerificationHistory = useCallback(() => {
        setVerificationHistory([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('verificationHistory');
        }
    }, []);

    return {
        recordCertificateVerification,
        getVerification,
        resetVerification,
        loadVerificationHistory,
        saveVerificationHistory,
        clearVerificationHistory,
        isRecording,
        isLoading,
        error,
        verificationResult,
        verificationHistory,
    };
};