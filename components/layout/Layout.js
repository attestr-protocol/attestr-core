import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    HomeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    UserCircleIcon,
    MenuIcon,
    XIcon,
    MoonIcon,
    SunIcon
} from '@heroicons/react/outline';

const Layout = ({ children }) => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

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

    const navigation = [
        { name: 'Home', href: '/', icon: HomeIcon },
        { name: 'Issue Certificate', href: '/issue', icon: DocumentTextIcon },
        { name: 'Verify Certificate', href: '/verify', icon: CheckCircleIcon },
        { name: 'Profile & Wallet', href: '/profile', icon: UserCircleIcon },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="bg-white dark:bg-dark shadow-md">
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
                            >
                                {darkMode ? (
                                    <SunIcon className="h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <MoonIcon className="h-6 w-6" aria-hidden="true" />
                                )}
                            </button>

                            {/* Connect Wallet Button - Placeholder */}
                            <button className="ml-4 btn-primary">
                                Connect Wallet
                            </button>

                            {/* Mobile menu button */}
                            <div className="md:hidden ml-4">
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-light"
                                >
                                    {isOpen ? (
                                        <XIcon className="h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
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

            {/* Main content */}
            <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-dark shadow-inner py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} VeriChain - Decentralized Credential Verification
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;