// pages/_app.js
import '../styles/globals.css';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Mumbai } from '@thirdweb-dev/chains';
import Layout from '../components/layout/Layout';
import { ThemeProvider } from '../contexts/ThemeContext';
import { WalletProvider } from '../contexts/WalletContext';
import { CertificateProvider } from '../contexts/CertificateContext';
import Head from 'next/head';
import { useEffect } from 'react';
import { initializeStorage } from '../utils/storage/ipfsStorage';

// Initialize web3.storage with API token
const initStorage = () => {
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  if (token) {
    initializeStorage(token);
  } else {
    console.warn('Web3.Storage token not found. IPFS storage will not work.');
  }
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
      </Head>
      
      <ThirdwebProvider activeChain={Mumbai}>
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