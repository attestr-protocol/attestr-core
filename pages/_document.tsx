import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Attestr Protocol - The universal verification infrastructure for Web3. Attest to truth, verify everything." />
        <meta name="keywords" content="attestation, verification, blockchain, web3, credentials, certificates, trust, protocol" />
        <meta property="og:title" content="Attestr Protocol" />
        <meta property="og:description" content="Universal Verification Infrastructure for Web3" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://attestr.io" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Attestr Protocol" />
        <meta property="twitter:description" content="Universal Verification Infrastructure for Web3" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* CSP Meta Tag as fallback - allows eval() for Web3 libraries */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://verify.walletconnect.com https://registry.walletconnect.com https://*.thirdweb.com https://gateway.thirdweb.com https://pay.thirdweb.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws: https://*.thirdweb.com https://*.walletconnect.com https://*.walletconnect.org https://*.infura.io https://*.alchemy.com https://*.ar.io https://arweave.net https://gateway.thirdweb.com https://pay.thirdweb.com https://polygon-amoy.g.alchemy.com https://polygon-mumbai.g.alchemy.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" />
        
        {/* Fonts with proper preloading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
