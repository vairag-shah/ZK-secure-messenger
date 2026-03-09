'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract, getReadOnlyContract } from '@/lib/contract';
import { encryptMessage, decryptMessageLocal, deriveEncryptionKeypair } from '@/lib/encryption';
import { generateMessageHash } from '@/lib/hash';
import { uploadToIPFS, fetchFromIPFS } from '@/lib/ipfs';
import { generateZkProof } from '@/lib/zkproof';
import { GAS_OVERRIDES } from '@/lib/constants';

export type TxStatus = 'idle' | 'encrypting' | 'hashing' | 'uploading' | 'sending' | 'confirming' | 'success' | 'error';

export interface Message {
  id: number;
  messageHash: string;
  ipfsCid: string;
  sender: string;
  receiver: string;
  timestamp: number;
  isRead: boolean;
  isDestroyed: boolean;
  decryptedContent?: string;
  decryptedSender?: string;
  decryptedTimestamp?: number;
}

export function useMessenger(
  signer: ethers.JsonRpcSigner | null,
  provider: ethers.BrowserProvider | null,
  walletAddress: string | null
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [isKeyRegistered, setIsKeyRegistered] = useState<boolean | null>(null);

  /**
   * Check if the current user has registered their encryption key on-chain
   */
  const checkKeyRegistered = useCallback(async () => {
    if (!provider || !walletAddress) return;
    try {
      const contract = getReadOnlyContract(provider);
      const onChainKey: string = await contract.getPublicKey(walletAddress);
      setIsKeyRegistered(onChainKey !== '0x' && onChainKey.length > 2);
    } catch {
      setIsKeyRegistered(false);
    }
  }, [provider, walletAddress]);

  /**
   * Full send message flow:
   * 1. Get receiver's encryption public key
   * 2. Encrypt the message
   * 3. Generate message hash
   * 4. Upload to IPFS
   * 5. Generate ZK proof (placeholder)
   * 6. Call smart contract sendMessage
   */
  const sendMessage = useCallback(async (receiverAddress: string, plaintext: string) => {
    if (!signer || !walletAddress) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setTxHash(null);

    try {
      // Step 1: Get receiver's encryption public key from on-chain registry
      setTxStatus('encrypting');

      const contract = getContract(signer);
      let receiverPublicKey: string;

      try {
        const onChainKey: string = await contract.getPublicKey(receiverAddress);
        // onChainKey is a hex-encoded bytes value from the contract
        // Empty = "0x", registered = "0x..." with actual data
        if (onChainKey && onChainKey !== '0x' && onChainKey.length > 2) {
          // Decode hex bytes back to the base64 public key string
          receiverPublicKey = ethers.toUtf8String(onChainKey);
        } else {
          throw new Error(
            'Receiver has not registered their encryption key. ' +
            'The receiver wallet must open ZK Messenger and click the key icon (🔑) to register before you can send them messages.'
          );
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (err.message?.includes('Receiver has not registered')) {
          throw e;
        }
        throw new Error(
          'Could not look up receiver encryption key. ' +
          'Make sure the receiver address is correct and they have registered their key on-chain.'
        );
      }

      // Step 2: Encrypt the message
      const encryptedPayload = encryptMessage(receiverPublicKey, plaintext, walletAddress);

      // Step 3: Generate message hash
      setTxStatus('hashing');
      const messageHash = generateMessageHash(encryptedPayload);

      // Step 4: Upload to IPFS
      setTxStatus('uploading');
      const ipfsCid = await uploadToIPFS(encryptedPayload);

      // Step 5: Generate ZK proof
      const zkProof = generateZkProof(messageHash);

      // Step 6: Send transaction
      setTxStatus('sending');
      const tx = await contract.sendMessage(
        messageHash,
        ipfsCid,
        receiverAddress,
        zkProof,
        GAS_OVERRIDES
      );

      setTxHash(tx.hash);
      setTxStatus('confirming');
      await tx.wait();

      setTxStatus('success');

      // Auto-reset status after 5 seconds
      setTimeout(() => {
        setTxStatus('idle');
        setTxHash(null);
      }, 5000);

    } catch (err: unknown) {
      const error = err as { message?: string };
      setTxStatus('error');
      setError(error.message || 'Failed to send message');
    }
  }, [signer, walletAddress]);

  /**
   * Fetch inbox messages from the smart contract
   */
  const fetchInbox = useCallback(async () => {
    if (!provider || !walletAddress) return;

    setIsLoadingInbox(true);

    try {
      const contract = getReadOnlyContract(provider);
      const messageIds: bigint[] = await contract.getInbox(walletAddress);

      const fetchedMessages: Message[] = [];

      for (const id of messageIds) {
        try {
          const msg = await contract.getMessage(id);

          if (!msg[6]) { // Not destroyed
            fetchedMessages.push({
              id: Number(id),
              messageHash: msg[0],
              ipfsCid: msg[1],
              sender: msg[2],
              receiver: msg[3],
              timestamp: Number(msg[4]) * 1000, // Convert to ms
              isRead: msg[5],
              isDestroyed: msg[6],
            });
          }
        } catch {
          console.warn(`Failed to fetch message ${id}`);
        }
      }

      // Sort by timestamp, newest first
      fetchedMessages.sort((a, b) => b.timestamp - a.timestamp);
      setMessages(fetchedMessages);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to fetch inbox');
    } finally {
      setIsLoadingInbox(false);
    }
  }, [provider, walletAddress]);

  /**
   * Decrypt a message using wallet-derived key, then confirm read on-chain
   */
  const decryptAndRead = useCallback(async (messageId: number, ipfsCid: string) => {
    if (!signer || !walletAddress) return;

    try {
      // Fetch encrypted payload from IPFS
      const ipfsData = await fetchFromIPFS(ipfsCid);

      // Derive decryption key from wallet signature
      const { secretKey } = await deriveEncryptionKeypair(signer);

      // Decrypt locally using derived private key
      const decrypted = decryptMessageLocal(
        ipfsData.encryptedMessage,
        secretKey
      );

      // Update message in state with decrypted content
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? {
              ...msg,
              decryptedContent: decrypted.message,
              decryptedSender: decrypted.sender,
              decryptedTimestamp: decrypted.timestamp,
            }
            : msg
        )
      );

      // Auto confirm read on-chain
      try {
        const contract = getContract(signer);
        const tx = await contract.confirmRead(messageId, GAS_OVERRIDES);
        await tx.wait();

        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
      } catch {
        console.warn('Failed to confirm read on-chain');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to decrypt message');
    }
  }, [signer, walletAddress]);

  /**
   * Destroy a message on-chain
   */
  const destroyMessage = useCallback(async (messageId: number) => {
    if (!signer) return;

    try {
      const contract = getContract(signer);
      const tx = await contract.destroyMessage(messageId, GAS_OVERRIDES);
      await tx.wait();

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to destroy message');
    }
  }, [signer]);

  /**
   * Register encryption public key on-chain
   */
  const registerPublicKey = useCallback(async () => {
    if (!signer || !walletAddress) return;

    try {
      // Derive encryption keypair from wallet signature (no deprecated MetaMask APIs)
      const { publicKey } = await deriveEncryptionKeypair(signer);
      const contract = getContract(signer);
      const tx = await contract.registerPublicKey(ethers.toUtf8Bytes(publicKey), GAS_OVERRIDES);
      await tx.wait();
      setIsKeyRegistered(true);
      setError(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error.message?.includes('user rejected') || error.message?.includes('ACTION_REJECTED')) {
        setError('Signature request was rejected. Please sign the message to generate your encryption key.');
      } else {
        setError(error.message || 'Failed to register public key');
      }
    }
  }, [signer, walletAddress]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    txStatus,
    txHash,
    error,
    isLoadingInbox,
    isKeyRegistered,
    sendMessage,
    fetchInbox,
    decryptAndRead,
    destroyMessage,
    registerPublicKey,
    checkKeyRegistered,
    clearError,
  };
}
