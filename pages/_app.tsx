// pages/_app.tsx

import '../styles/globals.css';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import Layout from '../components/layout/Layout';
import { ThemeProvider } from '../contexts/ThemeContext';
import { WalletProvider } from '../contexts/WalletContext';
import { CertificateProvider } from '../contexts/CertificateContext';
// import { ArweaveProvider } from '../contexts/ArweaveContext';
import Head from 'next/head';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
// import {
//   isStorageInitialized,
//   loadWalletFromLocalStorage,
//   initializeStorage
// } from '../utils/storage/arweaveStorage';
import { patchCircularJsonIssue } from '../utils/blockchain/thirdwebUtils';
import { PolygonAmoyTestnet } from "@thirdweb-dev/chains";

// Initialize Arweave storage with wallet from local storage (for demo purposes)
// const initArweaveStorage = async (): Promise<void> => {
//   if (typeof window === 'undefined') {
//     return;
//   } // Skip on server-side

//   // Patch the circular reference issue in ThirdWeb
//   patchCircularJsonIssue();

//   // Check if already initialized
//   if (isStorageInitialized()) {
//     console.log('Arweave storage already initialized');
//     return;
//   }

//   try {
//     // For demo purposes, try to load wallet from local storage
//     const savedWallet = loadWalletFromLocalStorage();

//     if (savedWallet) {
//       console.log('Found saved Arweave wallet, initializing storage...');
//       const success = await initializeStorage(savedWallet);
//       if (success) {
//         console.log('Successfully initialized Arweave storage with saved wallet');
//       } else {
//         console.warn('Failed to initialize Arweave storage with saved wallet');
//       }
//     } else {
//       console.log('No saved Arweave wallet found. User will need to initialize storage.');
//     }
//   } catch (error) {
//     console.error('Error initializing Arweave storage:', error);
//   }
// };

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize Arweave storage on client side
  useEffect(() => {
    // Patch the circular reference issue in ThirdWeb
    patchCircularJsonIssue();
  }, []);

  return (
    <>
      <Head>
        <title>VeriChain - Decentralized Credential Verification</title>
        <meta name="description" content="Secure, blockchain-based verification of academic and professional credentials with permanent storage on Arweave" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="icon" href="https://github.com/SuryanshSS1011/VeriChain/blob/5e99424778968fd71591ea4655847b7db78c2bfe/public/banner.png" />
      </Head>

      <ThirdwebProvider
        activeChain={PolygonAmoyTestnet}
        supportedChains={[PolygonAmoyTestnet]}
        clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
        dAppMeta={{
          name: "VeriChain",
          description: "Decentralized credential verification system with permanent storage on Arweave",
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