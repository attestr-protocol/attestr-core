// utils/storage/arweaveStorage.js
import Arweave from 'arweave';

// Initialize Arweave instance with the AR.io testnet settings
const arweave = Arweave.init({
    host: 'ar-io.net',
    port: 443,
    protocol: 'https',
    timeout: 30000, // Increased timeout for testnet
    logging: true, // Enable logging for better debugging
});

// State variables
let wallet = null;
let isInitialized = false;
let connectedWalletType = null; // 'arconnect', 'arweavewallet', 'jwk'

/**
 * Initialize storage with Arweave wallet
 * @param {Object|string} key - JWK key for the Arweave wallet or wallet type
 * @param {string} type - Wallet type ('arconnect', 'arweavewallet', 'jwk')
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeStorage(key, type = 'jwk') {
    try {
        if (isInitialized) {
            console.log('Arweave storage already initialized');
            return true;
        }

        console.log(`Initializing Arweave storage on AR.io testnet with ${type} wallet...`);

        // Set wallet type
        connectedWalletType = type;

        if (type === 'arconnect') {
            // Initialize with ArConnect
            if (!window.arweaveWallet) {
                throw new Error('ArConnect/Wander extension not found. Please install it first.');
            }

            // Request permission
            await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);

            // Success - we'll use window.arweaveWallet for transactions
            wallet = { type: 'arconnect' };
            isInitialized = true;

            // Get address for display
            const address = await getCurrentWalletAddress();
            console.log('ArConnect wallet connected, address:', address);

            return true;
        }
        else if (type === 'arweavewallet') {
            // Initialize with Arweave.app/ArweaveWallet
            if (!key || typeof key !== 'string') {
                throw new Error('Invalid wallet token for Arweave Wallet');
            }

            // Store token for later use
            wallet = { type: 'arweavewallet', token: key };
            isInitialized = true;

            console.log('Arweave.app wallet connected');
            return true;
        }
        else {
            // Initialize with JWK
            if (!key) {
                // Generate a temporary wallet if not provided
                wallet = await arweave.wallets.generate();
                console.warn('Using temporary wallet on AR.io testnet. Note: This wallet will need testnet tokens.');
            } else {
                // If key is provided as a JWK or JWK-string
                try {
                    wallet = typeof key === 'string' ? JSON.parse(key) : key;
                } catch (e) {
                    console.error('Error parsing wallet key:', e);
                    return false;
                }
            }

            // Validate the wallet connection by checking the address
            try {
                const address = await arweave.wallets.jwkToAddress(wallet);
                console.log('Arweave wallet initialized, address:', address);

                // Get wallet balance
                try {
                    const winston = await arweave.wallets.getBalance(address);
                    const ar = arweave.ar.winstonToAr(winston);
                    console.log(`Wallet balance: ${ar} AR`);

                    // Warn if balance is too low
                    if (parseFloat(ar) < 0.00001) {
                        console.warn('WARNING: Wallet balance very low for transactions on AR.io testnet');
                    }
                } catch (balanceErr) {
                    console.warn('Could not check wallet balance:', balanceErr);
                    // Continue anyway since the wallet might still be valid
                }

                isInitialized = true;

                // Save wallet to local storage for this session
                saveWalletToLocalStorage(wallet);

                return true;
            } catch (error) {
                console.error('Error validating Arweave wallet:', error);
                return false;
            }
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
        console.log('Storing certificate metadata on AR.io testnet...');

        // Create a JSON string from the certificate data
        const jsonString = JSON.stringify(certificateData, null, 2);

        // Calculate size-based fee - important to convert to string-integer format
        const length = jsonString.length;
        // Convert to winston - a simple approximation for testnet
        // Must be a string integer for AR.io testnet
        const winstonReward = Math.ceil(length * 1000).toString();

        let transaction;

        if (connectedWalletType === 'arconnect') {
            // Create transaction for ArConnect
            transaction = await arweave.createTransaction({
                data: jsonString,
                // Use the winston reward as a string
                reward: winstonReward
            });

            // Add tags
            addCertificateTags(transaction, certificateData);

            // Sign using ArConnect/Wander
            await window.arweaveWallet.sign(transaction);

            // Post the transaction
            const response = await arweave.transactions.post(transaction);

            if (response.status !== 200 && response.status !== 202) {
                console.error('Response:', response);
                throw new Error(`Failed to submit transaction: ${response.statusText}`);
            }
        }
        else if (connectedWalletType === 'arweavewallet') {
            // Creating and submitting transactions with Arweave Wallet is handled differently
            // This would typically involve an API call to their service
            throw new Error('Arweave Wallet integration not fully implemented');
        }
        else {
            // Create transaction with JWK
            transaction = await arweave.createTransaction({
                data: jsonString,
                // Use the winston reward as a string
                reward: winstonReward
            }, wallet);

            // Add tags
            addCertificateTags(transaction, certificateData);

            // Sign transaction
            await arweave.transactions.sign(transaction, wallet);

            // Log transaction details for debugging
            console.log('Transaction created and signed:', {
                id: transaction.id,
                reward: transaction.reward,
                dataSize: jsonString.length
            });

            // For AR.io testnet, post directly instead of using uploader
            const response = await arweave.transactions.post(transaction);

            if (response.status !== 200 && response.status !== 202) {
                console.error('Response:', response);
                throw new Error(`Failed to submit transaction: ${response.statusText}`);
            }
        }

        const txId = transaction.id;
        console.log('Successfully stored certificate metadata with Transaction ID:', txId);

        return txId;
    } catch (error) {
        console.error('Error storing certificate metadata:', error);
        // Provide more detailed error info
        if (error.response) {
            console.error('Server response:', error.response.status, error.response.data);
        }
        throw error;
    }
}

/**
 * Add standard certificate tags to a transaction
 * @param {Object} transaction - Arweave transaction
 * @param {Object} certificateData - Certificate data
 */
function addCertificateTags(transaction, certificateData) {
    // Add tags for better discoverability
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('App-Name', 'VeriChain');
    transaction.addTag('Type', 'Certificate');
    transaction.addTag('Environment', 'AR.io-Testnet');

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
        // Fetch transaction data with additional retries for testnet
        let attempts = 0;
        const maxAttempts = 3;
        let data;

        while (attempts < maxAttempts) {
            try {
                data = await arweave.transactions.getData(txId, {
                    decode: true,
                    string: true
                });
                break; // Success, exit the loop
            } catch (retryError) {
                attempts++;
                if (attempts >= maxAttempts) throw retryError;
                console.log(`Retry attempt ${attempts} for retrieving data...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            }
        }

        // Parse the JSON data
        const metadata = JSON.parse(data);
        console.log('Successfully retrieved metadata from AR.io testnet');
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
            storage: "arweave-testnet",
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
    return `https://ar-io.net/${cleanId}`;
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
    if (!isInitialized) {
        return null;
    }

    try {
        if (connectedWalletType === 'arconnect') {
            return await window.arweaveWallet.getActiveAddress();
        }
        else if (connectedWalletType === 'arweavewallet') {
            // Arweave Wallet does not have a direct method for this
            return 'Arweave.app Wallet';
        }
        else {
            return await arweave.wallets.jwkToAddress(wallet);
        }
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
}

/**
 * Get the connected wallet type
 * @returns {string|null} Wallet type ('arconnect', 'arweavewallet', 'jwk') or null if not initialized
 */
export function getConnectedWalletType() {
    return connectedWalletType;
}

/**
 * Save wallet to local storage (for session persistence)
 * @param {Object} walletToSave - JWK wallet object
 */
export function saveWalletToLocalStorage(walletToSave) {
    if (typeof window === 'undefined' || connectedWalletType !== 'jwk') {
        return;
    }

    try {
        localStorage.setItem('verichain_arweave_wallet', JSON.stringify(walletToSave));
    } catch (error) {
        console.error('Error saving wallet to local storage:', error);
    }
}

/**
 * Load wallet from local storage
 * @returns {Object|null} JWK wallet object or null if not found
 */
export function loadWalletFromLocalStorage() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const storedWallet = localStorage.getItem('verichain_arweave_wallet');
        return storedWallet ? JSON.parse(storedWallet) : null;
    } catch (error) {
        console.error('Error loading wallet from local storage:', error);
        return null;
    }
}

/**
 * Get transaction status from Arweave
 * @param {string} txId - Arweave transaction ID
 * @returns {Promise<Object>} Transaction status information
 */
export async function getTransactionStatus(txId) {
    try {
        const status = await arweave.transactions.getStatus(txId);
        return {
            status: status.status,
            confirmed: status.confirmed,
        };
    } catch (error) {
        console.error('Error checking transaction status:', error);
        throw error;
    }
}

/**
 * Check if a wallet extension is available
 * @param {string} type - 'arconnect' or 'arweavewallet'
 * @returns {boolean} Whether the extension is available
 */
export function isWalletExtensionAvailable(type) {
    if (typeof window === 'undefined') {
        return false;
    }

    if (type === 'arconnect') {
        return !!window.arweaveWallet;
    }

    return false;
}

/**
 * Disconnect current wallet
 */
export function disconnectWallet() {
    if (connectedWalletType === 'arconnect' && window.arweaveWallet) {
        window.arweaveWallet.disconnect();
    }

    wallet = null;
    isInitialized = false;
    connectedWalletType = null;

    // Clear from localStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('verichain_arweave_wallet');
    }
}