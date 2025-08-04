// components/layout/Layout.tsx
import React, { ReactNode, HTMLAttributes } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useWalletContext } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Page content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main layout component for the application
 */
const Layout: React.FC<LayoutProps> = ({ children, className = '', ...props }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Theme context
    const { darkMode } = useTheme();

    // Wallet context
    const {
        address,
        connect: connectWallet,
        disconnect: disconnectWallet
    } = useWalletContext();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-dark text-gray-900 dark:text-white transition-colors duration-200">
            {/* Navigation */}
            <Header
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                walletAddress={address}
                connectWallet={connectWallet}
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