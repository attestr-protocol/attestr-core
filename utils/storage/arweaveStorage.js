// utils/storage/arweaveStorage.js
import Arweave from 'arweave';

// Initialize Arweave instance with configurable host
const arweave = Arweave.init({
    host: process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'ar-io.net',
    port: 443,
    protocol: 'https',
    timeout: 30000, // Increased timeout for testnet
    logging: false,
});

// State variables
let wallet = null;
let isInitialized = false;
let connectedWalletType = null; // 'arconnect', 'arweavewallet', 'jwk'

// Local storage for demo purpose
const mockTransactions = {};

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

        console.log(`Initializing Arweave storage with ${type} wallet...`);

        // Set wallet type
        connectedWalletType = type;

        if (type === 'arconnect') {
            // Initialize with ArConnect
            if (!window.arweaveWallet) {
                throw new Error('ArConnect extension not found. Please install it first.');
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
                console.warn('Using temporary wallet. Note: This wallet will need tokens.');
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
                        console.warn('WARNING: Wallet balance very low for transactions');
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
        console.log('Storing certificate metadata on Arweave...');

        // Create a JSON string from the certificate data
        const jsonString = JSON.stringify(certificateData, null, 2);

        // Calculate size-based fee - important to convert to string-integer format
        const length = jsonString.length;
        // Convert to winston - a simple approximation
        const winstonReward = Math.ceil(length * 1000).toString();

        let transaction;

        if (connectedWalletType === 'arconnect') {
            // Create transaction for ArConnect
            transaction = await arweave.createTransaction({
                data: jsonString,
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

            // Post the transaction
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
                if (attempts >= maxAttempts) throw retryError;
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

/**
 * Execute a GraphQL query against the Arweave gateway
 * Merged from previous graphqlQueries.js
 * 
 * @param {Object} query - GraphQL query object
 * @param {string} endpoint - GraphQL endpoint URL (default: arweave.net/graphql)
 * @returns {Promise<Object>} Query results
 */
export async function executeQuery(query, endpoint = null) {
    const url = endpoint || `https://${process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'ar-io.net'}/graphql`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query),
        });

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error executing GraphQL query:', error);
        throw error;
    }
}

/**
 * Build a GraphQL query to fetch VeriChain certificates
 * Merged from previous graphqlQueries.js
 * 
 * @param {Object} options - Query options
 * @param {number} options.first - Number of results to return (default: 100, max: 100)
 * @param {Array} options.tags - Array of tag objects with name and value(s)
 * @param {Array} options.owners - Array of wallet addresses
 * @param {Array} options.recipients - Array of recipient wallet addresses
 * @param {string} options.after - Cursor for pagination
 * @returns {Object} GraphQL query object
 */
export function buildCertificateQuery({
    first = 100,
    tags = [],
    owners = [],
    recipients = [],
    after = null
} = {}) {
    // Start with standard tags that identify VeriChain certificates
    const defaultTags = [
        { name: 'App-Name', values: ['VeriChain'] },
        { name: 'Type', values: ['Certificate'] },
    ];

    // Combine default tags with any user-provided tags
    const allTags = [...defaultTags, ...tags];

    // Add recipient tags if provided
    if (recipients && recipients.length > 0) {
        allTags.push({ name: 'Recipient', values: recipients });
    }

    // Build the tags filter
    const tagsFilter = allTags.map(tag => {
        return `{ name: "${tag.name}", values: [${tag.values.map(v => `"${v}"`).join(', ')}] }`;
    }).join(', ');

    // Build owners filter if provided
    const ownersFilter = owners && owners.length > 0
        ? `owners: [${owners.map(owner => `"${owner}"`).join(', ')}]`
        : '';

    // Add after cursor for pagination if provided
    const afterFilter = after ? `after: "${after}"` : '';

    // Combine all filters
    const filters = [
        `first: ${first}`,
        tagsFilter ? `tags: [${tagsFilter}]` : '',
        ownersFilter,
        afterFilter
    ].filter(Boolean).join(', ');

    // Build the complete query
    return {
        query: `
      query {
        transactions(${filters}) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              owner {
                address
              }
              data {
                size
              }
              tags {
                name
                value
              }
              block {
                height
                timestamp
              }
            }
          }
        }
      }
    `
    };
}

/**
 * Get user's certificates from Arweave
 * 
 * @param {string} walletAddress - User's wallet address
 * @param {string} role - 'issuer' or 'recipient'
 * @returns {Promise<Array>} List of certificates
 */
export async function getUserCertificates(walletAddress, role = 'recipient') {
    try {
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }

        // Build query based on role
        const queryOptions = {
            first: 100,
            tags: [],
        };

        if (role === 'issuer') {
            queryOptions.owners = [walletAddress];
        } else if (role === 'recipient') {
            queryOptions.tags.push({ name: 'Recipient', values: [walletAddress] });
        } else {
            throw new Error('Invalid role. Must be "issuer" or "recipient"');
        }

        const query = buildCertificateQuery(queryOptions);
        const result = await executeQuery(query);

        if (!result.data || !result.data.transactions || !result.data.transactions.edges) {
            return [];
        }

        // Process and return certificates
        return Promise.all(
            result.data.transactions.edges.map(async (edge) => {
                const { node } = edge;
                // Extract certificate data from node
                const certificate = {
                    id: node.id,
                    issuer: node.owner.address,
                    recipient: node.tags.find(tag => tag.name === 'Recipient')?.value,
                    title: node.tags.find(tag => tag.name === 'Certificate-Title')?.value || 'Untitled Certificate',
                    timestamp: node.block?.timestamp
                        ? new Date(node.block.timestamp * 1000).toISOString()
                        : null,
                    arweaveUri: `ar://${node.id}`,
                    viewUrl: getGatewayUrl(node.id)
                };

                // Try to get metadata if available
                try {
                    const metadata = await retrieveCertificateMetadata(`ar://${node.id}`);
                    certificate.metadata = metadata;
                } catch (error) {
                    console.warn(`Failed to retrieve metadata for certificate ${node.id}:`, error);
                }

                return certificate;
            })
        );
    } catch (error) {
        console.error('Error getting user certificates:', error);
        throw error;
    }
}