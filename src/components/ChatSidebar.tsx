'use client';

import { Message } from '@/hooks/useMessenger';

interface ChatSidebarProps {
  messages: Message[];
  selectedMessageId: number | null;
  onSelectMessage: (id: number) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ChatSidebar({
  messages,
  selectedMessageId,
  onSelectMessage,
  onRefresh,
  isLoading,
}: ChatSidebarProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}m ago`;
    }
    if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 8h8M6 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 16l2-3h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Inbox
        </h2>
        <button
          onClick={onRefresh}
          className="btn-refresh"
          disabled={isLoading}
          id="inbox-refresh-btn"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={isLoading ? 'spinning' : ''}
          >
            <path
              d="M2 8a6 6 0 0111.47-2.47M14 8A6 6 0 012.53 10.47"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="sidebar-messages">
        {isLoading && messages.length === 0 ? (
          <div className="sidebar-loading">
            <span className="spinner" />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="sidebar-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M6 18l18 10 18-10" stroke="currentColor" strokeWidth="2" />
            </svg>
            <p>No messages yet</p>
            <span>Messages you receive will appear here</span>
          </div>
        ) : (
          messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelectMessage(msg.id)}
              className={`sidebar-message-item ${
                selectedMessageId === msg.id ? 'selected' : ''
              } ${!msg.isRead ? 'unread' : ''}`}
              id={`message-item-${msg.id}`}
            >
              <div className="message-item-avatar">
                <div
                  className="avatar-identicon"
                  style={{
                    background: `linear-gradient(135deg, 
                      hsl(${parseInt(msg.sender.slice(2, 4), 16) * 1.4}, 70%, 60%), 
                      hsl(${parseInt(msg.sender.slice(4, 6), 16) * 1.4}, 70%, 40%))`,
                  }}
                />
                {!msg.isRead && <span className="unread-dot" />}
              </div>
              <div className="message-item-content">
                <div className="message-item-header">
                  <span className="message-sender">{truncateAddress(msg.sender)}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-item-preview">
                  {msg.decryptedContent
                    ? msg.decryptedContent.slice(0, 40) + (msg.decryptedContent.length > 40 ? '...' : '')
                    : '🔒 Encrypted message'}
                </div>
              </div>
              <div className="message-item-status">
                {msg.isRead && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="read-icon">
                    <path d="M2 7l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
