import Head from 'next/head';
import { useState } from 'react';
import { useAddress, useDisconnect, useMetamask } from '@thirdweb-dev/react';
import { DocumentDuplicateIcon, ShareIcon, ExternalLinkIcon } from '@heroicons/react/outline';

export default function Profile() {
    const address = useAddress();
    const connectWithMetamask = useMetamask();
    const disconnectWallet = useDisconnect();

    // Mock credentials data for UI demonstration
    const [credentials, setCredentials] = useState([
        {
            id: 'cert-123456789',
            title: 'Bachelor of Computer Science',
            issuer: 'University of Blockchain',
            issueDate: '2025-03-15',
            expiryDate: '2035-03-15',
            status: 'valid',
        },
        {
            id: 'cert-987654321',
            title: 'Advanced Web3 Development',
            issuer: 'Ethereum Academy',
            issueDate: '2024-11-20',
            expiryDate: null,
            status: 'valid',
        },
        {
            id: 'cert-567891234',
            title: 'Blockchain Security Certificate',
            issuer: 'CryptoSec Institute',
            issueDate: '2024-07-10',
            expiryDate: '2026-07-10',
            status: 'valid',
        },
    ]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div>
            <Head>
                <title>Profile & Wallet | VeriChain</title>
                <meta name="description" content="Manage your blockchain credentials" />
            </Head>

            <div className="mb-8">
                <h1 className="text-3xl font-bold">Profile & Wallet</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Manage your blockchain identity and credentials.
                </p>
            </div>

            {address ?
                <div className="space-y-8">
                    {/* Wallet Information */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">Wallet Information</h2>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                                <div className="flex items-center">
                                    <p className="font-mono text-sm md:text-base truncate max-w-xs md:max-w-md">
                                        {address}
                                    </p>
                                    <button
                                        onClick={() => copyToClipboard(address)}
                                        className="ml-2 p-1 text-gray-500 hover:text-primary"
                                        title="Copy address"
                                    >
                                        <DocumentDuplicateIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Connected with MetaMask</p>
                            </div>
                            <button onClick={disconnectWallet} className="btn-secondary mt-4 md:mt-0">
                                Disconnect
                            </button>
                        </div>
                    </div>

                    {/* Credentials */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">My Credentials</h2>
                            <span className="bg-primary-light text-primary-dark px-2 py-1 rounded-full text-sm">
                                {credentials.length} Credentials
                            </span>
                        </div>

                        {credentials.length > 0 ? (
                            <div className="space-y-4">
                                {credentials.map((credential) => (
                                    <div key={credential.id} className="card hover:shadow-lg transition-shadow">
                                        <div className="flex flex-col md:flex-row justify-between">
                                            <div>
                                                <h3 className="text-xl font-semibold">{credential.title}</h3>
                                                <p className="text-gray-600 dark:text-gray-300">{credential.issuer}</p>
                                                <div className="mt-2 flex items-center">
                                                    <span className="text-sm text-gray-500">Issued: {credential.issueDate}</span>
                                                    {credential.expiryDate && (
                                                        <span className="text-sm text-gray-500 ml-4">
                                                            Expires: {credential.expiryDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex mt-4 md:mt-0">
                                                <button
                                                    className="p-2 text-gray-500 hover:text-primary"
                                                    title="Share credential"
                                                >
                                                    <ShareIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-500 hover:text-primary ml-2"
                                                    title="View on blockchain"
                                                >
                                                    <ExternalLinkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <span className={`h-2 w-2 rounded-full ${credential.status === 'valid' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                                <span className="text-sm capitalize">{credential.status}</span>
                                            </div>
                                            <span className="text-sm font-mono text-gray-500 truncate max-w-xs">
                                                ID: {credential.id}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-8">
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    You do not have any credentials yet.
                                </p>
                                <button className="btn-primary">Request a Credential</button>
                            </div>
                        )}
                    </div>
                </div>
                :
                <div className="card text-center py-10">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Connect your wallet to view and manage your blockchain credentials.
                    </p>
                    <button onClick={connectWithMetamask} className="btn-primary">
                        Connect with MetaMask
                    </button>
                </div>}
        </div>
    );
}