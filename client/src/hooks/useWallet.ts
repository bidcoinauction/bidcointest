import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

type WalletProvider = 'metamask' | 'wallet-connect' | 'phantom';

interface UseWalletReturn {
  address: string | null;
  connect: (provider: WalletProvider) => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  switchChain: (chainId: number) => Promise<void>;
}

const useWallet = (): UseWalletReturn => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const { toast } = useToast();

  // Check for existing wallet connection on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem('wallet_address');
    const storedChainId = localStorage.getItem('wallet_chain_id');
    
    if (storedAddress) {
      setAddress(storedAddress);
      setChainId(storedChainId ? parseInt(storedChainId) : null);
    }
  }, []);

  const connect = async (provider: WalletProvider) => {
    setIsConnecting(true);
    
    try {
      // Mock implementation - in real app this would interact with actual wallets
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, generate a random wallet address
      // In a real implementation, this would come from the wallet provider
      const mockAddress = `0x${Array.from({length: 40}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')}`;
      
      // Default to Ethereum Mainnet
      const mockChainId = 1;
      
      setAddress(mockAddress);
      setChainId(mockChainId);
      
      // Store in localStorage for persistence
      localStorage.setItem('wallet_address', mockAddress);
      localStorage.setItem('wallet_chain_id', mockChainId.toString());
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${provider} wallet`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chain_id');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const switchChain = async (newChainId: number) => {
    try {
      // In a real implementation, this would request the wallet to switch chains
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setChainId(newChainId);
      localStorage.setItem('wallet_chain_id', newChainId.toString());
      
      toast({
        title: "Network Changed",
        description: `Switched to chain ID: ${newChainId}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : "Failed to switch network",
      });
    }
  };

  return {
    address,
    connect,
    disconnect,
    isConnected: !!address,
    isConnecting,
    chainId,
    switchChain,
  };
};

export default useWallet;