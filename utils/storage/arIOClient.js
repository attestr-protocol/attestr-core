// utils/storage/arIOClient.js
import { ARIO, ArConnectSigner, ARIOToken } from '@ar.io/sdk';

// Global AR.IO client instance
let arioClient = null;
let currentSigner = null;

/**
 * Initialize the AR.IO SDK with testnet configuration
 * @param {Object} options - Configuration options
 * @param {Object|string} options.signer - ArConnect signer or wallet key
 * @returns {Object} AR.IO client instance
 */
export const initializeARIO = async (options = {}) => {
    try {
        // Create testnet client if not already initialized
        if (!arioClient) {
            arioClient = ARIO.testnet();
            console.log('AR.IO testnet client initialized');
        }

        // If signer is provided, update the client with write access
        if (options.signer) {
            // Create a signer based on the type provided
            if (typeof window !== 'undefined' && window.arweaveWallet && options.signer === 'arconnect') {
                // Use ArConnect (Wander) wallet
                try {
                    await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
                    currentSigner = new ArConnectSigner(window.arweaveWallet);

                    // Reinitialize with the signer for write access
                    arioClient = ARIO.testnet({
                        signer: currentSigner
                    });

                    console.log('AR.IO client configured with ArConnect signer');
                } catch (error) {
                    console.error('Error connecting to ArConnect wallet:', error);
                    throw new Error('Failed to connect to ArConnect wallet. Make sure it is installed and unlocked.');
                }
            } else {
                // Use provided JWK wallet
                try {
                    // Parse string to JSON if needed
                    const jwk = typeof options.signer === 'string'
                        ? JSON.parse(options.signer)
                        : options.signer;

                    // Reinitialize with the ArweaveSigner
                    const { ArweaveSigner } = await import('@ar.io/sdk');
                    currentSigner = new ArweaveSigner(jwk);

                    arioClient = ARIO.testnet({
                        signer: currentSigner
                    });

                    console.log('AR.IO client configured with JWK signer');
                } catch (error) {
                    console.error('Error initializing wallet signer:', error);
                    throw new Error('Invalid wallet key format');
                }
            }
        }

        return arioClient;
    } catch (error) {
        console.error('Error initializing AR.IO client:', error);
        throw error;
    }
};

/**
 * Get the current AR.IO client instance
 * @returns {Object|null} AR.IO client instance or null if not initialized
 */
export const getARIOClient = () => {
    return arioClient;
};

/**
 * Get the current signer's wallet address
 * @returns {Promise<string|null>} Wallet address or null if not available
 */
export const getCurrentWalletAddress = async () => {
    if (!arioClient || !currentSigner) {
        return null;
    }

    try {
        return await currentSigner.getAddress();
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
};

/**
 * Check if AR.IO client is initialized
 * @returns {boolean} Whether the client is initialized
 */
export const isInitialized = () => {
    return !!arioClient;
};

/**
 * Get AR.IO token balance for an address
 * @param {string} address - Wallet address (defaults to current wallet)
 * @returns {Promise<string>} Balance in ARIO tokens
 */
export const getWalletBalance = async (address = null) => {
    if (!arioClient) {
        throw new Error('AR.IO client not initialized');
    }

    try {
        const targetAddress = address || await getCurrentWalletAddress();
        if (!targetAddress) {
            throw new Error('No wallet address provided');
        }

        const balanceResponse = await arioClient.getBalance(targetAddress);

        // Convert from mARIO to ARIO
        const balance = ARIOToken.fromMARIO(balanceResponse.tokenBalance).valueOf();
        return balance.toString();
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        throw error;
    }
};

/**
 * Request tokens from the testnet faucet
 * @param {Object} options - Options for claiming tokens
 * @param {string} options.recipient - Recipient address
 * @param {number} options.amount - Amount of ARIO tokens to request
 * @param {string} options.authToken - Auth token from captcha (optional if stored in localStorage)
 * @returns {Promise<Object>} Result of the claim
 */
export const requestTestnetTokens = async ({ recipient, amount = 100, authToken = null }) => {
    if (!arioClient) {
        throw new Error('AR.IO client not initialized');
    }

    if (!recipient) {
        throw new Error('Recipient address is required');
    }

    try {
        // First check if we have a valid auth token in localStorage
        let validToken = authToken;

        if (!validToken && typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('ario-jwt');
            const expiresAt = localStorage.getItem('ario-jwt-expires-at');

            // Use stored token if it's still valid
            if (storedToken && expiresAt && Date.now() < parseInt(expiresAt)) {
                validToken = storedToken;
            }
        }

        // If we don't have a valid token, we need to get one
        if (!validToken) {
            // Request captcha URL and handle in a pop-up
            const captchaUrl = await arioClient.faucet.captchaURL();

            // Return the URL so the caller can handle opening a window
            return {
                needsCaptcha: true,
                captchaUrl: captchaUrl.captchaUrl
            };
        }

        // Claim tokens with the valid token
        const tokenAmount = new ARIOToken(amount).toMARIO().valueOf();
        const result = await arioClient.faucet.claimWithAuthToken({
            authToken: validToken,
            recipient: recipient,
            quantity: tokenAmount
        });

        return {
            success: true,
            transactionId: result.id
        };
    } catch (error) {
        console.error('Error requesting testnet tokens:', error);
        throw error;
    }
};

/**
 * Set up a listener for the captcha window to receive the auth token
 * @param {Function} onSuccess - Callback for successful token receipt
 * @returns {Function} Function to remove the listener
 */
export const setupCaptchaListener = (onSuccess) => {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const handleMessage = (event) => {
        if (event.data.type === 'ario-jwt-success') {
            // Store the token and expiration
            localStorage.setItem('ario-jwt', event.data.token);
            localStorage.setItem('ario-jwt-expires-at', event.data.expiresAt);

            // Call the success callback
            if (onSuccess) {
                onSuccess(event.data.token, event.data.expiresAt);
            }
        }
    };

    window.addEventListener('message', handleMessage);

    // Return function to remove listener
    return () => {
        window.removeEventListener('message', handleMessage);
    };
};

/**
 * Disconnect the current AR.IO client
 */
export const disconnect = () => {
    arioClient = null;
    currentSigner = null;

    // Clean up localStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('verichain_arweave_wallet');
    }
};