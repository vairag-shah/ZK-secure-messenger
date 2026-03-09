# 🔐 ZK Secure Messenger

![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)
![Ethereum](https://img.shields.io/badge/Ethereum-Web3-black)
![IPFS](https://img.shields.io/badge/IPFS-storage-green)
![ZK Proof](https://img.shields.io/badge/ZK-Proof-purple)
![License](https://img.shields.io/badge/license-MIT-yellow)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Build](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/YOUR_REPO/ci.yml)

A privacy-focused decentralized messaging protocol that enables wallet-to-wallet encrypted communication using IPFS storage and zero-knowledge verification.

---

# ✨ Features

🔐 End-to-End Wallet Encryption  
📦 Encrypted Message Storage on IPFS  
🧾 ZK Proof Verification for Message Commitments  
📬 Decentralized Inbox  
⏱ Self-Destructing Messages (TTL)  
📖 Read Receipt Confirmation  
⚡ Layer2 Ready for Low Gas Fees  

---

# 🏗 Architecture

User writes message

↓

ECDH Wallet Encryption

↓

AES Encrypted Payload

↓

Upload Encrypted Data to IPFS

↓

Store Message Hash + CID On-chain

↓

Receiver Fetches IPFS Payload

↓

Decrypt Message Using Wallet

↓

Confirm Read / Destroy Message


---

# 📂 Project Structure


contracts/
Messenger.sol

frontend/
Next.js dApp
Wallet Encryption
IPFS Upload
Message UI


---

# 🛠 Tech Stack

Smart Contracts
- Solidity
- Ethereum
- Hardhat

Frontend
- Next.js
- TypeScript
- TailwindCSS
- ethers.js

Storage
- IPFS
- Pinata

Cryptography
- AES Encryption
- Wallet ECDH
- Zero Knowledge Proofs

---

# 🔒 Security Model

Messages are never stored in plaintext.

Only the following data exists on-chain:

- message hash
- IPFS CID
- sender address
- receiver address
- timestamp

Only the receiver wallet can decrypt the encrypted payload.

---

# 🚀 Getting Started

### Install dependencies


npm install


### Run frontend


cd frontend
npm run dev


### Deploy contracts


npx hardhat run scripts/deploy.js --network sepolia


---

# 🧪 Testing


npx hardhat test


---

# 📜 License

MIT

Replace:

YOUR_USERNAME
YOUR_REPO
