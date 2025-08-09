import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Attestr Protocol - Universal Verification Infrastructure</title>
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
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
