// components/layout/Footer.js
import React from 'react';

/**
 * Footer component for the application
 */
const Footer = ({ className = '', ...props }) => {
    return (
        <footer className={`bg-white dark:bg-dark shadow-inner py-4 ${className}`} {...props}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-gray-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} VeriChain - Decentralized Credential Verification
                </p>
            </div>
        </footer>
    );
};

export default Footer;