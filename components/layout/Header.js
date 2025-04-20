// components/layout/Header.js
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    HomeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    UserCircleIcon,
    MoonIcon,
    SunIcon
} from '@heroicons/react/outline';

/**
 * Header component for the application
 * 
 * @param {Object} props
 * @param {boolean} props.darkMode - Whether dark mode is active
 * @param {Function} props.toggleDarkMode - Function to toggle dark mode
 * @param {boolean} props.isOpen - Whether mobile menu is open
 * @param {Function} props.setIsOpen - Function to set mobile menu state
 */
const Header = ({
    darkMode,
    toggleDarkMode,
    isOpen,
    setIsOpen,
    walletAddress,
    connectWallet,
    disconnectWallet,
    className = '',
    ...props
}) => {
    const router = useRouter();

    const navigation = [
        { name: 'Home', href: '/', icon: HomeIcon },
        { name: 'Issue Certificate', href: '/issue', icon: DocumentTextIcon },
        { name: 'Verify Certificate', href: '/verify', icon: CheckCircleIcon },
        { name: 'Profile & Wallet', href: '/profile', icon: UserCircleIcon },
    ];

    return (
        <nav className={`bg-white dark:bg-dark shadow-md ${className}`} {...props}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-primary dark:text-primary-light">
                                Veri<span className="text-secondary">Chain</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:ml-6 md:flex md:space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                  ${router.pathname === item.href
                                            ? 'border-secondary text-secondary dark:text-secondary-light'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5 mr-1" aria-hidden="true" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {darkMode ? (
                                <SunIcon className="h-6 w-6" aria-hidden="true" />
                            ) : (
                                <MoonIcon className="h-6 w-6" aria-hidden="true" />
                            )}
                        </button>

                        {/* Connect Wallet Button */}
                        <button
                            className="ml-4 btn-primary"
                            onClick={walletAddress ? disconnectWallet : connectWallet}
                        >
                            {walletAddress ? 'Disconnect' : 'Connect Wallet'}
                        </button>

                        {/* Mobile menu button */}
                        <div className="md:hidden ml-4">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light"
                                aria-expanded={isOpen}
                                aria-label="Toggle menu"
                            >
                                {isOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="pt-2 pb-3 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2 text-base font-medium
              ${router.pathname === item.href
                                    ? 'bg-primary-light bg-opacity-10 text-primary dark:text-primary-light'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-light'
                                }`}
                            onClick={() => setIsOpen(false)}
                        >
                            <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Header;

