// utils/storage/arweaveStorage.js
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';

// Initialize Arweave instance
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
});

// State variables
let wallet = null;
let isInitialized = false;

/**
 * Initialize storage with Arweave wallet
 * @param {string} key - JWK key for the Arweave wallet (can be an auth token for wrapper services)
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeStorage(key) {
    try {
        if (isInitialized) {
            console.log('Arweave storage already initialized');
            return true;
        }

        console.log('Initializing Arweave storage...');

        if (!key) {
            // For demo/dev purposes, generate a temporary wallet
            // Note: in production, you would use a real wallet
            wallet = await arweave.wallets.generate();
            console.warn('Using temporary wallet. In production, use a permanent wallet.');
        } else {
            // If key is provided as a JWK or JWK-string
            try {
                wallet = typeof key === 'string' ? JSON.parse(key) : key;
            } catch (e) {
                // If it's not a valid JWK, use it as an auth token for a wrapper service
                wallet = { auth: key };
            }
        }

        // Validate the wallet connection by checking the address
        try {
            const address = await arweave.wallets.jwkToAddress(wallet);
            console.log('Arweave wallet initialized, address:', address);

            // Check balance - this will fail if the wallet/connection is invalid
            const balance = await arweave.wallets.getBalance(address);
            console.log('Wallet balance:', arweave.ar.winstonToAr(balance), 'AR');

            isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error validating Arweave wallet:', error);
            return false;
        }
    } catch (error) {
        console.error('Error initializing Arweave storage:', error);
        return false;
    }
}

/**
 * Store certificate metadata on Arweave
 * @param {Object} certificateData - Certificate metadata to store
 * @returns {Promise<string>} - Arweave transaction ID
 */
export async function storeCertificateMetadata(certificateData) {
    if (!isInitialized) {
        throw new Error('Storage not initialized. Call initializeStorage first.');
    }

    try {
        console.log('Storing certificate metadata on Arweave...');

        // Create a JSON string from the certificate data
        const jsonString = JSON.stringify(certificateData, null, 2);

        // Create transaction
        const transaction = await arweave.createTransaction({
            data: jsonString,
        }, wallet);

        // Add tags for better discoverability
        transaction.addTag('Content-Type', 'application/json');
        transaction.addTag('App-Name', 'VeriChain');
        transaction.addTag('Type', 'Certificate');

        // Add certificate-specific tags for easier querying
        if (certificateData.credential?.title) {
            transaction.addTag('Certificate-Title', certificateData.credential.title);
        }
        if (certificateData.issuer?.name) {
            transaction.addTag('Issuer', certificateData.issuer.name);
        }
        if (certificateData.recipient?.wallet) {
            transaction.addTag('Recipient', certificateData.recipient.wallet);
        }

        // Sign the transaction
        await arweave.transactions.sign(transaction, wallet);

        // Submit the transaction
        const response = await arweave.transactions.post(transaction);

        if (response.status !== 200 && response.status !== 202) {
            throw new Error(`Failed to submit transaction: ${response.statusText}`);
        }

        const txId = transaction.id;
        console.log('Successfully stored certificate metadata with Transaction ID:', txId);

        return txId;
    } catch (error) {
        console.error('Error storing certificate metadata:', error);
        throw error;
    }
}

/**
 * Retrieve certificate metadata from Arweave
 * @param {string} arweaveIdOrUri - Arweave Transaction ID or ar:// URI
 * @returns {Promise<Object>} - Certificate metadata
 */
export async function retrieveCertificateMetadata(arweaveIdOrUri) {
    if (!arweaveIdOrUri) {
        throw new Error('No Arweave ID or URI provided');
    }

    // Clean the ID if it includes the ar:// prefix
    const txId = arweaveIdOrUri.replace('ar://', '');
    console.log('Retrieving metadata for Transaction ID:', txId);

    try {
        // Fetch transaction data
        const data = await arweave.transactions.getData(txId, {
            decode: true,
            string: true
        });

        // Parse the JSON data
        const metadata = JSON.parse(data);
        console.log('Successfully retrieved metadata from Arweave');
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
            storage: "arweave",
            created: timestamp,
            updated: timestamp,
        }
    };
}

/**
 * Get the gateway URL for a transaction ID
 * @param {string} txId - Arweave Transaction ID
 * @returns {string} - Gateway URL
 */
export function getGatewayUrl(txId) {
    if (!txId) {
        return '';
    }
    // Clean the ID if it includes the ar:// prefix
    const cleanId = txId.replace('ar://', '');
    return `https://arweave.net/${cleanId}`;
}

/**
 * Check if storage is initialized
 * @returns {boolean} - Whether storage is initialized
 */
export function isStorageInitialized() {
    return isInitialized;
}

/**
 * Get the current wallet address
 * @returns {Promise<string|null>} - Current wallet address or null if not initialized
 */
export async function getCurrentWalletAddress() {
    if (!isInitialized || !wallet) {
        return null;
    }
    try {
        return await arweave.wallets.jwkToAddress(wallet);
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
}

/**
 * Search for certificates by recipient address
 * @param {string} recipientAddress - Blockchain address of the recipient
 * @returns {Promise<Array>} - Array of matching transaction IDs
 */
export async function searchCertificatesByRecipient(recipientAddress) {
    try {
        // Use Arweave GraphQL to search for certificates with matching recipient tag
        const query = `
        query {
            transactions(
            tags: [
                { name: "App-Name", values: ["VeriChain"] },
                { name: "Type", values: ["Certificate"] },
                { name: "Recipient", values: ["${recipientAddress}"] }
            ]
            ) {
            edges {
                node {
                id
                tags {
                    name
                    value
                }
                }
            }
            }
        }
        `;

        const response = await fetch('https://arweave.net/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data.transactions.edges.map(edge => edge.node.id);
    } catch (error) {
        console.error('Error searching for certificates:', error);
        return [];
    }
}