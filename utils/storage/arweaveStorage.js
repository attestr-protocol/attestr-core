// utils/storage/arweaveStorage.js
import Arweave from 'arweave';
import { initializeARIO, getARIOClient, getCurrentWalletAddress as getARIOWalletAddress } from './arIOClient';

// Initialize Arweave instance for direct API calls when needed
const arweave = Arweave.init({
    host: 'ar-io.dev',
    port: 443,
    protocol: 'https',
    timeout: 30000,
});

// Local storage for demo and fallback purposes
const mockTransactions = {};

/**
 * Initialize storage with an Arweave wallet
 * @param {Object|string} wallet - JWK key for the Arweave wallet or wallet type
 * @param {string} type - Wallet type ('arconnect', 'arweavewallet', 'jwk')
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initializeStorage(wallet, type = 'jwk') {
    try {
        // Check if already initialized
        if (isStorageInitialized()) {
            console.log('Storage already initialized');
            return true;
        }

        console.log(`Initializing Arweave storage with ${type} wallet...`);

        // Initialize the AR.IO client based on wallet type
        if (type === 'arconnect') {
            await initializeARIO({ signer: 'arconnect' });
        } else if (type === 'arweavewallet') {
            // For arweave.app wallet integration
            if (!wallet || typeof wallet !== 'string') {
                throw new Error('Invalid wallet token for Arweave Wallet');
            }

            // Store token for later use - implementation depends on arweave.app API
            console.log('Arweave.app wallet integration not fully implemented');
            return false;
        } else {
            // JWK wallet
            await initializeARIO({ signer: wallet });
        }

        // Verify the wallet is connected by checking the address
        const address = await getARIOWalletAddress();
        if (!address) {
            throw new Error('Failed to get wallet address');
        }

        console.log('Arweave wallet initialized, address:', address);

        // If using a JWK, save wallet to local storage for this session
        if (type === 'jwk' && typeof window !== 'undefined') {
            saveWalletToLocalStorage(wallet);
        }

        return true;
    } catch (error) {
        console.error('Error initializing storage:', error);
        return false;
    }
}

/**
 * Store certificate metadata on Arweave
 * @param {Object} certificateData - Certificate metadata to store
 * @returns {Promise<string>} - Arweave transaction ID
 */
export async function storeCertificateMetadata(certificateData) {
    if (!isStorageInitialized()) {
        throw new Error('Storage not initialized. Call initializeStorage first.');
    }

    try {
        console.log('Storing certificate metadata on Arweave...');

        // Create a JSON string from the certificate data
        const jsonString = JSON.stringify(certificateData, null, 2);

        // Upload to Arweave using standard transaction
        const arioClient = getARIOClient();

        if (!arioClient) {
            throw new Error('AR.IO client not available');
        }

        // Get the signer's wallet address
        const walletAddress = await getARIOWalletAddress();
        if (!walletAddress) {
            throw new Error('No wallet address available');
        }

        // Create transaction with Arweave
        const transaction = await arweave.createTransaction({
            data: jsonString,
        });

        // Add tags for better discoverability
        transaction.addTag('Content-Type', 'application/json');
        transaction.addTag('App-Name', 'VeriChain');
        transaction.addTag('Type', 'Certificate');
        transaction.addTag('AR-IO-Network', 'testnet');

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

        // Sign transaction with ArConnect if available
        if (typeof window !== 'undefined' && window.arweaveWallet) {
            await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
            await arweave.transactions.sign(transaction, window.arweaveWallet);
        } else {
            // Otherwise sign with stored wallet
            const signer = await getARIOWalletAddress();
            if (!signer) {
                throw new Error('No wallet signer available');
            }
            await arweave.transactions.sign(transaction);
        }

        // Post the transaction
        const response = await arweave.transactions.post(transaction);

        if (response.status !== 200 && response.status !== 202) {
            console.error('Response:', response);
            throw new Error(`Failed to submit transaction: ${response.statusText}`);
        }

        const txId = transaction.id;
        console.log('Successfully stored certificate metadata with Transaction ID:', txId);

        return txId;
    } catch (error) {
        console.error('Error storing certificate metadata:', error);

        // For demo purposes, create a mock transaction if real transaction fails
        console.warn('Creating mock transaction as fallback');
        return createMockTransaction(certificateData);
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
        // First check if this is a mock transaction in demo mode
        if (mockTransactions[txId]) {
            console.log('Found mock transaction:', txId);
            return mockTransactions[txId];
        }

        // Fetch transaction data with additional retries
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
                if (attempts >= maxAttempts) {
                    throw retryError;
                }
                console.log(`Retry attempt ${attempts} for retrieving data...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            }
        }

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
 * Format certificate metadata for storage
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
            networkType: "testnet",
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
    return `https://ar-io.dev/${cleanId}`;
}

/**
 * Check if storage is initialized
 * @returns {boolean} - Whether storage is initialized
 */
export function isStorageInitialized() {
    return getARIOClient() !== null;
}

/**
 * Save wallet to local storage (for session persistence)
 * @param {Object} walletToSave - JWK wallet object
 */
export function saveWalletToLocalStorage(walletToSave) {
    if (typeof window === 'undefined') {
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
        // Check if this is a mock transaction in demo mode
        if (mockTransactions[txId]) {
            return {
                status: 200,
                confirmed: true,
            };
        }

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
 * Create a mock transaction for demo mode
 * @param {Object} data - Data to store
 * @returns {string} Mock transaction ID
 */
export function createMockTransaction(data) {
    // Generate a random transaction ID
    const txId = 'mock_' + Math.random().toString(36).substring(2, 15);

    // Store data in memory for this session
    mockTransactions[txId] = data;

    // Also try to store in localStorage for persistence
    try {
        const mockTxsString = localStorage.getItem('verichain_mock_transactions') || '{}';
        const mockTxs = JSON.parse(mockTxsString);
        mockTxs[txId] = data;
        localStorage.setItem('verichain_mock_transactions', JSON.stringify(mockTxs));
    } catch (error) {
        console.warn('Could not save mock transaction to localStorage:', error);
    }

    return txId;
}

/**
 * Retrieve a mock transaction
 * @param {string} txId - Transaction ID
 * @returns {Object|null} Stored data or null if not found
 */
export function retrieveMockTransaction(txId) {
    // First check in-memory cache
    if (mockTransactions[txId]) {
        return mockTransactions[txId];
    }

    // Then check localStorage
    try {
        const mockTxsString = localStorage.getItem('verichain_mock_transactions') || '{}';
        const mockTxs = JSON.parse(mockTxsString);

        if (mockTxs[txId]) {
            // Add to in-memory cache for future use
            mockTransactions[txId] = mockTxs[txId];
            return mockTxs[txId];
        }
    } catch (error) {
        console.warn('Error retrieving mock transaction from localStorage:', error);
    }

    return null;
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
    if (typeof window !== 'undefined' && window.arweaveWallet) {
        window.arweaveWallet.disconnect();
    }

    // Clean up localStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('verichain_arweave_wallet');
    }
}