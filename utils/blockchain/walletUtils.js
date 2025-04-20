// utils/blockchain/walletUtils.js
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
 * @returns {ethers.providers.Web3Provider} Provider instance
 */
export const getProvider = () => {
    // Check if window is defined (browser environment)
    if (typeof window !== 'undefined' && window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
    }
    // Fallback to a JSON-RPC provider (for server-side)
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
};

/**
 * Check if the current network is supported
 * @returns {Promise<boolean>} Whether current network is supported
 */
export const isSupportedNetwork = async () => {
    if (!isMetaMaskInstalled()) {
        return false;
    }

    const provider = getProvider();
    const { chainId } = await provider.getNetwork();

    // Mumbai testnet chainId is 80001
    return chainId === 80001;
};

/**
 * Switch to the Polygon Mumbai network
 * @returns {Promise<boolean>} Success state
 */
export const switchToMumbaiNetwork = async () => {
    if (!isMetaMaskInstalled()) {
        return false;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13881' }], // Mumbai chainId in hex
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
                            chainId: '0x13881',
                            chainName: 'Polygon Mumbai Testnet',
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18,
                            },
                            rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                            blockExplorerUrls: ['https://mumbai.polygonscan.com'],
                        },
                    ],
                });
                return true;
            } catch (addError) {
                console.error('Error adding Mumbai network:', addError);
                return false;
            }
        }
        console.error('Error switching to Mumbai network:', error);
        return false;
    }
};

