import { ethers } from 'ethers';

/**
 * Check if MetaMask is installed
 * @returns {boolean} Whether MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
};

/**
 * Get an ethers provider instance
 * @returns {ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider} Provider instance
 */
export const getProvider = () => {
    // Check if window is defined (browser environment)
    if (typeof window !== 'undefined' && window.ethereum) {
        // When using with MetaMask, make sure to handle changes correctly
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

        // Prompt the user to connect their wallet before using it for transactions
        const requestAccounts = async () => {
            try {
                await provider.send("eth_requestAccounts", []);
            } catch (error) {
                console.error("User denied account access", error);
            }
        };

        // Request accounts by default
        requestAccounts();

        return provider;
    }

    // Fallback to a JSON-RPC provider (for server-side rendering or if MetaMask is not available)
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    return new ethers.providers.JsonRpcProvider(rpcUrl);
};

/**
 * Check if the current network is supported
 * @returns {Promise<boolean>} Whether current network is supported
 */
export const isSupportedNetwork = async () => {
    if (!isMetaMaskInstalled()) {
        return false;
    }

    try {
        const provider = getProvider();
        const { chainId } = await provider.getNetwork();

        // Get target chain ID from environment or fallback to Amoy (80002)
        const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10);

        return chainId === targetChainId;
    } catch (error) {
        console.error("Error checking network:", error);
        return false;
    }
};

/**
 * Switch to the Polygon Amoy network
 * @returns {Promise<boolean>} Success state
 */
export const switchToAmoyNetwork = async () => {
    if (!isMetaMaskInstalled()) {
        return false;
    }

    try {
        // Chain ID as hex string (80002 = 0x13882)
        const chainIdHex = `0x${parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10).toString(16)}`;

        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
        });
        return true;
    } catch (error) {
        // If the network is not added to MetaMask, add it
        if (error.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: `0x${parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80002', 10).toString(16)}`,
                            chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Polygon Amoy Testnet',
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18,
                            },
                            rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/your-api-key'],
                            blockExplorerUrls: [process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://www.oklink.com/amoy'],
                        },
                    ],
                });
                return true;
            } catch (addError) {
                console.error('Error adding Polygon Amoy network:', addError);
                return false;
            }
        }
        console.error('Error switching to Polygon Amoy network:', error);
        return false;
    }
};

/**
 * Get the current connected account from MetaMask
 * @returns {Promise<string|null>} Ethereum address or null
 */
export const getCurrentAccount = async () => {
    if (!isMetaMaskInstalled()) {
        return null;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
        console.error('Error getting current account:', error);
        return null;
    }
};

/**
 * Listen for account changes
 * @param {Function} callback - Function to call when accounts change
 * @returns {Function} Function to remove the listener
 */
export const onAccountsChanged = (callback) => {
    if (!isMetaMaskInstalled()) {
        return () => { };
    }

    window.ethereum.on('accountsChanged', callback);
    return () => window.ethereum.removeListener('accountsChanged', callback);
};

/**
 * Listen for chain changes
 * @param {Function} callback - Function to call when chain changes
 * @returns {Function} Function to remove the listener
 */
export const onChainChanged = (callback) => {
    if (!isMetaMaskInstalled()) {
        return () => { };
    }

    window.ethereum.on('chainChanged', callback);
    return () => window.ethereum.removeListener('chainChanged', callback);
};