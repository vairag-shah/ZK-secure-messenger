'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useMessenger } from '@/hooks/useMessenger';
import WalletConnect from '@/components/WalletConnect';
import ChatSidebar from '@/components/ChatSidebar';
import MessageViewer from '@/components/MessageViewer';
import ComposeMessage from '@/components/ComposeMessage';

type ViewMode = 'inbox' | 'compose';

export default function Home() {
  const {
    address,
    provider,
    signer,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    error: walletError,
    connectWallet,
    disconnectWallet,
    switchToNetwork,
  } = useWallet();

  const {
    messages,
    txStatus,
    txHash,
    error: messengerError,
    isLoadingInbox,
    isKeyRegistered,
    sendMessage,
    fetchInbox,
    decryptAndRead,
    destroyMessage,
    registerPublicKey,
    checkKeyRegistered,
    clearError,
  } = useMessenger(signer, provider, address);

  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [showKeyRegistration, setShowKeyRegistration] = useState(false);

  // Fetch inbox and check key registration when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchInbox();
      checkKeyRegistered();
    }
  }, [isConnected, address, fetchInbox, checkKeyRegistered]);

  const selectedMessage = messages.find(m => m.id === selectedMessageId) || null;

  const handleSend = async (receiver: string, message: string) => {
    await sendMessage(receiver, message);
    // Refresh inbox after sending
    setTimeout(() => fetchInbox(), 3000);
  };

  const handleRegisterKey = async () => {
    await registerPublicKey();
  };

  if (!isConnected) {
    return (
      <div className="landing-page">
        {/* Animated Background */}
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
            End-to-end encrypted wallet-to-wallet messaging.
            Your messages, your keys, your privacy.
          </p>

          <div className="landing-features">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3>E2E Encrypted</h3>
              <p>x25519-xsalsa20-poly1305</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 3a14.25 14.25 0 014 9 14.25 14.25 0 01-4 9 14.25 14.25 0 01-4-9 14.25 14.25 0 014-9z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h3>Decentralized</h3>
              <p>IPFS + Blockchain</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7v5c0 5.55 4.16 10.74 10 12 5.84-1.26 10-6.45 10-12V7l-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>ZK Verified</h3>
              <p>Zero-Knowledge Proofs</p>
            </div>
          </div>

          <WalletConnect
            address={address}
            isConnected={isConnected}
            isConnecting={isConnecting}
            isCorrectNetwork={isCorrectNetwork}
            error={walletError}
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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v5c0 5.55 4.16 10.74 10 12 5.84-1.26 10-6.45 10-12V7l-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 12h8M8 8h8M8 16h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>ZK Messenger</span>
          </h1>
        </div>
        <div className="header-center">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('inbox')}
              className={`toggle-btn ${viewMode === 'inbox' ? 'active' : ''}`}
              id="view-inbox-btn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 6h6M5 8h4M5 10h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Inbox
              {messages.filter(m => !m.isRead).length > 0 && (
                <span className="badge-count">{messages.filter(m => !m.isRead).length}</span>
              )}
            </button>
            <button
              onClick={() => setViewMode('compose')}
              className={`toggle-btn ${viewMode === 'compose' ? 'active' : ''}`}
              id="view-compose-btn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 11l9-9 2 2-9 9H2v-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Compose
            </button>
          </div>
        </div>
        <div className="header-right">
          <button
            onClick={() => setShowKeyRegistration(!showKeyRegistration)}
            className="btn-register-key"
            title={isKeyRegistered ? 'Encryption key registered ✓' : 'Register encryption key on-chain'}
            style={isKeyRegistered ? { borderColor: 'var(--success)', color: 'var(--success)' } : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9 9l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M12 12l2-1M12 12l1 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>
          <WalletConnect
            address={address}
            isConnected={isConnected}
            isConnecting={isConnecting}
            isCorrectNetwork={isCorrectNetwork}
            error={walletError}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            onSwitchNetwork={switchToNetwork}
          />
        </div>
      </header>

      {/* Key Registration Modal */}
      {showKeyRegistration && (
        <div className="modal-overlay" onClick={() => setShowKeyRegistration(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3>Register Encryption Key</h3>
            {isKeyRegistered ? (
              <>
                <p style={{ color: 'var(--success)' }}>
                  ✓ Your encryption key is already registered on-chain. You can receive encrypted messages.
                </p>
                <p>
                  To send a message, the <strong>receiver</strong> must also register their key
                  by opening ZK Messenger and clicking this same button.
                </p>
                <div className="modal-actions">
                  <button onClick={() => setShowKeyRegistration(false)} className="btn-primary">
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  Sign a message with your wallet to generate your encryption key,
                  then register it on-chain. Other users will look up your key to
                  send you encrypted messages. This requires one signature + one transaction.
                </p>
                <div className="modal-actions">
                  <button onClick={handleRegisterKey} className="btn-primary">
                    Register Key
                  </button>
                  <button onClick={() => setShowKeyRegistration(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {viewMode === 'inbox' ? (
          <div className="inbox-layout">
            <ChatSidebar
              messages={messages}
              selectedMessageId={selectedMessageId}
              onSelectMessage={setSelectedMessageId}
              onRefresh={fetchInbox}
              isLoading={isLoadingInbox}
            />
            <MessageViewer
              message={selectedMessage}
              onDecrypt={decryptAndRead}
              onDestroy={destroyMessage}
              walletAddress={address}
            />
          </div>
        ) : (
          <div className="compose-layout">
            <ComposeMessage
              onSend={handleSend}
              txStatus={txStatus}
              txHash={txHash}
              error={messengerError}
              onClearError={clearError}
            />
          </div>
        )}
      </main>

      {/* Error Toast */}
      {messengerError && viewMode === 'inbox' && (
        <div className="error-toast animate-fade-in">
          <span>{messengerError}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
    </div>
  );
}
