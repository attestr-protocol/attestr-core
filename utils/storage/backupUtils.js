// utils/storage/backupUtils.js
import { retrieveCertificateMetadata } from './ipfsStorage';

/**
 * Backup a certificate to local storage
 * @param {Object} certificate - Certificate object with metadata
 * @returns {boolean} Success indicator
 */
export const backupCertificate = async (certificate) => {
    if (!certificate || !certificate.certificateId) {
        console.error('Invalid certificate object');
        return false;
    }

    try {
        // Try to ensure we have the metadata
        let { metadata } = certificate;
        if (!metadata && certificate.metadataURI) {
            try {
                metadata = await retrieveCertificateMetadata(certificate.metadataURI);
            } catch (e) {
                console.warn('Could not retrieve metadata from IPFS, backing up without it', e);
            }
        }

        // Create backup object with blockchain data and metadata
        const backupObject = {
            certificateId: certificate.certificateId,
            issuer: certificate.issuer,
            recipient: certificate.recipient,
            metadataURI: certificate.metadataURI,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
            revoked: certificate.revoked,
            isValid: certificate.isValid,
            metadata: metadata || null,
            backupDate: new Date().toISOString()
        };

        // Get existing backups
        const existingBackups = getBackupCertificates();

        // Check if this certificate is already backed up
        const existingIndex = existingBackups.findIndex(
            backup => backup.certificateId === certificate.certificateId
        );

        if (existingIndex >= 0) {
            // Update existing backup
            existingBackups[existingIndex] = {
                ...existingBackups[existingIndex],
                ...backupObject,
            };
        } else {
            // Add new backup
            existingBackups.push(backupObject);
        }

        // Save to local storage
        localStorage.setItem('certificateBackups', JSON.stringify(existingBackups));
        console.log(`Certificate ${certificate.certificateId} backed up successfully`);
        return true;
    } catch (error) {
        console.error('Error backing up certificate:', error);
        return false;
    }
};

/**
 * Get all backed up certificates
 * @returns {Array} Array of backed up certificates
 */
export const getBackupCertificates = () => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const backups = localStorage.getItem('certificateBackups');
        return backups ? JSON.parse(backups) : [];
    } catch (error) {
        console.error('Error retrieving certificate backups:', error);
        return [];
    }
};

/**
 * Get a specific backed up certificate
 * @param {string} certificateId - Certificate ID
 * @returns {Object|null} Backed up certificate or null if not found
 */
export const getBackupCertificate = (certificateId) => {
    if (!certificateId || typeof window === 'undefined') {
        return null;
    }

    try {
        const backups = getBackupCertificates();
        return backups.find(cert => cert.certificateId === certificateId) || null;
    } catch (error) {
        console.error('Error retrieving backup certificate:', error);
        return null;
    }
};

/**
 * Delete a backed up certificate
 * @param {string} certificateId - Certificate ID
 * @returns {boolean} Success indicator
 */
export const deleteBackupCertificate = (certificateId) => {
    if (!certificateId || typeof window === 'undefined') {
        return false;
    }

    try {
        const backups = getBackupCertificates();
        const filteredBackups = backups.filter(cert => cert.certificateId !== certificateId);

        localStorage.setItem('certificateBackups', JSON.stringify(filteredBackups));
        console.log(`Certificate ${certificateId} backup deleted`);
        return true;
    } catch (error) {
        console.error('Error deleting backup certificate:', error);
        return false;
    }
};

/**
 * Clear all certificate backups
 * @returns {boolean} Success indicator
 */
export const clearAllBackups = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        localStorage.removeItem('certificateBackups');
        console.log('All certificate backups cleared');
        return true;
    } catch (error) {
        console.error('Error clearing certificate backups:', error);
        return false;
    }
};

/**
 * Export backups as JSON file
 * @returns {boolean} Success indicator
 */
export const exportBackups = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        const backups = getBackupCertificates();
        if (backups.length === 0) {
            console.warn('No certificate backups to export');
            return false;
        }

        // Create export object with metadata
        const exportObject = {
            type: 'VeriChain Certificate Backup',
            version: '1.0',
            timestamp: new Date().toISOString(),
            certificates: backups
        };

        // Convert to JSON and create a Blob
        const jsonString = JSON.stringify(exportObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a download link and trigger the download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `verichain-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Certificate backups exported successfully');
        return true;
    } catch (error) {
        console.error('Error exporting certificate backups:', error);
        return false;
    }
};

/**
 * Import backups from JSON file
 * @param {File} file - JSON file containing backups
 * @returns {Promise<Object>} Import result
 */
export const importBackups = async (file) => {
    if (!file || typeof window === 'undefined') {
        return { success: false, error: 'Invalid file or environment' };
    }

    try {
        // Read the file
        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate the import data
        if (!importData.type || importData.type !== 'VeriChain Certificate Backup' || !Array.isArray(importData.certificates)) {
            throw new Error('Invalid backup file format');
        }

        // Get existing backups
        const existingBackups = getBackupCertificates();
        const newBackups = importData.certificates;

        // Merge backups, preferring newer versions
        const mergedBackups = [...existingBackups];

        for (const newBackup of newBackups) {
            const existingIndex = mergedBackups.findIndex(
                backup => backup.certificateId === newBackup.certificateId
            );

            if (existingIndex >= 0) {
                // Only update if the new backup is newer or we can't determine
                const existingDate = new Date(mergedBackups[existingIndex].backupDate || 0);
                const newDate = new Date(newBackup.backupDate || 0);

                if (newDate > existingDate) {
                    mergedBackups[existingIndex] = newBackup;
                }
            } else {
                // Add new backup
                mergedBackups.push(newBackup);
            }
        }

        // Save the merged backups
        localStorage.setItem('certificateBackups', JSON.stringify(mergedBackups));

        return {
            success: true,
            imported: newBackups.length,
            total: mergedBackups.length,
        };
    } catch (error) {
        console.error('Error importing certificate backups:', error);
        return { success: false, error: error.message };
    }
};