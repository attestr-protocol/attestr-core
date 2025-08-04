// components/layout/Header.tsx
import React, { HTMLAttributes } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    HomeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    UserCircleIcon,
    MoonIcon,
    SunIcon,
    MenuIcon,
    XIcon
} from '@heroicons/react/outline';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../atoms/buttons/Button';
import { formatAddress } from '../../utils/formatting/addressFormat';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /** Whether mobile menu is open */
  isMenuOpen: boolean;
  /** Function to set mobile menu state */
  setIsMenuOpen: (isOpen: boolean) => void;
  /** Connected wallet address */
  walletAddress?: string;
  /** Function to connect wallet */
  connectWallet: () => void;
  /** Function to disconnect wallet */
  disconnectWallet: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Header component for the application
 */
const Header: React.FC<HeaderProps> = ({
    isMenuOpen,
    setIsMenuOpen,
    walletAddress,
    connectWallet,
    disconnectWallet,
    className = '',
    ...props
}) => {
    const router = useRouter();
    const { darkMode, toggleDarkMode } = useTheme();

    const navigation: NavigationItem[] = [
        { name: 'Home', href: '/', icon: HomeIcon },
        { name: 'Issue Certificate', href: '/issue', icon: DocumentTextIcon },
        { name: 'Verify Certificate', href: '/verify', icon: CheckCircleIcon },
        { name: 'Profile & Wallet', href: '/profile', icon: UserCircleIcon },
    ];

    return (
        <nav className={`bg-white dark:bg-dark sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 shadow-sm ${className}`} {...props}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-primary dark:text-primary-light">
                                Veri<span className="text-secondary dark:text-secondary-light">Chain</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:ml-8 md:flex md:space-x-6">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all
                  ${router.pathname === item.href
                                            ? 'border-secondary text-secondary dark:text-secondary-light'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light transition-colors"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {darkMode ? (
                                <SunIcon className="h-6 w-6" aria-hidden="true" />
                            ) : (
                                <MoonIcon className="h-6 w-6" aria-hidden="true" />
                            )}
                        </button>

                        {/* Wallet Button */}
                        <Button
                            variant={walletAddress ? 'outline' : 'primary'}
                            size="sm"
                            onClick={walletAddress ? disconnectWallet : connectWallet}
                        >
                            {walletAddress
                                ? `${formatAddress(walletAddress, 4, 4)}`
                                : 'Connect Wallet'
                            }
                        </Button>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light transition-colors"
                                aria-expanded={isMenuOpen}
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? (
                                    <XIcon className="h-6 w-6" />
                                ) : (
                                    <MenuIcon className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="py-2 space-y-1 border-t border-gray-200 dark:border-gray-700">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-base font-medium transition-colors
                            ${router.pathname === item.href
                                    ? 'bg-primary-light bg-opacity-10 text-primary dark:text-primary-light border-l-4 border-primary dark:border-primary-light'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-light border-l-4 border-transparent'
                                }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Header;