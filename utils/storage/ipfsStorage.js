// utils/storage/ipfsStorage.js

/**
 * This implementation uses tokens generated from the CLI
 * Run the following command to generate tokens:
 * w3 bridge generate-tokens YOUR_SPACE_DID --can 'store/add' --can 'upload/add' --can 'upload/list' --expiration $(date -v +24H +%s)
 */

// Replace these with the values from w3 bridge generate-tokens command
const AUTH_SECRET = process.env.NEXT_PUBLIC_W3_AUTH_SECRET || "";
const AUTH_TOKEN = process.env.NEXT_PUBLIC_W3_AUTH_TOKEN || "";
const SPACE_DID = process.env.NEXT_PUBLIC_W3_SPACE_DID || "";

// Track initialization state
let isInitialized = false;

/**
 * Initialize storage with auth tokens from CLI
 * @param {string} email - Not used with CLI approach
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeStorage(email) {
    console.log('Initializing storage with CLI-generated tokens');

    // Check if we have the required tokens
    if (!AUTH_SECRET || !AUTH_TOKEN || !SPACE_DID) {
        console.error('Missing required auth tokens. Please run CLI commands and set environment variables.');
        return false;
    }

    try {
        // Validate tokens by making a test request
        const isValid = await validateTokens();
        if (isValid) {
            isInitialized = true;
            console.log('Storage initialized with CLI tokens successfully');
            return true;
        } else {
            console.error('Auth tokens are invalid or expired. Please regenerate using the CLI.');
            return false;
        }
    } catch (error) {
        console.error('Error initializing storage:', error);
        return false;
    }
}

/**
 * Validate authentication tokens by making a test request
 */
async function validateTokens() {
    try {
        // Create a request to list uploads to verify tokens
        const response = await fetch('https://up.storacha.network/bridge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Secret': AUTH_SECRET,
                'Authorization': AUTH_TOKEN
            },
            body: JSON.stringify({
                tasks: [
                    [
                        "upload/list",
                        SPACE_DID,
                        {}
                    ]
                ]
            })
        });

        if (!response.ok) {
            console.error('Token validation failed:', await response.text());
            return false;
        }

        const data = await response.json();
        console.log('Token validation successful');
        return true;
    } catch (error) {
        console.error('Error validating tokens:', error);
        return false;
    }
}

/**
 * Store certificate metadata on IPFS
 * @param {Object} certificateData - Certificate metadata to store
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
export async function storeCertificateMetadata(certificateData) {
    if (!isInitialized) {
        throw new Error('Storage not initialized. Call initializeStorage first.');
    }

    try {
        console.log('Storing certificate metadata on IPFS...');

        // Create a JSON string from the certificate data
        const jsonString = JSON.stringify(certificateData, null, 2);

        // Create a File object from the JSON string
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `certificate-${timestamp}.json`;

        // Create a blob with the JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], fileName, { type: 'application/json' });

        // Convert file to a CAR file format
        const { car, rootCid } = await fileToCAR(file);

        // Upload the CAR file using the HTTP bridge
        const cid = await uploadToStoracha(car, rootCid.toString());
        console.log('Successfully stored certificate metadata with CID:', cid);

        return cid;
    } catch (error) {
        console.error('Error storing certificate metadata:', error);
        throw error;
    }
}

/**
 * Convert a file to CAR format
 * @param {File} file - The file to convert
 * @returns {Promise<{car: Blob, rootCid: CID}>} - The CAR file and its root CID
 */
async function fileToCAR(file) {
    // This requires external libraries to be loaded
    // For a simplified implementation, use the web3.storage packToCAR function
    // https://github.com/web3-storage/w3up/blob/main/packages/upload-client/src/lib.js

    // Simplified mock implementation for demonstration
    console.log('Converting file to CAR format');

    // In a real implementation, you would use:
    // import * as CAR from '@web3-storage/upload-client';
    // const { car, rootCid } = await CAR.packToCAR([file]);

    // For now, we'll just return the file and a mock CID
    const mockCid = `bafybeideputreiy${Date.now().toString(16)}${Math.random().toString(16).substring(2, 8)}`;
    return {
        car: file,
        rootCid: { toString: () => mockCid }
    };
}

/**
 * Upload a CAR file to Storacha using the HTTP bridge
 * @param {Blob} car - The CAR file to upload
 * @param {string} rootCid - The root CID of the content
 * @returns {Promise<string>} - The CID of the uploaded content
 */
async function uploadToStoracha(car, rootCid) {
    try {
        // Calculate CAR CID and size
        const carCid = await calculateCarCid(car);
        const carSize = car.size;

        // Step 1: Request upload allocation
        const allocateResponse = await fetch('https://up.storacha.network/bridge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Secret': AUTH_SECRET,
                'Authorization': AUTH_TOKEN
            },
            body: JSON.stringify({
                tasks: [
                    [
                        "store/add",
                        SPACE_DID,
                        {
                            link: { "/": carCid },
                            size: carSize
                        }
                    ]
                ]
            })
        });

        if (!allocateResponse.ok) {
            throw new Error(`Failed to allocate upload: ${await allocateResponse.text()}`);
        }

        const allocateResult = await allocateResponse.json();
        const uploadDetails = allocateResult[0]?.p?.out?.ok;

        if (!uploadDetails) {
            throw new Error('Failed to get upload details from allocation response');
        }

        // Step 2: If status is "upload", PUT the CAR file to the provided URL
        if (uploadDetails.status === 'upload') {
            const uploadUrl = uploadDetails.url;
            const headers = uploadDetails.headers || {};

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: headers,
                body: car
            });

            if (!uploadResponse.ok) {
                throw new Error(`Failed to upload CAR: ${await uploadResponse.text()}`);
            }
        } else if (uploadDetails.status !== 'done') {
            throw new Error(`Unexpected upload status: ${uploadDetails.status}`);
        }

        // Step 3: Register the upload
        const registerResponse = await fetch('https://up.storacha.network/bridge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Secret': AUTH_SECRET,
                'Authorization': AUTH_TOKEN
            },
            body: JSON.stringify({
                tasks: [
                    [
                        "upload/add",
                        SPACE_DID,
                        {
                            root: { "/": rootCid },
                            shards: [{ "/": carCid }]
                        }
                    ]
                ]
            })
        });

        if (!registerResponse.ok) {
            throw new Error(`Failed to register upload: ${await registerResponse.text()}`);
        }

        return rootCid;
    } catch (error) {
        console.error('Error uploading to Storacha:', error);
        throw error;
    }
}

/**
 * Calculate the CID of a CAR file
 * This is a simplified mock implementation
 */
async function calculateCarCid(car) {
    // In a real implementation, you would compute the actual CID
    // For demonstration, we'll create a mock CAR CID
    return `bagbaiera${Date.now().toString(16)}${Math.random().toString(16).substring(2, 8)}`;
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

    // Clean the CID if it includes the ipfs:// prefix
    const cleanCid = cidOrUri.replace('ipfs://', '');
    console.log('Retrieving metadata for CID:', cleanCid);

    try {
        // Use the Storacha gateway to access the file
        const url = `https://w3s.link/ipfs/${cleanCid}`;
        console.log('Fetching from gateway URL:', url);

        // Fetch the file from the gateway
        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }

        // Parse the JSON data
        const data = await response.json();
        console.log('Successfully retrieved metadata from IPFS');
        return data;
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

/**
 * Get the gateway URL for a CID
 * @param {string} cid - Content Identifier
 * @returns {string} - Gateway URL
 */
export function getGatewayUrl(cid) {
    if (!cid) return '';
    // Clean the CID if it includes the ipfs:// prefix
    const cleanCid = cid.replace('ipfs://', '');
    return `https://w3s.link/ipfs/${cleanCid}`;
}

/**
 * Check if storage is initialized
 * @returns {boolean} - Whether storage is initialized
 */
export function isStorageInitialized() {
    return isInitialized;
}

/**
 * Get the current space DID
 * @returns {string|null} - Current space DID or null if not initialized
 */
export function getCurrentSpaceDid() {
    return isInitialized ? SPACE_DID : null;
}