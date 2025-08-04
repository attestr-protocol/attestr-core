// utils/blockchain/walletUtils.ts
import { ethers } from 'ethers';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

interface NetworkDetails {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: NativeCurrency;
}

/**
 * Check if MetaMask is installed
 * @returns Whether MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.ethereum !== undefined;
};

/**
 * Get an ethers provider instance
 * @returns Provider instance
 */
export const getProvider = (): ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider => {
  // Check if window is defined (browser environment)
  if (typeof window !== 'undefined' && window.ethereum) {
    // When using with MetaMask, make sure to handle changes correctly
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    // Prompt the user to connect their wallet before using it for transactions
    const requestAccounts = async (): Promise<void> => {
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

  // Get network-specific RPC URL based on environment
  const getNetworkRpcUrl = (): string => {
    // Check if we're using Amoy
    if (process.env.AMOY_RPC_URL) {
      return process.env.AMOY_RPC_URL;
    }
    // Check if we're using Mumbai
    if (process.env.MUMBAI_RPC_URL) {
      return process.env.MUMBAI_RPC_URL;
    }
    // Fallback to generic RPC URL
    return process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/your-api-key";
  };

  // Fallback to a JSON-RPC provider (for server-side rendering or if MetaMask is not available)
  const rpcUrl = getNetworkRpcUrl();
  return new ethers.providers.JsonRpcProvider(rpcUrl);
};

/**
 * Get network details based on environment variables
 * @returns Network details
 */
export const getNetworkDetails = (): NetworkDetails => {
  // Determine which network config to use based on available env vars
  if (process.env.AMOY_CHAIN_ID) {
    return {
      name: 'Polygon Amoy Testnet',
      chainId: parseInt(process.env.AMOY_CHAIN_ID, 10),
      rpcUrl: process.env.AMOY_RPC_URL || '',
      explorerUrl: process.env.AMOY_EXPLORER_URL || 'https://www.oklink.com/amoy',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    };
  }

  if (process.env.MUMBAI_CHAIN_ID) {
    return {
      name: 'Polygon Mumbai Testnet',
      chainId: parseInt(process.env.MUMBAI_CHAIN_ID, 10),
      rpcUrl: process.env.MUMBAI_RPC_URL || '',
      explorerUrl: process.env.MUMBAI_EXPLORER_URL || 'https://mumbai.polygonscan.com',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    };
  }

  // Fallback to generic network config
  return {
    name: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Polygon Amoy Testnet',
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80002', 10),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
    explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://www.oklink.com/amoy',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  };
};

/**
 * Check if the current network is supported
 * @returns Whether current network is supported
 */
export const isSupportedNetwork = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled()) {
    return false;
  }

  try {
    const provider = getProvider();
    const { chainId } = await provider.getNetwork();
    const networkDetails = getNetworkDetails();

    // Check if the current chain ID matches the target chain ID
    return chainId === networkDetails.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Switch to the configured testnet network
 * @returns Success state
 */
export const switchToConfiguredNetwork = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled() || !window.ethereum) {
    return false;
  }

  try {
    const networkDetails = getNetworkDetails();

    // Chain ID as hex string
    const chainIdHex = `0x${networkDetails.chainId.toString(16)}`;

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (error: any) {
    // If the network is not added to MetaMask, add it
    if (error.code === 4902) {
      try {
        const networkDetails = getNetworkDetails();
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${networkDetails.chainId.toString(16)}`,
              chainName: networkDetails.name,
              nativeCurrency: networkDetails.nativeCurrency,
              rpcUrls: [networkDetails.rpcUrl],
              blockExplorerUrls: [networkDetails.explorerUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error(`Error adding ${getNetworkDetails().name} network:`, addError);
        return false;
      }
    }
    console.error(`Error switching to ${getNetworkDetails().name} network:`, error);
    return false;
  }
};

/**
 * Get the current connected account from MetaMask
 * @returns Ethereum address or null
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled() || !window.ethereum) {
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
 * @param callback - Function to call when accounts change
 * @returns Function to remove the listener
 */
export const onAccountsChanged = (callback: (accounts: string[]) => void): (() => void) => {
  if (!isMetaMaskInstalled() || !window.ethereum) {
    return () => { };
  }

  window.ethereum.on('accountsChanged', callback);
  return () => window.ethereum!.removeListener('accountsChanged', callback);
};

/**
 * Listen for chain changes
 * @param callback - Function to call when chain changes
 * @returns Function to remove the listener
 */
export const onChainChanged = (callback: (chainId: string) => void): (() => void) => {
  if (!isMetaMaskInstalled() || !window.ethereum) {
    return () => { };
  }

  window.ethereum.on('chainChanged', callback);
  return () => window.ethereum!.removeListener('chainChanged', callback);
};

export type { NetworkDetails, NativeCurrency };