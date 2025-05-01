// utils/storage/ipfsStorage.js
import * as Client from '@web3-storage/w3up-client';

// Store the client instance
let client;
let currentSpace;
let isAuthorized = false;

/**
 * Initialize the web3.storage client with an email address
 * @param {string} email - User email for w3up authorization
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeStorage(email) {
    if (!email) {
        console.warn('No email provided for web3.storage. IPFS storage will be unavailable.');
        return false;
    }

    try {
        // Create the w3up client
        console.log('Initializing w3up client...');
        client = await Client.create();

        // Check if we have an existing space or need to create one
        const spaces = await client.spaces();

        if (spaces.length === 0) {
            // Need to set up a new space and authorize
            console.log('No existing spaces found. Setting up new space...');

            // Create a new space
            const spaceName = 'verichain-space';
            const space = await client.createSpace(spaceName);

            // Set as current space
            await client.setCurrentSpace(space.did());
            currentSpace = space;

            // Authorize and register the space
            try {
                console.log(`Authorizing with email: ${email}`);
                // This will send a verification email to the user
                await client.authorize(email);
                isAuthorized = true;

                // Register the space with the authorized email
                await client.registerSpace(email);

                console.log('Space created, authorized and registered successfully');
            } catch (authError) {
                console.error('Authorization or registration failed:', authError);
                return false;
            }
        } else {
            // Use existing space
            currentSpace = spaces[0];
            await client.setCurrentSpace(currentSpace.did());
            console.log('Using existing space:', currentSpace.did());
            isAuthorized = true;
        }

        console.log('w3up client initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize w3up client:', error);
        return false;
    }
}

/**
 * Store certificate metadata on IPFS
 * @param {Object} certificateData - Certificate metadata to store
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
export async function storeCertificateMetadata(certificateData) {
    if (!client || !isAuthorized) {
        throw new Error('Storage client not initialized or not authorized. Call initializeStorage first.');
    }

    try {
        console.log('Storing certificate metadata on IPFS...');

        // Create a JSON string from the certificate data
        const jsonString = JSON.stringify(certificateData, null, 2);

        // Create a File object from the JSON string
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `certificate-${timestamp}.json`;
        const file = new File([jsonString], fileName, { type: 'application/json' });

        // Upload the file using the client
        const uploadResult = await client.uploadFile(file);

        // Get the CID from the result
        const cid = uploadResult.toString();
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

        // Use the w3up gateway to access the file
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