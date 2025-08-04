// components/organisms/wallet/WalletInfo.tsx
import React from 'react';
import Address from '../../atoms/display/Address';
import CopyButton from '../../atoms/display/CopyButton';
import InfoCard from '../../molecules/cards/InfoCard';
import { DocumentTextIcon } from '@heroicons/react/outline';

interface WalletInfoProps {
    address: string; 
    transactions?: any[];
    className?: string;
}

/**
 * Component for displaying wallet information
 */
const WalletInfo: React.FC<WalletInfoProps> = ({
    address,
    transactions = [],
    className = '',
    ...props
}) => {
    if (!address) {
        return null;
    }

    return (
        <InfoCard
            title="Wallet Information"
            icon={<DocumentTextIcon className="h-6 w-6" />}
            className={className}
            {...props}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <div className="flex items-center">
                        <p className="font-mono text-sm md:text-base break-all max-w-xs md:max-w-md">
                            {address}
                        </p>
                        <CopyButton text={address} className="ml-2" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Connected with MetaMask
                    </p>
                </div>
            </div>

            {transactions.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
                    <div className="bg-gray-50 dark:bg-dark-light rounded-md p-3">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map((tx, index) => (
                                <li key={index} className="py-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{tx.type}</p>
                                            <p className="text-sm text-gray-500">{tx.date}</p>
                                        </div>
                                        <a
                                            href={`https://mumbai.polygonscan.com/tx/${tx.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm"
                                        >
                                            View
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </InfoCard>
    );
};

export default WalletInfo;

