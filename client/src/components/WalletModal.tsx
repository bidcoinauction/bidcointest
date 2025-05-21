import { useState } from 'react';

type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

export const WalletModal = ({ isOpen, onClose, onConnect }: WalletModalProps) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (walletType: WalletProvider) => {
    setConnecting(true);
    setError(null);
    
    try {
      if (walletType === 'metamask') {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }
        
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
          onClose();
        }
      } else {
        // Implement other wallet providers
        throw new Error(`${walletType} connection not implemented yet`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Connect Wallet</h2>
        {error && <div className="error-message">{error}</div>}
        
        <button 
          onClick={() => connectWallet('metamask')}
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : 'MetaMask'}
        </button>
        
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};