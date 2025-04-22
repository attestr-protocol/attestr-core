// components/layout/Layout.js
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAddress, useDisconnect, useMetamask } from '@thirdweb-dev/react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Main layout component for the application
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 */
const Layout = ({ children, className = '', ...props }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Theme context
    const { darkMode } = useTheme();

    // Wallet connection
    const address = useAddress();
    const connectWithMetamask = useMetamask();
    const disconnectWallet = useDisconnect();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-dark text-gray-900 dark:text-white transition-colors duration-200">
            {/* Navigation */}
            <Header
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                walletAddress={address}
                connectWallet={connectWithMetamask}
                disconnectWallet={disconnectWallet}
            />

            {/* Main content */}
            <main className="flex-grow py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className={className} {...props}>
                    {children}
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Layout;