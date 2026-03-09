'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { TxStatus } from '@/hooks/useMessenger';

interface ComposeMessageProps {
  onSend: (receiver: string, message: string) => void;
  txStatus: TxStatus;
  txHash: string | null;
  error: string | null;
  onClearError: () => void;
}

const STATUS_STEPS: { key: TxStatus; label: string }[] = [
  { key: 'encrypting', label: 'Encrypting' },
  { key: 'hashing', label: 'Hashing' },
  { key: 'uploading', label: 'Uploading to IPFS' },
  { key: 'sending', label: 'Sending Transaction' },
  { key: 'confirming', label: 'Confirming' },
];

export default function ComposeMessage({
  onSend,
  txStatus,
  txHash,
  error,
  onClearError,
}: ComposeMessageProps) {
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const isProcessing = txStatus !== 'idle' && txStatus !== 'success' && txStatus !== 'error';

  const validateAndSend = () => {
    setValidationError('');
    onClearError();

    if (!receiver.trim()) {
      setValidationError('Receiver address is required');
      return;
    }

    if (!ethers.isAddress(receiver)) {
      setValidationError('Invalid Ethereum address');
      return;
    }

    if (!message.trim()) {
      setValidationError('Message cannot be empty');
      return;
    }

    onSend(receiver.trim(), message.trim());
  };

  const getCurrentStepIndex = () => {
    return STATUS_STEPS.findIndex(step => step.key === txStatus);
  };

  return (
    <div className="compose-message">
      <div className="compose-header">
        <h3>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 13l11-11 2 2-11 11H2v-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New Message
        </h3>
      </div>

      <div className="compose-body">
        {/* Receiver Input */}
        <div className="input-group">
          <label htmlFor="receiver-address">To</label>
          <div className="address-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="input-icon">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 14a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              id="receiver-address"
              type="text"
              placeholder="0x..."
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              disabled={isProcessing}
              className="input-address"
              spellCheck={false}
            />
            {receiver && ethers.isAddress(receiver) && (
              <span className="input-valid">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="input-group">
          <label htmlFor="message-content">Message</label>
          <textarea
            id="message-content"
            placeholder="Type your encrypted message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isProcessing}
            className="input-message"
            rows={4}
          />
          <div className="char-count">{message.length} characters</div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="compose-error animate-fade-in">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.6" fill="currentColor" />
            </svg>
            {validationError}
          </div>
        )}

        {/* Transaction Error */}
        {error && (
          <div className="compose-error animate-fade-in">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.6" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}

        {/* Progress Steps */}
        {isProcessing && (
          <div className="tx-progress animate-fade-in">
            {STATUS_STEPS.map((step, index) => {
              const currentIndex = getCurrentStepIndex();
              const isActive = index === currentIndex;
              const isComplete = index < currentIndex;

              return (
                <div
                  key={step.key}
                  className={`tx-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                >
                  <div className="step-indicator">
                    {isComplete ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isActive ? (
                      <span className="spinner-sm" />
                    ) : (
                      <span className="step-dot" />
                    )}
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Success */}
        {txStatus === 'success' && (
          <div className="tx-success animate-fade-in">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Message sent successfully!</span>
            {txHash && (
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View Transaction ↗
              </a>
            )}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={validateAndSend}
          disabled={isProcessing || !receiver || !message}
          className="btn-send"
          id="send-message-btn"
        >
          {isProcessing ? (
            <>
              <span className="spinner" />
              Processing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9l14-7-7 14V9H2z" fill="currentColor" opacity="0.2" />
                <path d="M2 9l14-7-7 14V9H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Send Encrypted Message
            </>
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L1 4v3c0 2.8 2.1 5.4 5 6 2.9-.6 5-3.2 5-6V4L6 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          <path d="M4.5 6l1 1 2-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>End-to-end encrypted · Only the receiver can decrypt</span>
      </div>
    </div>
  );
}
