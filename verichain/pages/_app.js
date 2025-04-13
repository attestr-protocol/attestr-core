import '../styles/globals.css';
import Layout from '../components/layout/Layout';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Mumbai } from '@thirdweb-dev/chains';

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider activeChain={Mumbai}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThirdwebProvider>
  );
}

export default MyApp;
