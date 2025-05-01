import { Web3Storage } from 'web3.storage';

// Initialize Web3Storage client
let client;

/**
 * Initialize the web3.storage client with an API token
 * @param {string} token - web3.storage API token
 * @returns {boolean} - Whether initialization was successful
 */
export function initializeStorage(token) {
    if (!token) {
        console.warn('No Web3.Storage token provided. IPFS storage will be unavailable.');
        return false;
    }

    try {
        client = new Web3Storage({ token });
        console.log('Web3.Storage initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Web3.Storage:', error);
        return false;
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
        console.log('Preparing certificate metadata for IPFS storage');

        // Create a JSON blob from the certificate data
        const blob = new Blob([JSON.stringify(certificateData, null, 2)], {
            type: 'application/json'
        });

        // Create a File object from the blob with a unique name using timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const files = [
            new File([blob], `certificate-${timestamp}.json`)
        ];

        // Upload to IPFS via web3.storage with progress tracking
        console.log('Uploading to IPFS...');
        const cid = await client.put(files, {
            name: `VeriChain Certificate ${timestamp}`,
            onRootCidReady: (rootCid) => {
                console.log('Root CID:', rootCid);
            },
            onStoredChunk: (bytes) => {
                console.log(`Stored chunk of ${bytes.toLocaleString()} bytes`);
            }
        });

        console.log('Successfully stored certificate metadata with CID:', cid);
        return cid;
    } catch (error) {
        console.error('Error storing certificate metadata:', error);
        throw error;
    }
}

/**
 * Retrieve certificate metadata from IPFS
 * @param {string} cidOrUri - IPFS Content Identifier or ipfs:// URI
 * @returns {Promise<Object>} - Certificate metadata
 */
export async function retrieveCertificateMetadata(cidOrUri) {
    if (!cidOrUri) {
        throw new Error('No CID or URI provided');
    }

    try {
        // Clean the CID if it includes the ipfs:// prefix
        const cleanCid = cidOrUri.replace('ipfs://', '');
        console.log('Retrieving metadata for CID:', cleanCid);

        // First try using web3.storage client if available
        if (client) {
            try {
                const res = await client.get(cleanCid);

                if (res && res.ok) {
                    // Get all files from this CID
                    const files = await res.files();

                    if (files && files.length > 0) {
                        // Find the JSON file (should be the only one or the first one)
                        const file = files.find(f => f.name.endsWith('.json')) || files[0];
                        const text = await file.text();
                        return JSON.parse(text);
                    }
                }
                // If we couldn't retrieve using client, fall back to gateway method
                console.log('Could not retrieve using web3.storage client, falling back to gateways');
            } catch (err) {
                console.warn('Error retrieving from web3.storage directly:', err);
                // Continue to gateway fallback
            }
        }

        // Get the data from IPFS using public gateways for redundancy
        const gateways = [
            `https://${cleanCid}.ipfs.dweb.link/certificate-metadata.json`,
            `https://ipfs.io/ipfs/${cleanCid}/certificate-metadata.json`,
            `https://gateway.pinata.cloud/ipfs/${cleanCid}/certificate-metadata.json`,
            `https://cloudflare-ipfs.com/ipfs/${cleanCid}/certificate-metadata.json`,
            `https://${cleanCid}.ipfs.nftstorage.link/`,
            // Try accessing without the certificate-metadata.json suffix
            `https://${cleanCid}.ipfs.dweb.link`,
            `https://ipfs.io/ipfs/${cleanCid}`,
            `https://gateway.pinata.cloud/ipfs/${cleanCid}`,
            `https://cloudflare-ipfs.com/ipfs/${cleanCid}`
        ];

        let response = null;
        let errorMessages = [];

        // Try each gateway until one works
        for (const gateway of gateways) {
            try {
                console.log(`Trying gateway: ${gateway}`);
                const res = await fetch(gateway, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (res.ok) {
                    response = res;
                    console.log(`Successfully retrieved from ${gateway}`);
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
        try {
            return await response.json();
        } catch (jsonError) {
            // If JSON parsing fails, return the text content
            const text = await response.text();
            console.error('Error parsing JSON:', jsonError);
            console.log('Raw response:', text);
            throw new Error('Failed to parse metadata JSON');
        }
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
    // Add timestamp and version information
    const timestamp = new Date().toISOString();

    return {
        schema: "https://verichain.io/schemas/certificate/v1",
        recipient: {
            name: data.recipientName || "Unknown Recipient",
            wallet: data.recipientWallet,
        },
        credential: {
            title: data.credentialTitle || "Blockchain Certificate",
            description: data.description || "",
            issueDate: data.issueDate || timestamp,
            expiryDate: data.expiryDate || null,
            type: data.credentialType || "Certificate",
        },
        issuer: {
            name: data.issuerName || "VeriChain Institution",
            website: data.issuerWebsite || "",
            wallet: data.issuerWallet,
            logo: data.issuerLogo || null,
        },
        additional: data.additionalInfo || {},
        verification: {
            type: "blockchain",
            network: process.env.NEXT_PUBLIC_CHAIN_NAME || "Polygon Amoy Testnet",
            contractAddress: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS,
        },
        metadata: {
            version: "1.0.0",
            created: timestamp,
            updated: timestamp,
        }
    };
}