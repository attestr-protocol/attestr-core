// components/layout/Footer.tsx
import React, { HTMLAttributes } from 'react';
import Link from 'next/link';

interface NavItem {
  name: string;
  href: string;
}

interface SocialItem {
  name: string;
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}

interface FooterProps extends HTMLAttributes<HTMLElement> {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Footer component for the application
 */
const Footer: React.FC<FooterProps> = ({ className = '', ...props }) => {
    const currentYear = new Date().getFullYear();
    
    const navigation: {
        main: NavItem[];
        resources: NavItem[];
        legal: NavItem[];
        social: SocialItem[];
    } = {
        main: [
            { name: 'Home', href: '/' },
            { name: 'Issue Certificate', href: '/issue' },
            { name: 'Verify Certificate', href: '/verify' },
            { name: 'Profile', href: '/profile' },
        ],
        resources: [
            { name: 'Documentation', href: '#' },
            { name: 'FAQs', href: '#' },
            { name: 'Support', href: '#' },
        ],
        legal: [
            { name: 'Privacy Policy', href: '#' },
            { name: 'Terms of Service', href: '#' },
        ],
        social: [
            {
                name: 'Github',
                href: 'https://github.com/attestr-protocol/attestr-core',
                icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                ),
            },
            {
                name: 'LinkedIn',
                href: 'https://www.linkedin.com/in/suryansh-sijwali-b807a6292/',
                icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                ),
            },
        ],
    };

    return (
        <footer className={`bg-white dark:bg-dark mt-auto border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8 xl:col-span-1">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-primary dark:text-primary-light">
                                Veri<span className="text-secondary dark:text-secondary-light">Chain</span>
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-base max-w-xs">
                            Secure, blockchain-based verification of academic and professional credentials.
                        </p>
                        <div className="flex space-x-6">
                            {navigation.social.map((item) => (
                                <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                   target="_blank" rel="noopener noreferrer">
                                    <span className="sr-only">{item.name}</span>
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Navigation</h3>
                            <ul className="mt-4 space-y-4">
                                {navigation.main.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Resources</h3>
                            <ul className="mt-4 space-y-4">
                                {navigation.resources.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                    <p className="text-base text-gray-400 dark:text-gray-500 text-center">
                        &copy; {currentYear} Attestr Protocol. Open Source Project.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;