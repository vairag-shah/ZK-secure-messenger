import { ethers } from 'ethers';

/**
 * Generate a keccak256 hash of the encrypted message payload.
 * This hash is stored on-chain as a commitment to the message content.
 */
export function generateMessageHash(encryptedPayload: string): string {
  const encoded = ethers.toUtf8Bytes(encryptedPayload);
  return ethers.keccak256(encoded);
}
