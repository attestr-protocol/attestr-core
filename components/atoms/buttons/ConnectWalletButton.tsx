import React from 'react';
import Button from './Button';

interface ConnectWalletButtonProps {
  /** Function to call when connecting */
  onConnect: () => void;
  /** Whether connection is in progress */
  isConnecting?: boolean;
  /** Additional props passed to Button component */
  [key: string]: any;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
    onConnect,
    isConnecting = false,
    ...props
}) => {
    return (
        <Button
            variant="primary"
            onClick={onConnect}
            disabled={isConnecting}
            {...props}
        >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
    );
};

export default ConnectWalletButton;


