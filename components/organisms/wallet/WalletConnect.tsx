// components/organisms/wallet/WalletConnect.tsx
import React, { useEffect } from 'react';
import Button from '../../atoms/buttons/Button';
import Address from '../../atoms/display/Address';
import CopyButton from '../../atoms/display/CopyButton';
import InfoCard from '../../molecules/cards/InfoCard';
import ErrorNotification from '../../molecules/notifications/ErrorNotification';
import { useWalletContext } from '../../../contexts/WalletContext';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

/**
 * Component for connecting to a wallet
 */
const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  className = '',
  ...props
}) => {
  const {
    address,
    connect,
    disconnect,
    isConnecting,
    networkSupported,
    switchNetwork,
    showErrorNotification,
    errorMessage,
    errorType,
    dismissError
  } = useWalletContext();

  // Call onConnect/onDisconnect callbacks when wallet state changes
  useEffect(() => {
    if (address && onConnect) {
      onConnect(address);
    } else if (!address && onDisconnect) {
      onDisconnect();
    }
  }, [address, onConnect, onDisconnect]);

  if (!address) {
    return (
      <>
        <InfoCard
          title="Connect Your Wallet"
          className={className}
          {...props}
        >
          <div className="text-center py-6">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Connect your Ethereum wallet to interact with Attestr Protocol.
            </p>
            <Button
              variant="primary"
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
            </Button>

            {/* Network not supported warning (if applicable) */}
            {!networkSupported && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded-md">
                <p className="text-sm">
                  Please switch to the Mumbai Testnet to use this application.
                </p>
                <button
                  onClick={switchNetwork}
                  className="text-sm underline hover:no-underline mt-1"
                >
                  Switch Network
                </button>
              </div>
            )}
          </div>
        </InfoCard>

        {/* Error notification */}
        <ErrorNotification
          message={errorMessage}
          type={errorType}
          show={showErrorNotification}
          onDismiss={dismissError}
        />
      </>
    );
  }

  return (
    <>
      <InfoCard
        title="Wallet Connected"
        className={className}
        {...props}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <span className="bg-primary-light dark:bg-primary-dark bg-opacity-20 px-3 py-1.5 rounded-md font-mono">
                <Address address={address} />
              </span>
              <CopyButton text={address} className="ml-2" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Connected with MetaMask
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={disconnect}
          >
            Disconnect
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium mb-2">Network Information</h4>
          <div className="bg-gray-50 dark:bg-dark-light rounded-md p-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">
              <div>
                <span className="block font-medium text-gray-500 dark:text-gray-400">
                  Chain ID
                </span>
                <span>Mumbai Testnet (80001)</span>
              </div>
              <div>
                <span className="block font-medium text-gray-500 dark:text-gray-400">
                  Status
                </span>
                <span className="flex items-center">
                  {networkSupported ? (
                    <>
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                      Connected
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                      Wrong Network
                      <button
                        onClick={switchNetwork}
                        className="ml-2 text-primary underline hover:no-underline"
                      >
                        Switch
                      </button>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Error notification */}
      <ErrorNotification
        message={errorMessage}
        type={errorType}
        show={showErrorNotification}
        onDismiss={dismissError}
      />
    </>
  );
};

export default WalletConnect;