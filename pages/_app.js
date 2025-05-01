// pages/_app.js
import '../styles/globals.css';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import Layout from '../components/layout/Layout';
import { ThemeProvider } from '../contexts/ThemeContext';
import { WalletProvider } from '../contexts/WalletContext';
import { CertificateProvider } from '../contexts/CertificateContext';
import Head from 'next/head';
import { useEffect } from 'react';
import { initializeStorage } from '../utils/storage/ipfsStorage';
import { PolygonAmoyTestnet } from "@thirdweb-dev/chains";
import { patchCircularJsonIssue } from '../utils/thirdwebUtils';

// Initialize web3.storage with API token
const initStorage = () => {
  if (typeof window === 'undefined') {
    return;
  } // Skip on server-side

    // Patch the circular reference issue in ThirdWeb
    patchCircularJsonIssue();

  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  if (token) {
    const success = initializeStorage(token);
    if (!success) {
      console.warn('Failed to initialize Web3.Storage. IPFS functionality may be limited.');
    }
  } else {
    console.warn('Web3.Storage token not found. IPFS storage will not work.');
  }
};

// Define custom chain configuration for Polygon Amoy Testnet
const PolygonAmoy = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME,
  symbol: 'MATIC',
  decimals: 18,
  rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
  blockExplorers: [
    {
      name: process.env.NEXT_PUBLIC_EXPLORER_NAME,
      url: process.env.NEXT_PUBLIC_EXPLORER_URL,
    },
  ],
  testnet: true,
};

function MyApp({ Component, pageProps }) {
  // Initialize storage on client side
  useEffect(() => {
    initStorage();
  }, []);

  return (
    <>
      <Head>
        <title>VeriChain - Decentralized Credential Verification</title>
        <meta name="description" content="Secure, blockchain-based verification of academic and professional credentials" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="icon" href="https://github.com/SuryanshSS1011/VeriChain/blob/5e99424778968fd71591ea4655847b7db78c2bfe/public/banner.png" />
      </Head>

      <ThirdwebProvider
        // NUmber of activeChains and supportedChains will be increased in the future
        activeChain={PolygonAmoyTestnet}
        supportedChains={[PolygonAmoyTestnet]}
        clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
        dAppMeta={{
          name: "VeriChain",
          description: "Decentralized credential verification system",
          logoUrl: "public/banner.png",
          url: "https://github.com/SuryanshSS1011/VeriChain/blob/5e99424778968fd71591ea4655847b7db78c2bfe/",
        }}
      >
        <ThemeProvider>
          <WalletProvider>
            <CertificateProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </CertificateProvider>
          </WalletProvider>
        </ThemeProvider>
      </ThirdwebProvider>
    </>
  );
}

export default MyApp;