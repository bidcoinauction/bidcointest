import { useState, useCallback, useEffect } from "react";
import { 
  connectWallet, 
  disconnectWallet, 
  WalletType, 
  WalletConnection, 
  ConnectionState 
} from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
  const [walletConnection, setWalletConnection] = useState<WalletConnection>({
    address: null,
    balance: null,
    chainId: null,
    provider: null,
    state: ConnectionState.DISCONNECTED,
    error: null
  });
  
  const { toast } = useToast();

  // Check for existing connection on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    const savedType = localStorage.getItem("walletType") as WalletType | null;
    
    if (savedAddress && savedType) {
      connect(savedType);
    }
  }, []);

  // Connect to wallet
  const connect = useCallback(async (walletType: WalletType) => {
    try {
      setWalletConnection(prev => ({ ...prev, state: ConnectionState.CONNECTING }));
      
      const connection = await connectWallet(walletType);
      
      if (connection.state === ConnectionState.CONNECTED && connection.address) {
        // Save wallet info to local storage
        localStorage.setItem("walletAddress", connection.address);
        localStorage.setItem("walletType", walletType);
        
        setWalletConnection(connection);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletType} wallet`,
        });
      } else {
        throw new Error(connection.error || "Failed to connect to wallet");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      
      setWalletConnection({
        address: null,
        balance: null,
        chainId: null,
        provider: null,
        state: ConnectionState.ERROR,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    }
  }, [toast]);

  // Disconnect from wallet
  const disconnect = useCallback(() => {
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletType");
    
    setWalletConnection(disconnectWallet());
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  return {
    ...walletConnection,
    connect,
    disconnect,
    isConnected: walletConnection.state === ConnectionState.CONNECTED,
    isConnecting: walletConnection.state === ConnectionState.CONNECTING,
    isDisconnected: walletConnection.state === ConnectionState.DISCONNECTED,
    hasError: walletConnection.state === ConnectionState.ERROR
  };
}

export default useWallet;
