// components/molecules/storage/TokenRequest.js
import React, { useState } from 'react';
import { useArweave } from '../../../contexts/ArweaveContext';
import Card from '../cards/Card';
import Button from '../../atoms/buttons/Button';
import TextInput from '../../atoms/inputs/TextInput';
import {
    CurrencyDollarIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    ExclamationIcon
} from '@heroicons/react/outline';

/**
 * Component for requesting AR.IO testnet tokens
 */
const TokenRequest = ({
    onSuccess,
    onError,
    className = '',
    ...props
}) => {
    const {
        isInitialized,
        walletAddress,
        requestTokens,
        isLoading,
        error
    } = useArweave();

    const [amount, setAmount] = useState(100);
    const [resultMessage, setResultMessage] = useState('');
    const [resultType, setResultType] = useState(null); // 'success', 'error', 'info'
    const [captchaRequired, setCaptchaRequired] = useState(false);

    // Handle token request
    const handleRequestTokens = async () => {
        setResultMessage('');
        setResultType(null);
        setCaptchaRequired(false);

        if (!isInitialized) {
            const errorMsg = 'Wallet not initialized. Please connect an Arweave wallet first.';
            setResultMessage(errorMsg);
            setResultType('error');
            if (onError) {
                onError(errorMsg);
            }
            return;
        }

        try {
            const tokenAmount = parseInt(amount, 10);
            if (isNaN(tokenAmount) || tokenAmount <= 0 || tokenAmount > 1000) {
                throw new Error('Please enter a valid amount between 1 and 1000');
            }

            const result = await requestTokens(tokenAmount);

            if (result.success) {
                if (result.captchaRequired) {
                    setCaptchaRequired(true);
                    setResultMessage('Please complete the captcha in the popup window to receive tokens.');
                    setResultType('info');
                } else {
                    setResultMessage(`Successfully requested ${tokenAmount} AR.IO testnet tokens!`);
                    setResultType('success');
                    if (onSuccess) {
                        onSuccess(result);
                    }
                }
            } else {
                throw new Error(result.error || 'Failed to request tokens');
            }
        } catch (err) {
            console.error('Error requesting tokens:', err);
            setResultMessage(err.message || 'Failed to request tokens');
            setResultType('error');
            if (onError) {
                onError(err.message);
            }
        }
    };

    return (
        <Card
            className={className}
            {...props}
        >
            <div className="p-4">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-amber-500" />
                    Request Testnet Tokens
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Request AR.IO testnet tokens to store certificates. These tokens have no real-world value
                    and are only for testing purposes.
                </p>

                {/* Result message */}
                {resultMessage && (
                    <div className={`p-3 rounded-lg mb-4 ${resultType === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : resultType === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        }`}>
                        <div className="flex items-start">
                            {resultType === 'success' && (
                                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                            )}
                            {resultType === 'error' && (
                                <ExclamationIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 mr-2" />
                            )}
                            {resultType === 'info' && (
                                <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 mr-2" />
                            )}
                            <p className="text-sm">{resultMessage}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Input field for token amount */}
                    <div>
                        <label
                            htmlFor="tokenAmount"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Token Amount
                        </label>
                        <TextInput
                            id="tokenAmount"
                            type="number"
                            min="1"
                            max="1000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="100"
                            disabled={isLoading || captchaRequired}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Enter the number of AR.IO testnet tokens to request (1-1000)
                        </p>
                    </div>

                    {/* Request button */}
                    <Button
                        variant="primary"
                        onClick={handleRequestTokens}
                        disabled={isLoading || !isInitialized || captchaRequired}
                        isLoading={isLoading}
                        fullWidth
                    >
                        {captchaRequired ? 'Complete Captcha in Popup' : 'Request Tokens'}
                    </Button>

                    {/* Info text */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Note: You may need to complete a captcha to prevent abuse.
                        A new window will open for this purpose.
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default TokenRequest;