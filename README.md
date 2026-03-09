<div align="center">

# 🔐 ZK Messenger

### Secure, Decentralized Wallet-to-Wallet Messaging

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-8247E5?style=for-the-badge&logo=polygon)](https://polygon.technology)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge&logo=ipfs)](https://pinata.cloud)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*End-to-end encrypted messaging powered by Polygon, IPFS, MetaMask & Zero-Knowledge Proofs.*

---

</div>

## ✨ Features

| Feature | Description |
|---|---|
| 🔑 **Wallet Authentication** | Connect with MetaMask — no accounts, no passwords |
| 🔒 **E2E Encryption** | x25519-xsalsa20-poly1305 encryption — only the recipient can decrypt |
| 📦 **Decentralized Storage** | Encrypted payloads stored on IPFS via Pinata |
| ⛓️ **On-Chain Registry** | Message metadata & public keys stored on Polygon Amoy |
| 🧾 **Read Receipts** | On-chain confirmation when a message is read |
| 💥 **Self-Destruct** | Permanently destroy messages from the blockchain |
| 🛡️ **ZK Proofs** | Zero-Knowledge proof framework for message integrity |
| 🌙 **Dark UI** | Beautiful dark-themed chat interface with animations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ZK Messenger Architecture                   │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐         ┌──────────┐
  │  Sender  │         │ Receiver │
  │ (Wallet) │         │ (Wallet) │
  └────┬─────┘         └─────┬────┘
       │                      │
       │  1. Sign message     │  1. Sign message
       │     to derive key    │     to derive key
       │                      │
       ▼                      ▼
  ┌─────────────────────────────────────┐
  │          Key Derivation             │
  │  wallet signature → keccak256 hash  │
  │  → x25519 keypair (tweetnacl)      │
  │  → register public key on-chain    │
  └───────────────┬─────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
       ▼                     ▼
  ┌──────────┐        ┌───────────┐
  │ Encrypt  │        │  Decrypt  │
  │ (sender) │        │ (receiver)│
  └────┬─────┘        └─────┬─────┘
       │                     │
       │ x25519-xsalsa20    │ nacl.box.open()
       │ -poly1305           │
       ▼                     ▼
  ┌─────────────────────────────────────┐
  │              IPFS (Pinata)          │
  │  Encrypted payload stored as JSON   │
  │  Returns CID (Content Identifier)  │
  └───────────────┬─────────────────────┘
                  │
                  ▼
  ┌─────────────────────────────────────┐
  │     Polygon Amoy Smart Contract     │
  │                                     │
  │  • sendMessage(hash, cid, to, zk)  │
  │  • confirmRead(messageId)           │
  │  • destroyMessage(messageId)        │
  │  • registerPublicKey(pubKey)        │
  │  • getPublicKey(address)            │
  │  • getInbox(address)                │
  │  • getMessage(messageId)            │
  └─────────────────────────────────────┘
```

### Message Flow

```
┌──────────────────── SENDING A MESSAGE ────────────────────────┐
│                                                                │
│  1. Lookup receiver's public key from smart contract           │
│  2. Encrypt message with x25519-xsalsa20-poly1305             │
│  3. Generate keccak256 hash of encrypted payload               │
│  4. Upload encrypted payload to IPFS → get CID                 │
│  5. Generate ZK proof                                          │
│  6. Call contract.sendMessage(hash, cid, receiver, zkProof)    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌──────────────────── RECEIVING A MESSAGE ──────────────────────┐
│                                                                │
│  1. Fetch inbox messageIds from smart contract                 │
│  2. For each message, fetch metadata (sender, cid, timestamp)  │
│  3. User clicks "Decrypt" on a message                         │
│  4. Fetch encrypted payload from IPFS using CID                │
│  5. Derive secret key from wallet signature                    │
│  6. Decrypt with nacl.box.open()                               │
│  7. Call contract.confirmRead(messageId)                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
web3-messenger/
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout, fonts, metadata
│   │   ├── page.tsx                # Main messaging dashboard
│   │   ├── globals.css             # Theme, animations, design tokens
│   │   └── auth/login/
│   │       └── page.tsx            # Login page with wallet connect
│   │
│   ├── components/                 # React UI Components
│   │   ├── WalletConnect.tsx       # Wallet status & connection
│   │   ├── ComposeMessage.tsx      # Send message form + tx tracker
│   │   ├── ChatSidebar.tsx         # Inbox message list
│   │   └── MessageViewer.tsx       # Decrypt, view & destroy messages
│   │
│   ├── hooks/                      # Custom React Hooks
│   │   ├── useWallet.ts            # MetaMask connection & network
│   │   └── useMessenger.ts         # Full messaging pipeline
│   │
│   ├── lib/                        # Core Logic & Utilities
│   │   ├── encryption.ts           # E2E encryption & key derivation
│   │   ├── contract.ts             # Smart contract ABI & factory
│   │   ├── constants.ts            # Network config, addresses, gas
│   │   ├── ipfs.ts                 # Pinata IPFS upload/download
│   │   ├── hash.ts                 # keccak256 message hashing
│   │   └── zkproof.ts             # ZK proof generation (placeholder)
│   │
│   └── types/                      # TypeScript Declarations
│       ├── ethereum.d.ts           # Window.ethereum provider types
│       └── eth-sig-util.d.ts       # MetaMask encryption types
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── .env.local                      # Environment variables (secrets)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript | UI framework & app router |
| **Styling** | Tailwind CSS, Custom CSS variables | Dark theme, animations |
| **Blockchain** | Polygon Amoy (PoS L2) | On-chain message registry |
| **Wallet** | MetaMask via ethers.js v6 | Authentication & signing |
| **Encryption** | x25519-xsalsa20-poly1305 | End-to-end encryption |
| **Crypto Lib** | TweetNaCl, @metamask/eth-sig-util | Key derivation & encryption |
| **Storage** | IPFS via Pinata | Decentralized payload storage |
| **Hashing** | keccak256 (ethers.js) | Message integrity proofs |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MetaMask** browser extension
- **POL tokens** on Polygon Amoy testnet ([Faucet](https://faucet.polygon.technology/))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd web3-messenger
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1CF12E2cE65Dc51D16E37fE129b698CAAAefAC32
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
```

> **Get a Pinata JWT:** Sign up at [pinata.cloud](https://pinata.cloud), create an API key, and copy the JWT.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 📖 How It Works — Step by Step

### 🔗 Step 1: Connect Your Wallet

1. Open the app and click **"Connect Wallet"**
2. MetaMask will prompt you to connect
3. The app automatically switches to **Polygon Amoy** testnet if needed
4. Your truncated wallet address appears in the top bar

### 🔑 Step 2: Register Your Encryption Key (One-Time)

1. The app detects you haven't registered a key yet
2. Click **"Register Encryption Key"**
3. MetaMask asks you to **sign a message** (no gas needed for signing)
4. Your signature is hashed to derive a deterministic **x25519 keypair**
5. The **public key** is registered on the smart contract (requires gas)
6. Now anyone can encrypt messages for your wallet

### ✉️ Step 3: Send an Encrypted Message

1. Switch to **Compose** view
2. Enter the **receiver's wallet address** (they must have registered their key)
3. Type your message
4. Click **"Send Encrypted Message"** — watch the 5-step progress:
   - 🔐 **Encrypting** — Fetches receiver's public key, encrypts with x25519
   - #️⃣ **Hashing** — Generates keccak256 hash for on-chain integrity
   - 📤 **Uploading** — Uploads encrypted payload to IPFS via Pinata
   - ⛓️ **Sending** — Submits transaction to Polygon Amoy contract
   - ✅ **Confirming** — Waits for block confirmation
5. Transaction hash links directly to [Polygonscan](https://amoy.polygonscan.com)

### 📬 Step 4: Read & Decrypt Messages

1. Open your **Inbox** — messages appear with sender address & timestamp
2. Click a message to view it
3. Click **"Decrypt with Wallet"**
4. MetaMask asks you to **sign** again to derive your secret key
5. The message is decrypted locally in your browser — **never sent to any server**
6. A read receipt is recorded on-chain

### 💥 Step 5: Destroy a Message

1. View a decrypted message
2. Click the **trash icon**
3. Confirm destruction — the message is **permanently deleted** from the blockchain

---

## 🔐 Security Model

```
┌───────────────────────── Security Layers ─────────────────────────┐
│                                                                    │
│  ┌──────────────────────────────────┐                              │
│  │  1. WALLET AUTHENTICATION        │  MetaMask-only access        │
│  │     No passwords, no accounts    │  Private key never exposed   │
│  └──────────────┬───────────────────┘                              │
│                 ▼                                                   │
│  ┌──────────────────────────────────┐                              │
│  │  2. SIGNATURE-BASED KEY DERIVATION│  Deterministic keypair      │
│  │     keccak256(sign(fixedMsg))    │  No deprecated MetaMask APIs │
│  └──────────────┬───────────────────┘                              │
│                 ▼                                                   │
│  ┌──────────────────────────────────┐                              │
│  │  3. E2E ENCRYPTION               │  x25519-xsalsa20-poly1305   │
│  │     Only recipient can decrypt   │  256-bit key, 192-bit nonce  │
│  └──────────────┬───────────────────┘                              │
│                 ▼                                                   │
│  ┌──────────────────────────────────┐                              │
│  │  4. DECENTRALIZED STORAGE        │  IPFS — no single server     │
│  │     Content-addressed by CID     │  CID validation (anti-SSRF)   │
│  └──────────────┬───────────────────┘                              │
│                 ▼                                                   │
│  ┌──────────────────────────────────┐                              │
│  │  5. ON-CHAIN INTEGRITY           │  keccak256 hash commitment   │
│  │     Immutable message record     │  Tamper-proof delivery       │
│  └──────────────────────────────────┘                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Key Security Principles:**
- 🚫 **No server** ever sees plaintext messages — decryption happens in-browser only
- 🔑 **Private keys** never leave MetaMask — only signatures are used
- 🛡️ **CID validation** prevents SSRF injection attacks on IPFS fetches
- ⛓️ **On-chain hashes** guarantee message integrity and non-repudiation
- 🗑️ **Destroy function** provides forward secrecy via on-chain deletion

---

## 🧩 Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                    page.tsx (Home)                    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │              WalletConnect                    │    │
│  │  [Address] [Network Badge] [Disconnect]       │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────┐  ┌──────────────────────────┐    │
│  │ ChatSidebar  │  │   MessageViewer           │    │
│  │              │  │                           │    │
│  │  📩 Msg #1   │  │   From: 0xabc...         │    │
│  │  📩 Msg #2   │──│   Date: Mar 9, 2026      │    │
│  │  📩 Msg #3   │  │                           │    │
│  │              │  │   [🔓 Decrypt with Wallet] │    │
│  │              │  │   [🗑️ Destroy]             │    │
│  └──────────────┘  └──────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │           ComposeMessage                      │    │
│  │  To: [0x...receiver address]                  │    │
│  │  Message: [                          ]        │    │
│  │            [🔐 Send Encrypted Message]        │    │
│  │  Progress: ● Encrypt → ● Hash → ● IPFS → ● Tx│   │
│  └─────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Hook Dependencies

```
useWallet()                    useMessenger(provider, signer, address)
  ├── connectWallet()            ├── sendMessage(to, msg)
  ├── disconnectWallet()         ├── fetchInbox()
  ├── switchToNetwork()          ├── decryptAndRead(id, cid)
  └── [address, provider,        ├── destroyMessage(id)
       signer, chainId,          ├── registerPublicKey()
       isConnected,               └── checkKeyRegistered()
       isCorrectNetwork]
```

---

## ⚙️ Configuration

### Network (Polygon Amoy)

| Setting | Value |
|---|---|
| Chain ID | `80002` |
| RPC URL | `https://rpc-amoy.polygon.technology` |
| Currency | POL (18 decimals) |
| Explorer | `https://amoy.polygonscan.com` |
| Gas Priority | 30 Gwei (min 25 Gwei required) |

### Smart Contract

| Item | Value |
|---|---|
| Address | `0x1CF12E2cE65Dc51D16E37fE129b698CAAAefAC32` |
| Network | Polygon Amoy Testnet |
| Functions | 8 (send, read, destroy, inbox, message, registerKey, getKey, count) |
| Events | 4 (MessageSent, MessageRead, MessageDestroyed, PublicKeyRegistered) |

---

## 🧪 Troubleshooting

| Problem | Solution |
|---|---|
| **MetaMask not detected** | Install MetaMask extension and refresh the page |
| **Wrong network** | Click "Switch Network" — the app handles it automatically |
| **"Receiver key not registered"** | The receiver must connect and register their encryption key first |
| **Transaction fails (gas)** | Ensure you have POL on Polygon Amoy ([Faucet](https://faucet.polygon.technology/)) |
| **Decryption fails** | Only the intended recipient can decrypt — ensure you're the receiver |
| **Old messages won't decrypt** | Messages encrypted before key re-registration cannot be decrypted |

---

## 📜 Smart Contract Events

```solidity
event MessageSent(uint256 indexed messageId, address indexed from, address indexed to, bytes32 messageHash, string ipfsCid);
event MessageRead(uint256 indexed messageId, address indexed receiver);
event MessageDestroyed(uint256 indexed messageId);
event PublicKeyRegistered(address indexed user);
```

---

## 🗺️ Roadmap

- [ ] 🧠 Real ZK proof generation (snarkjs / Circom)
- [ ] 📱 Mobile wallet support (WalletConnect v2)
- [ ] 🔄 Real-time message notifications (WebSocket / event listeners)
- [ ] 👥 Group messaging with shared keys
- [ ] 🌐 Multi-chain support (zkSync, Scroll, Base)
- [ ] 📎 File attachment support via IPFS
- [ ] ⏰ Auto-expiring messages with TTL

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with 🔐 by the ZK Messenger team**

*Secure. Decentralized. Private.*

</div>

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
