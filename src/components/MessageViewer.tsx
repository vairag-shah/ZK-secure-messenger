'use client';

import { useState } from 'react';
import { Message } from '@/hooks/useMessenger';
import { NETWORK_CONFIG } from '@/lib/constants';

interface MessageViewerProps {
  message: Message | null;
  onDecrypt: (messageId: number, ipfsCid: string) => void;
  onDestroy: (messageId: number) => void;
  walletAddress: string | null;
}

export default function MessageViewer({
  message,
  onDecrypt,
  onDestroy,
  walletAddress,
}: MessageViewerProps) {
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDecrypt = async () => {
    if (!message) return;
    setIsDecrypting(true);
    await onDecrypt(message.id, message.ipfsCid);
    setIsDecrypting(false);
  };

  const handleDestroy = () => {
    if (!message) return;
    onDestroy(message.id);
    setShowDestroyConfirm(false);
  };

  if (!message) {
    return (
      <div className="message-viewer-empty">
        <div className="viewer-empty-content">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.15">
            <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="2.5" />
            <path d="M8 24l24 14 24-14" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="32" cy="36" r="6" stroke="currentColor" strokeWidth="2" />
            <path d="M29 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3>Select a message</h3>
          <p>Choose a conversation from the inbox to view encrypted messages</p>
        </div>
      </div>
    );
  }

  const isSentByMe = message.sender.toLowerCase() === walletAddress?.toLowerCase();

  return (
    <div className="message-viewer">
      {/* Header */}
      <div className="viewer-header">
        <div className="viewer-header-info">
          <div
            className="viewer-avatar"
            style={{
              background: `linear-gradient(135deg, 
                hsl(${parseInt(message.sender.slice(2, 4), 16) * 1.4}, 70%, 60%), 
                hsl(${parseInt(message.sender.slice(4, 6), 16) * 1.4}, 70%, 40%))`,
            }}
          />
          <div>
            <h3>
              {isSentByMe ? 'You' : truncateAddress(message.sender)}
              {isSentByMe && (
                <span className="sent-badge">Sent</span>
              )}
            </h3>
            <span className="viewer-time">{formatDate(message.timestamp)}</span>
          </div>
        </div>
        <div className="viewer-header-actions">
          <span className={`status-badge ${message.isRead ? 'read' : 'unread'}`}>
            {message.isRead ? '✓ Read' : '● Unread'}
          </span>
          <a
            href={`${NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${message.messageHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-explorer"
            title="View on Explorer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M8 2h4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 2L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* Message Content */}
      <div className="viewer-content">
        {message.decryptedContent ? (
          <div className="decrypted-message animate-fade-in">
            <div className="message-bubble">
              <p>{message.decryptedContent}</p>
            </div>
            <div className="message-meta">
              <span>From: {truncateAddress(message.decryptedSender || message.sender)}</span>
              {message.decryptedTimestamp && (
                <span>Sent: {formatDate(message.decryptedTimestamp)}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="encrypted-message">
            <div className="encrypted-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="8" y="18" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M13 18v-5a7 7 0 0114 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="20" cy="27" r="2" fill="currentColor" />
                <path d="M20 29v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h4>Encrypted Message</h4>
            <p>This message is end-to-end encrypted. Only your wallet can decrypt it.</p>
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="btn-decrypt"
              id="decrypt-message-btn"
            >
              {isDecrypting ? (
                <>
                  <span className="spinner" />
                  Decrypting with MetaMask...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Decrypt with Wallet
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="viewer-footer">
        <div className="message-id-display">
          <span>Message #{message.id}</span>
          <span className="cid-display" title={message.ipfsCid}>
            CID: {message.ipfsCid.slice(0, 12)}...
          </span>
        </div>
        <div className="viewer-footer-actions">
          {!showDestroyConfirm ? (
            <button
              onClick={() => setShowDestroyConfirm(true)}
              className="btn-destroy"
              id="destroy-message-btn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M13 4l-.8 9a2 2 0 01-2 1.8H5.8a2 2 0 01-2-1.8L3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Destroy
            </button>
          ) : (
            <div className="destroy-confirm animate-fade-in">
              <span>Permanently destroy this message?</span>
              <button onClick={handleDestroy} className="btn-confirm-destroy">
                Yes, Destroy
              </button>
              <button onClick={() => setShowDestroyConfirm(false)} className="btn-cancel-destroy">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
