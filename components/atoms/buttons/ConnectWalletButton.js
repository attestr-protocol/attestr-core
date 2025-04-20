import React from 'react';
import Button from './Button';

/**
 * Specialized button for wallet connection
 * 
 * @param {Object} props
 * @param {Function} props.onConnect - Function to call when connecting
 * @param {boolean} props.isConnecting - Whether connection is in progress
 */
const ConnectWalletButton = ({
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


