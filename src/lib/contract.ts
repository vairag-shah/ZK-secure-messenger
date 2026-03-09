import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './constants';

export const CONTRACT_ABI = [
  {
    type: 'function',
    name: 'sendMessage',
    inputs: [
      { name: '_messageHash', type: 'bytes32' },
      { name: '_ipfsCid', type: 'string' },
      { name: '_receiver', type: 'address' },
      { name: '_zkProof', type: 'bytes' },
    ],
    outputs: [{ name: 'messageId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'confirmRead',
    inputs: [{ name: '_messageId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'destroyMessage',
    inputs: [{ name: '_messageId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getInbox',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMessage',
    inputs: [{ name: '_messageId', type: 'uint256' }],
    outputs: [
      { name: 'messageHash', type: 'bytes32' },
      { name: 'ipfsCid', type: 'string' },
      { name: 'sender_', type: 'address' },
      { name: 'receiver_', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'read_', type: 'bool' },
      { name: 'destroyed_', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'registerPublicKey',
    inputs: [{ name: '_publicKey', type: 'bytes' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPublicKey',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'messageCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'messageTTL',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'MessageSent',
    inputs: [
      { name: 'messageId', type: 'uint256', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'messageHash', type: 'bytes32', indexed: false },
      { name: 'ipfsCid', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MessageRead',
    inputs: [
      { name: 'messageId', type: 'uint256', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MessageDestroyed',
    inputs: [
      { name: 'messageId', type: 'uint256', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PublicKeyRegistered',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
] as const;

export function getContract(signer: ethers.Signer): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export function getReadOnlyContract(provider: ethers.Provider): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}
