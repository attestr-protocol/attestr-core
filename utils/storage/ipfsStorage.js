import { Web3Storage } from 'web3.storage';

// Initialize Web3Storage client
let client;

/**
 * Initialize the web3.storage client with an API token
 * @param {string} token - web3.storage API token
 */
export function initializeStorage(token) {
    client = new Web3Storage({ token });
}

/**
 * Store certificate metadata on IPFS
 * @param {Object} certificateData - Certificate metadata to store
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
export async function storeCertificateMetadata(certificateData) {
    if (!client) {
        throw new Error('Storage client not initialized. Call initializeStorage first.');
    }

    try {
        // Create a JSON blob from the certificate data
        const blob = new Blob([JSON.stringify(certificateData)], { type: 'application/json' });

        // Create a File object from the blob
        const files = [
            new File([blob], 'certificate-metadata.json')
        ];

        // Upload to IPFS via web3.storage
        const cid = await client.put(files);

        return cid;
    } catch (error) {
        console.error('Error storing certificate metadata:', error);
        throw error;
    }
}

/**
 * Retrieve certificate metadata from IPFS
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Object>} - Certificate metadata
 */
export async function retrieveCertificateMetadata(cid) {
    if (!client) {
        throw new Error('Storage client not initialized. Call initializeStorage first.');
    }

    try {
        // Get the data from IPFS
        const res = await fetch(`https://${cid}.ipfs.dweb.link/certificate-metadata.json`);

        if (!res.ok) {
            throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
        }

        // Parse the JSON data
        const metadata = await res.json();
        return metadata;
    } catch (error) {
        console.error('Error retrieving certificate metadata:', error);
        throw error;
    }
}

/**
 * Generate a metadata object for a certificate
 * @param {Object} data - Certificate data
 * @returns {Object} - Formatted metadata object
 */
export function formatCertificateMetadata(data) {
    return {
        schema: "https://verichain.io/schemas/certificate/v1",
        recipient: {
            name: data.recipientName,
            wallet: data.recipientWallet,
        },
        credential: {
            title: data.credentialTitle,
            description: data.description || "",
            issueDate: data.issueDate,
            expiryDate: data.expiryDate || null,
        },
        issuer: {
            name: data.issuerName,
            website: data.issuerWebsite || "",
            wallet: data.issuerWallet,
        },
        additional: data.additionalInfo || {},
        timestamp: new Date().toISOString(),
    };
}