// contexts/CertificateContext.js
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useCertificate } from '../utils/hooks/useCertificate';

// Create context
const CertificateContext = createContext(null);

// Provider component
export function CertificateProvider({ children }) {
    const certificateUtils = useCertificate();
    const [certificates, setCertificates] = useState([]);
    const [currentCertificate, setCurrentCertificate] = useState(null);

    // Load user's certificates
    const loadUserCertificates = useCallback(async (address) => {
        if (!address) {
            setCertificates([]);
            return [];
        }

        const userCertificates = await certificateUtils.getRecipientCertificates(address);
        setCertificates(userCertificates);
        return userCertificates;
    }, [certificateUtils]);

    // Get certificate by ID
    const getCertificateById = useCallback(async (certificateId) => {
        const result = await certificateUtils.verifyExistingCertificate(certificateId);

        if (result.success) {
            setCurrentCertificate(result);
        }

        return result;
    }, [certificateUtils]);

    // Issue certificate
    const issueCertificate = useCallback(async (certificateData) => {
        const result = await certificateUtils.issueNewCertificate(certificateData);

        if (result.success && window.ethereum?.selectedAddress === certificateData.issuerWallet) {
            loadUserCertificates(window.ethereum.selectedAddress);
        }

        return result;
    }, [certificateUtils, loadUserCertificates]);

    // Clear current certificate
    const clearCurrentCertificate = useCallback(() => {
        setCurrentCertificate(null);
    }, []);

    const value = useMemo(() => ({
        ...certificateUtils,
        certificates,
        currentCertificate,
        loadUserCertificates,
        getCertificateById,
        issueCertificate: issueCertificate,
        clearCurrentCertificate,
    }), [
        certificateUtils,
        certificates,
        currentCertificate,
        loadUserCertificates,
        getCertificateById,
        issueCertificate,
        clearCurrentCertificate,
    ]);

    return (
        <CertificateContext.Provider value={value}>
            {children}
        </CertificateContext.Provider>
    );
}

// Hook for components to consume the context
export function useCertificateContext() {
    const context = useContext(CertificateContext);

    if (!context) {
        throw new Error('useCertificateContext must be used within a CertificateProvider');
    }

    return context;
}

