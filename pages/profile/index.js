// pages/profile/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProfileTemplate from '../../components/page-templates/ProfileTemplate';
import { useWalletContext } from '../../contexts/WalletContext';
import { useCertificateContext } from '../../contexts/CertificateContext';

export default function ProfilePage() {
    const router = useRouter();
    const { address, connect, disconnect } = useWalletContext();
    const {
        certificates,
        loadUserCertificates,
        isLoading
    } = useCertificateContext();

    // Load user certificates when wallet is connected
    useEffect(() => {
        if (address) {
            loadUserCertificates(address);
        }
    }, [address, loadUserCertificates]);

    // Handle certificate view action
    const handleViewCertificate = (certificate) => {
        router.push(`/verify/${certificate.certificateId}`);
    };

    // Handle certificate share action
    const handleShareCertificate = (certificate) => {
        if (navigator.share) {
            navigator.share({
                title: certificate.credential?.title || 'Blockchain Certificate',
                text: `Check out my verified credential: ${certificate.credential?.title}`,
                url: `${window.location.origin}/verify/${certificate.certificateId}`,
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        } else {
            // Fallback for browsers that don't support the Web Share API
            const shareUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    alert('Share link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Error copying to clipboard:', err);
                });
        }
    };

    return (
        <>
            <Head>
                <title>Profile & Wallet | VeriChain</title>
                <meta name="description" content="Manage your blockchain credentials" />
            </Head>

            <ProfileTemplate
                address={address}
                certificates={certificates}
                isLoading={isLoading}
                onWalletConnect={connect}
                onWalletDisconnect={disconnect}
                onShareCertificate={handleShareCertificate}
                onViewCertificate={handleViewCertificate}
            />
        </>
    );
}