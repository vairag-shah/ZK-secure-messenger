'use client';

import { NETWORK_CONFIG } from '@/lib/constants';

interface WalletConnectProps {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export default function WalletConnect({
  address,
  isConnected,
  isConnecting,
  isCorrectNetwork,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: WalletConnectProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="wallet-connect">
      {error && (
        <div className="wallet-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="btn-connect"
          id="wallet-connect-btn"
        >
          {isConnecting ? (
            <>
              <span className="spinner" />
              Connecting...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="wallet-info">
          <div className="network-badge-wrapper">
            {isCorrectNetwork ? (
              <span className="network-badge network-correct">
                <span className="network-dot" />
                {NETWORK_CONFIG.chainName}
              </span>
            ) : (
              <button onClick={onSwitchNetwork} className="network-badge network-wrong">
                <span className="network-dot-wrong" />
                Wrong Network
              </button>
            )}
          </div>
          <div className="address-display">
            <div className="address-icon">
              <div
                className="address-identicon"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${parseInt(address?.slice(2, 4) || '0', 16) * 1.4}, 70%, 60%), 
                    hsl(${parseInt(address?.slice(4, 6) || '0', 16) * 1.4}, 70%, 40%))`,
                }}
              />
            </div>
            <span className="address-text">{truncateAddress(address!)}</span>
            <button onClick={onDisconnect} className="btn-disconnect" id="wallet-disconnect-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H4a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
