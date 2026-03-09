// Network configuration for Polygon Amoy Testnet (Layer 2)
// Using Polygon L2 for low gas transactions
// Can be reconfigured to zkSync or Scroll by updating these values
import { ethers } from 'ethers';
export const NETWORK_CONFIG = {
  chainId: 80002,
  chainIdHex: '0x13882',
  chainName: 'Polygon Amoy Testnet',
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
} as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  || '0x1CF12E2cE65Dc51D16E37fE129b698CAAAefAC32';

export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
export const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY
  || 'https://gateway.pinata.cloud/ipfs';

export const ENCRYPTION_VERSION = 'x25519-xsalsa20-poly1305';

// Polygon Amoy requires a minimum 25 Gwei priority fee
export const GAS_OVERRIDES = {
  maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
  maxFeePerGas: ethers.parseUnits('50', 'gwei'),
};
