// components/layout/Layout.js
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAddress, useDisconnect, useMetamask } from '@thirdweb-dev/react';

/**
 * Main layout component for the application
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 */
const Layout = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Wallet connection
    const address = useAddress();
    const connectWithMetamask = useMetamask();
    const disconnectWallet = useDisconnect();

    useEffect(() => {
        // Check if user prefers dark mode
        if (localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        if (darkMode) {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
            setDarkMode(false);
        } else {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
            setDarkMode(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <Header
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                walletAddress={address}
                connectWallet={connectWithMetamask}
                disconnectWallet={disconnectWallet}
            />

            {/* Main content */}
            <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Layout;