import { Web3Storage } from 'web3.storage';

// Initialize Web3Storage client
let client;

/**
 * Initialize the web3.storage client with an API token
 * @param {string} token - web3.storage API token
 */
export function initializeStorage(token) {
    if (!token) {
        console.warn('No Web3.Storage token provided. IPFS storage will be unavailable.');
        return;
    }

    try {
        client = new Web3Storage({ token });
        console.log('Web3.Storage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Web3.Storage:', error);
    }
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
        console.log('Storing certificate metadata:', certificateData);

        // Create a JSON blob from the certificate data
        const blob = new Blob([JSON.stringify(certificateData)], { type: 'application/json' });

        // Create a File object from the blob
        const files = [
            new File([blob], 'certificate-metadata.json')
        ];

        // Upload to IPFS via web3.storage
        const cid = await client.put(files);
        console.log('Stored certificate metadata with CID:', cid);
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
    if (!cid) {
        throw new Error('No CID provided');
    }

    try {
        // Clean the CID if it includes the ipfs:// prefix
        const cleanCid = cid.replace('ipfs://', '');
        console.log('Retrieving metadata for CID:', cleanCid);

        // Get the data from IPFS - use multiple gateways for redundancy
        const gateways = [
            `https://${cleanCid}.ipfs.dweb.link/certificate-metadata.json`,
            `https://ipfs.io/ipfs/${cleanCid}/certificate-metadata.json`,
            `https://gateway.pinata.cloud/ipfs/${cleanCid}/certificate-metadata.json`
        ];

        let response = null;
        let errorMessages = [];

        // Try each gateway until one works
        for (const gateway of gateways) {
            try {
                const res = await fetch(gateway, { cache: 'no-store' });
                if (res.ok) {
                    response = res;
                    break;
                } else {
                    errorMessages.push(`Gateway ${gateway} returned ${res.status}`);
                }
            } catch (err) {
                errorMessages.push(`Gateway ${gateway} error: ${err.message}`);
            }
        }

        if (!response) {
            throw new Error(`Failed to fetch metadata from all gateways: ${errorMessages.join(', ')}`);
        }

        // Parse the JSON data
        return await response.json();
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
            name: data.issuerName || "VeriChain Institution",
            website: data.issuerWebsite || "",
            wallet: data.issuerWallet,
        },
        additional: data.additionalInfo || {},
        timestamp: new Date().toISOString(),
    };
}