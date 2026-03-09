# 🔐 ZK Messenger — Private On-Chain Messaging

> A privacy-first, zero-knowledge messaging protocol built on Polygon. Messages are encrypted client-side, stored on IPFS, and only **commitments** (hashes) live on-chain — ensuring true privacy with cryptographic guarantees.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue?logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange)](https://book.getfoundry.sh/)
[![Network](https://img.shields.io/badge/Network-Polygon%20Amoy-purple)](https://amoy.polygonscan.com/)
[![Tests](https://img.shields.io/badge/Tests-40%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [How It Works](#-how-it-works)
- [Deployed Contract](#-deployed-contract)
- [Smart Contract Features](#-smart-contract-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Running Tests](#-running-tests)
- [Deployment](#-deployment)
- [Contract Interaction](#-contract-interaction)
- [Security](#-security)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SENDER (Frontend)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User writes message                                         │
│           │                                                     │
│           ▼                                                     │
│  2. AES-256 Encryption (Frontend)                               │
│           │                                                     │
│           ▼                                                     │
│  3. Generate ZK Proof of Message Validity                       │
│           │                                                     │
│           ▼                                                     │
│  4. Store encrypted message on IPFS ──────► IPFS Network        │
│           │                                    (off-chain)      │
│           ▼                                                     │
│  5. Send message hash + ZK proof + IPFS CID                     │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              POLYGON AMOY (L2 Rollup)                   │    │
│  │                                                         │    │
│  │   ┌───────────────────────────────────────────────┐     │    │
│  │   │         Messenger Smart Contract              │     │    │
│  │   │                                               │     │    │
│  │   │  • Verifies ZK proof on-chain                 │     │    │
│  │   │  • Stores message commitment (hash)           │     │    │
│  │   │  • Stores IPFS CID pointer                    │     │    │
│  │   │  • Manages read receipts                      │     │    │
│  │   │  • Auto-destructs after TTL                   │     │    │
│  │   └───────────────────────────────────────────────┘     │    │
│  │           │                                             │    │
│  │           │  Rollup batches many messages                │    │
│  │           ▼                                             │    │
│  │   Rollup submits compressed proof to L1 (Ethereum)      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       RECEIVER (Frontend)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  6. Receiver fetches IPFS CID from contract event               │
│           │                                                     │
│           ▼                                                     │
│  7. Fetches encrypted message from IPFS                         │
│           │                                                     │
│           ▼                                                     │
│  8. Decrypts message with AES-256 key                           │
│           │                                                     │
│           ▼                                                     │
│  9. Sends read receipt proof (on-chain)                         │
│           │                                                     │
│           ▼                                                     │
│ 10. Message self-destructs (on-chain data cleared)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works

### Sending a Message

```
Sender                    Smart Contract                  IPFS
  │                            │                           │
  │ 1. Encrypt message         │                           │
  │    (AES-256)               │                           │
  │                            │                           │
  │ 2. Upload encrypted ──────────────────────────────────►│
  │    payload to IPFS         │                    Store payload
  │                            │                    Return CID
  │ 3. Generate ZK proof       │                           │
  │                            │                           │
  │ 4. sendMessage(hash, ─────►│                           │
  │    CID, receiver, proof)   │                           │
  │                            │ ✅ Verify ZK proof        │
  │                            │ ✅ Store commitment       │
  │                            │ ✅ Emit MessageSent       │
  │◄── return messageId ───────│                           │
```

### Receiving a Message

```
Receiver                  Smart Contract                  IPFS
  │                            │                           │
  │ 1. Listen for              │                           │
  │    MessageSent event       │                           │
  │                            │                           │
  │ 2. Read IPFS CID ─────────►│                           │
  │    from getMessage()       │                           │
  │                            │                           │
  │ 3. Fetch encrypted ───────────────────────────────────►│
  │    payload from IPFS       │                    Return data
  │◄──────────────────────────────────────────────────────│
  │                            │                           │
  │ 4. Decrypt with            │                           │
  │    AES-256 key             │                           │
  │                            │                           │
  │ 5. confirmRead(msgId) ────►│                           │
  │                            │ ✅ Mark as read           │
  │                            │ ✅ Emit MessageRead       │
  │                            │                           │
  │ 6. destroyMessage(msgId) ─►│                           │
  │                            │ ✅ Clear on-chain data    │
  │                            │ ✅ Emit MessageDestroyed  │
```

---

## 📡 Deployed Contract

| Field | Value |
|-------|-------|
| **Network** | Polygon Amoy Testnet (Chain ID: 80002) |
| **Contract Address** | `0x1CF12E2cE65Dc51D16E37fE129b698CAAAefAC32` |
| **Owner** | `0xC3845b84Ec513c8A318383e7885743F248A07481` |
| **Block Explorer** | [View on PolygonScan](https://amoy.polygonscan.com/address/0x1CF12E2cE65Dc51D16E37fE129b698CAAAefAC32) |
| **Tx Hash** | `0x3abf3b48...348a5888` |
| **Message TTL** | 86400 seconds (1 day) |

> Full contract address, ABI, and deployment details are in [`deployment.json`](deployment.json).

---

## ✨ Smart Contract Features

### Step 1: Commitment Storage (Not Plaintext)
The contract **never stores raw messages**. Only a `bytes32` hash and IPFS CID are stored on-chain. The actual encrypted content lives off-chain on IPFS.

### Step 2: ZK Proof Verification
Before a message commitment is stored, the contract can verify a Zero-Knowledge proof to ensure message validity — without revealing the message content.

### Step 3: Multiple Messages & Inbox
Each user has an inbox. The contract supports unlimited concurrent messages between any sender-receiver pairs using a `messageId`-based mapping system.

### Step 4: Read Receipts
Receivers can cryptographically prove they've read a message by calling `confirmRead()`, which emits an on-chain `MessageRead` event.

### Step 5: Message Self-Destruct
Messages can be destroyed by the sender or receiver at any time. After the TTL expires, **anyone** can trigger destruction — ensuring ephemeral messaging.

### Step 6: Encryption Key Registry
Users can register their encryption public keys on-chain so senders can look them up directly, enabling seamless encrypted communication.

---

## 📁 Project Structure

```
demo/
├── src/
│   └── Messenger.sol          # Main contract
├── test/
│   └── Messenger.t.sol        # 40 comprehensive tests
├── script/
│   └── Messenger.s.sol        # Deployment script
├── deployment.json             # Deployed address + full ABI
├── .env                        # Private key & RPC config (git-ignored)
├── .gitignore
└── foundry.toml                # Foundry configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- A wallet with Polygon Amoy testnet POL ([Faucet](https://faucet.polygon.technology/))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd demo
forge install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your private key and RPC URL
```

```env
PRIVATE_KEY=0xYourPrivateKeyHere
RPC_URL=https://rpc-amoy.polygon.technology
ZK_VERIFIER=0x0000000000000000000000000000000000000000
MESSAGE_TTL=86400
```

### 3. Build

```bash
forge build
```

---

## 🧪 Running Tests

```bash
# Run all Messenger tests
forge test --match-path test/Messenger.t.sol -vvv
```

**40 tests** covering every feature:

| Category | Tests | Coverage |
|----------|-------|----------|
| Constructor | 4 | Owner, TTL, verifier init |
| Admin (setVerifier, setTTL) | 7 | Happy paths, access control, events |
| Public Key Registry | 5 | Register, overwrite, empty key, lookup |
| Send Message | 7 | Basic send, events, inbox, validations |
| ZK Proof Verification | 2 | Valid proof, invalid proof rejection |
| Read Receipts | 5 | Confirm read, access control, edge cases |
| Message Destruction | 6 | By sender/receiver, TTL expiry, access control |
| View Functions | 2 | Empty inbox, default values |
| Integration | 1 | Full lifecycle: send → read → destroy |
| **Total** | **40** | **All passing ✅** |

---

## 🌐 Deployment

### Deploy to Polygon Amoy

```bash
source .env
forge script script/Messenger.s.sol:DeployMessenger \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvvv
```

---

## 🔧 Contract Interaction

### Using Cast (Foundry CLI)

```bash
# Set variables
CONTRACT=0x1CF12E2cE65Dc51D16E37fE129b698CAAAefAC32
RPC=https://rpc-amoy.polygon.technology

# Read message count
cast call $CONTRACT "messageCount()" --rpc-url $RPC

# Read owner
cast call $CONTRACT "owner()" --rpc-url $RPC

# Send a message (replace with actual values)
cast send $CONTRACT \
  "sendMessage(bytes32,string,address,bytes)" \
  0x$(echo -n "hello world" | sha256sum | cut -d' ' -f1) \
  "QmYourIpfsCidHere" \
  0xReceiverAddress \
  0x00 \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY

# Confirm read (as receiver)
cast send $CONTRACT "confirmRead(uint256)" 0 \
  --rpc-url $RPC --private-key $RECEIVER_PRIVATE_KEY

# Get message details
cast call $CONTRACT "getMessage(uint256)" 0 --rpc-url $RPC

# Check inbox
cast call $CONTRACT "getInbox(address)" 0xReceiverAddress --rpc-url $RPC

# Register encryption public key
cast send $CONTRACT "registerPublicKey(bytes)" 0xYourPublicKey \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

---

## 🔒 Security

### On-Chain Privacy
- **No plaintext** is ever stored on-chain
- Only `keccak256` hashes and IPFS CID pointers are stored
- ZK proofs verify message validity without revealing content

### Access Control
- Only the **owner** can update the ZK verifier and TTL settings
- Only the **receiver** can confirm read receipts
- Only **sender or receiver** can destroy messages before TTL

### Message Lifecycle
- Messages auto-expire after the configured TTL
- On destruction, all on-chain data (hash + CID) is cleared
- Events provide an immutable audit trail

### Key Management
- Private keys are stored in `.env` (git-ignored)
- Encryption keys can be registered on-chain for lookup
- Frontend handles all encryption/decryption client-side

---

## 🗺 Responsibility Map

| Component | Where | Who Handles |
|-----------|-------|-------------|
| AES-256 Encryption | Frontend | Client JS/TS |
| ZK Proof Generation | Frontend/Backend | Prover service |
| IPFS Storage | Off-chain | Pinata / Infura / IPFS node |
| Message Commitment | On-chain | Smart Contract |
| ZK Proof Verification | On-chain | Smart Contract |
| Read Receipts | On-chain | Smart Contract |
| Message Destruction | On-chain | Smart Contract |
| L2 → L1 Proof | Infrastructure | Polygon Network |
| Decryption | Frontend | Client JS/TS |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using <a href="https://book.getfoundry.sh/">Foundry</a> and deployed on <a href="https://polygon.technology/">Polygon</a>
</p>

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
