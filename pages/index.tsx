import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import { useAddress, useMetamask } from '@thirdweb-dev/react';
import Card from '../components/molecules/cards/Card';
import Button from '../components/atoms/buttons/Button';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  UserCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChipIcon,
  ArrowRightIcon
} from '@heroicons/react/outline';

interface Feature {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface Action {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  color: string;
}

const Home: NextPage = () => {
  const address = useAddress();
  const connectWithMetamask = useMetamask();

  // Features list
  const features: Feature[] = [
    {
      name: 'Tamper-Proof Storage',
      description: 'Certificates are immutable once issued and stored on the blockchain, ensuring they cannot be altered or forged.',
      icon: LockClosedIcon,
    },
    {
      name: 'Instant Verification',
      description: 'Verify the authenticity of any certificate in seconds without contacting the issuing institution.',
      icon: CheckCircleIcon,
    },
    {
      name: 'Ownership Control',
      description: 'Recipients maintain full control over their credentials and can share them selectively.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Permanent Record',
      description: 'Credentials remain accessible even if the issuing institution no longer exists.',
      icon: ClockIcon,
    },
  ];

  // Main actions
  const actions: Action[] = [
    {
      title: 'Issue Certificate',
      description: 'Create and issue blockchain-backed certificates as a verified institution.',
      icon: DocumentTextIcon,
      href: '/issue',
      color: 'primary',
    },
    {
      title: 'Verify Certificate',
      description: 'Instantly verify the authenticity of any certificate issued on VeriChain.',
      icon: CheckCircleIcon,
      href: '/verify',
      color: 'secondary',
    },
    {
      title: 'Manage Profile',
      description: 'Access and manage your issued and received certificates.',
      icon: UserCircleIcon,
      href: '/profile',
      color: 'success',
    },
  ];

  return (
    <>
      <Head>
        <title>VeriChain - Decentralized Credential Verification</title>
        <meta name="description" content="Secure, blockchain-based verification of academic and professional credentials" />
      </Head>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 -mt-6">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            <span className="block">Securing Credentials with</span>
            <span className="block text-primary dark:text-primary-light">Blockchain Technology</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            VeriChain provides a decentralized platform for issuing, verifying, and managing
            academic and professional credentials with the security of blockchain.
          </p>
          <div className="mt-8 sm:mt-10 flex justify-center gap-4 flex-wrap">
            {address ?
              <Link href="/profile">
                <Button
                  size="lg"
                  startIcon={<UserCircleIcon className="h-5 w-5" />}
                >
                  View Your Profile
                </Button>
              </Link>
              :
              <Button
                size="lg"
                onClick={connectWithMetamask}
                startIcon={<ChipIcon className="h-5 w-5" />}
              >
                Connect Wallet
              </Button>}
            <Link href="/verify">
              <Button
                variant="secondary"
                size="lg"
                startIcon={<CheckCircleIcon className="h-5 w-5" />}
              >
                Verify a Certificate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-12 bg-gray-50 dark:bg-dark-light rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Why Use VeriChain?
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300 mx-auto">
              Our blockchain-based platform offers unmatched security and reliability for credential verification.
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.name} variant="flat" hover className="text-center h-full">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary bg-opacity-10 text-primary dark:text-primary-light">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Actions Section */}
      <section className="py-12 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-12">
            Get Started with VeriChain
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card
                  variant="outline"
                  hover
                  color={action.color}
                  className="h-full border-l-4 border-l-transparent hover:border-l-4 hover:border-l-current"
                >
                  <div className={`h-12 w-12 rounded-md bg-${action.color} bg-opacity-10 flex items-center justify-center text-${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                    {action.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary dark:text-primary-light font-medium">
                    Get Started <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 mt-8 bg-gray-50 dark:bg-dark-light rounded-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              How VeriChain Works
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300 mx-auto">
              Our platform uses blockchain technology to provide a transparent and secure credential verification system.
            </p>
          </div>

          <div className="relative">
            {/* Process steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-xl">
                    1
                  </div>
                  <div className="hidden md:block absolute left-10 top-5 h-0.5 w-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Issue</h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                  Authorized institutions issue digital credentials that are stored on the blockchain with a unique hash.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-xl">
                    2
                  </div>
                  <div className="hidden md:block absolute left-10 top-5 h-0.5 w-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Store</h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                  Credentials are immutably stored on the blockchain, with metadata on IPFS for privacy and efficiency.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-xl">
                    3
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Verify</h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                  Anyone can instantly verify a credential&apos;s authenticity by checking its hash on the blockchain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-12 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Open Source & Community-Driven
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
              VeriChain is an open-source project, built by the community for the community.
              Join us in revolutionizing credential verification.
            </p>
          </div>

          <div className="floating-container text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Contribute on GitHub</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Help us improve VeriChain by contributing to our codebase.
                </p>
                <a href="https://github.com/SuryanshSS1011/VeriChain"
                  className="inline-flex items-center text-primary dark:text-primary-light font-medium hover:underline"
                  target="_blank" rel="noopener noreferrer">
                  <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Visit our GitHub
                </a>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Connect on LinkedIn</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Follow me and connect for updates.
                </p>
                <a href="https://www.linkedin.com/in/suryansh-sijwali-b807a6292/"
                  className="inline-flex items-center text-primary dark:text-primary-light font-medium hover:underline"
                  target="_blank" rel="noopener noreferrer">
                  <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Follow on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="floating-container bg-gradient-to-br from-primary/95 to-primary-dark overflow-hidden">
            <div className="relative">
              {/* Background pattern */}
              <svg className="absolute right-0 top-0 opacity-10" width="404" height="392" fill="none" viewBox="0 0 404 392">
                <defs>
                  <pattern id="837c3e70-6c3a-44e6-8854-cc48c737b659" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="404" height="392" fill="url(#837c3e70-6c3a-44e6-8854-cc48c737b659)" />
              </svg>

              <div className="relative z-10 px-4 py-10 sm:px-6 sm:py-12 md:py-16 text-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  Ready to get started?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90">
                  Join the growing network of institutions and professionals using VeriChain to secure and verify credentials.
                </p>
                <div className="mt-8 flex justify-center gap-4 flex-wrap">
                  {address ?
                    <Link href="/issue">
                      <Button
                        variant="secondary"
                        size="lg"
                      >
                        Issue Certificate
                      </Button>
                    </Link>
                    :
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={connectWithMetamask}
                    >
                      Connect Your Wallet
                    </Button>}
                  <Link href="/verify">
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-transparent text-white border-white hover:bg-white hover:bg-opacity-10"
                    >
                      Verify Certificate
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;