'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/lib/constants';

interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    isConnected: false,
    chainId: null,
    isCorrectNetwork: false,
    isConnecting: false,
    error: null,
  });

  const checkNetwork = useCallback((chainId: number) => {
    return chainId === NETWORK_CONFIG.chainId;
  }, []);

  const switchToNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainIdHex }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      // Chain not added to MetaMask - add it
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: NETWORK_CONFIG.chainIdHex,
              chainName: NETWORK_CONFIG.chainName,
              rpcUrls: NETWORK_CONFIG.rpcUrls,
              blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
              nativeCurrency: NETWORK_CONFIG.nativeCurrency,
            },
          ],
        });
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask not found. Please install MetaMask.' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const isCorrectNetwork = checkNetwork(chainId);

      setState({
        address: accounts[0],
        provider,
        signer,
        isConnected: true,
        chainId,
        isCorrectNetwork,
        isConnecting: false,
        error: null,
      });

      if (!isCorrectNetwork) {
        await switchToNetwork();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'Failed to connect wallet',
      }));
    }
  }, [checkNetwork, switchToNetwork]);

  const disconnectWallet = useCallback(() => {
    setState({
      address: null,
      provider: null,
      signer: null,
      isConnected: false,
      chainId: null,
      isCorrectNetwork: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (state.isConnected) {
        const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
        const signer = await provider.getSigner();
        setState(prev => ({
          ...prev,
          address: accounts[0],
          provider,
          signer,
        }));
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string;
      const newChainId = parseInt(chainIdHex, 16);
      setState(prev => ({
        ...prev,
        chainId: newChainId,
        isCorrectNetwork: checkNetwork(newChainId),
      }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.isConnected, disconnectWallet, checkNetwork]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchToNetwork,
  };
}
