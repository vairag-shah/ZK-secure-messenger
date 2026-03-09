import { encrypt } from '@metamask/eth-sig-util';
import nacl from 'tweetnacl';
import { ethers } from 'ethers';
import { ENCRYPTION_VERSION } from './constants';

interface MessagePayload {
  message: string;
  sender: string;
  timestamp: number;
}

// Fixed message used to deterministically derive encryption keys from a wallet signature
const KEY_DERIVATION_MESSAGE =
  'Sign this message to generate your ZK Messenger encryption key.\n\n' +
  'This does NOT trigger a transaction or cost any gas.';

function uint8ToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  // Normalize base64url to standard base64 and fix padding
  let normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an x25519 encryption keypair deterministically from a wallet signature.
 * The user signs a fixed message, and we use the keccak256 hash of the signature
 * as the 32-byte secret key for nacl.box (x25519).
 *
 * This replaces the deprecated eth_getEncryptionPublicKey MetaMask method.
 */
export async function deriveEncryptionKeypair(
  signer: ethers.Signer
): Promise<{ publicKey: string; secretKey: string }> {
  const signature = await signer.signMessage(KEY_DERIVATION_MESSAGE);
  const hash = ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes(signature)));
  const keypair = nacl.box.keyPair.fromSecretKey(hash);
  return {
    publicKey: uint8ToBase64(keypair.publicKey),
    secretKey: uint8ToBase64(keypair.secretKey),
  };
}

/**
 * Encrypt a message using the receiver's public encryption key.
 * Uses x25519-xsalsa20-poly1305 encryption via @metamask/eth-sig-util.
 */
export function encryptMessage(
  receiverPublicKey: string,
  message: string,
  senderAddress: string
): string {
  const payload: MessagePayload = {
    message,
    sender: senderAddress,
    timestamp: Date.now(),
  };

  const encryptedData = encrypt({
    publicKey: receiverPublicKey,
    data: JSON.stringify(payload),
    version: ENCRYPTION_VERSION,
  });

  return JSON.stringify(encryptedData);
}

/**
 * Decrypt an encrypted message using the locally-derived private key.
 * Uses tweetnacl directly to perform x25519-xsalsa20-poly1305 decryption.
 */
export function decryptMessageLocal(
  encryptedPayload: string,
  secretKey: string
): MessagePayload {
  const encryptedData = JSON.parse(encryptedPayload);

  const nonce = base64ToUint8(encryptedData.nonce);
  const ephemeralPublicKey = base64ToUint8(encryptedData.ephemPublicKey);
  const ciphertext = base64ToUint8(encryptedData.ciphertext);
  const receiverSecretKey = base64ToUint8(secretKey);

  const decryptedBytes = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    receiverSecretKey
  );

  if (!decryptedBytes) {
    throw new Error('Failed to decrypt message. You may not be the intended recipient.');
  }

  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText) as MessagePayload;
}
