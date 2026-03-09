'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import WalletConnect from '@/components/WalletConnect';

export default function LoginPage() {
    const router = useRouter();
    const {
        address,
        isConnected,
        isConnecting,
        isCorrectNetwork,
        error,
        connectWallet,
        disconnectWallet,
        switchToNetwork,
    } = useWallet();

    // Redirect to home once connected
    useEffect(() => {
        if (isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    return (
        <div className="landing-page">
            <div className="bg-grid" />
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />
            <div className="bg-glow bg-glow-3" />

            <div className="landing-content">
                <div className="landing-badge">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1L2 4v3c0 2.8 2.1 5.4 5 6 2.9-.6 5-3.2 5-6V4L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                    Secured by Polygon Amoy
                </div>

                <h1 className="landing-title">
                    <span className="title-gradient">ZK Messenger</span>
                </h1>

                <p className="landing-description">
                    Connect your wallet to access end-to-end encrypted messaging.
                    Your messages, your keys, your privacy.
                </p>

                <WalletConnect
                    address={address}
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    isCorrectNetwork={isCorrectNetwork}
                    error={error}
                    onConnect={connectWallet}
                    onDisconnect={disconnectWallet}
                    onSwitchNetwork={switchToNetwork}
                />

                <div className="landing-footer">
                    <span>Powered by</span>
                    <span className="footer-highlight">Polygon</span>
                    <span>·</span>
                    <span className="footer-highlight">IPFS</span>
                    <span>·</span>
                    <span className="footer-highlight">MetaMask</span>
                </div>
            </div>
        </div>
    );
}
