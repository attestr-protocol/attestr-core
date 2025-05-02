// utils/storage/arweaveWalletUtils.js
import Arweave from 'arweave';

// Initialize Arweave instance
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
});

/**
 * Generate a new Arweave wallet
 * @returns {Promise<Object>} The generated wallet (JWK)
 */
export async function generateWallet() {
    try {
        return await arweave.wallets.generate();
    } catch (error) {
        console.error('Error generating Arweave wallet:', error);
        throw error;
    }
}

/**
 * Get the address of a wallet
 * @param {Object} wallet JWK wallet object
 * @returns {Promise<string>} The wallet address
 */
export async function getWalletAddress(wallet) {
    try {
        return await arweave.wallets.jwkToAddress(wallet);
    } catch (error) {
        console.error('Error getting wallet address:', error);
        throw error;
    }
}

/**
 * Get the balance of a wallet
 * @param {string} address Wallet address
 * @returns {Promise<string>} Balance in AR (formatted)
 */
export async function getWalletBalance(address) {
    try {
        const winstonBalance = await arweave.wallets.getBalance(address);
        return arweave.ar.winstonToAr(winstonBalance);
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        throw error;
    }
}

/**
 * Create and sign an Arweave data transaction
 * @param {Object} wallet JWK wallet object
 * @param {string|Buffer} data Data to store
 * @param {Object} tags Tags to add to the transaction
 * @returns {Promise<Object>} Signed transaction object
 */
export async function createDataTransaction(wallet, data, tags = {}) {
    try {
        // Create transaction
        const transaction = await arweave.createTransaction({
            data: data,
        }, wallet);

        // Add tags
        Object.entries(tags).forEach(([key, value]) => {
            transaction.addTag(key, value);
        });

        // Sign transaction
        await arweave.transactions.sign(transaction, wallet);

        return transaction;
    } catch (error) {
        console.error('Error creating data transaction:', error);
        throw error;
    }
}

/**
 * Post a transaction to Arweave
 * @param {Object} transaction Signed transaction
 * @returns {Promise<Object>} Transaction posting result
 */
export async function postTransaction(transaction) {
    try {
        const response = await arweave.transactions.post(transaction);

        if (response.status !== 200 && response.status !== 202) {
            throw new Error(`Failed to post transaction: ${response.statusText}`);
        }

        return {
            id: transaction.id,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        console.error('Error posting transaction:', error);
        throw error;
    }
}

/**
 * Save wallet to local storage (for demo/development purposes only)
 * @param {Object} wallet JWK wallet object
 */
export function saveWalletToLocalStorage(wallet) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem('verichain_arweave_wallet', JSON.stringify(wallet));
    } catch (error) {
        console.error('Error saving wallet to local storage:', error);
    }
}

/**
 * Load wallet from local storage (for demo/development purposes only)
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
 * Check if a transaction is confirmed
 * @param {string} txId Transaction ID
 * @returns {Promise<Object>} Transaction confirmation status
 */
export async function getTransactionStatus(txId) {
    try {
        const status = await arweave.transactions.getStatus(txId);

        // If transaction has confirmations, it's been mined
        const confirmed = status.confirmed && status.confirmed.number_of_confirmations > 0;

        return {
            status: status.status,
            confirmed,
            confirmations: status.confirmed ? status.confirmed.number_of_confirmations : 0,
            blockHeight: status.confirmed ? status.confirmed.block_height : null
        };
    } catch (error) {
        console.error('Error getting transaction status:', error);
        return {
            status: 0,
            confirmed: false,
            confirmations: 0,
            blockHeight: null,
            error: error.message
        };
    }
}

/**
 * Get a wallet's transaction history
 * @param {string} address Wallet address
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function getTransactionHistory(address) {
    try {
        // This would need GraphQL in a full implementation
        // Simplified for this example
        const query = `
        query {
            transactions(
            owners: ["${address}"]
            first: 10
            ) {
            edges {
                node {
                id
                owner { address }
                recipient
                tags {
                    name
                    value
                }
                block {
                    height
                    timestamp
                }
                data {
                    size
                }
                }
            }
            }
        }
        `;

        // This is a simplified implementation
        // In a production app, you would use the Arweave GraphQL endpoint
        console.log('Transaction history query not implemented yet');
        return [];
    } catch (error) {
        console.error('Error getting transaction history:', error);
        return [];
    }
}