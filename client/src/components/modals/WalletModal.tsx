import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useWallet from "@/hooks/useWallet";
import { WalletType } from "@/lib/web3";
import { ChevronRight } from "lucide-react";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connect, isConnecting } = useWallet();
  
  const handleConnect = async (walletType: WalletType) => {
    await connect(walletType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1f2937] border border-[#374151] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-white">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mb-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-between bg-[#374151] hover:bg-background p-4 rounded-lg transition-colors border border-[#374151] group"
            onClick={() => handleConnect("metamask")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mr-3">
                <i className="fa-brands fa-firefox text-orange-500 text-xl"></i>
              </div>
              <span className="text-white font-medium">MetaMask</span>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-between bg-[#374151] hover:bg-background p-4 rounded-lg transition-colors border border-[#374151] group"
            onClick={() => handleConnect("coinbase")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                <i className="fa-solid fa-wallet text-blue-500 text-xl"></i>
              </div>
              <span className="text-white font-medium">Coinbase Wallet</span>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-between bg-[#374151] hover:bg-background p-4 rounded-lg transition-colors border border-[#374151] group"
            onClick={() => handleConnect("walletconnect")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mr-3">
                <i className="fa-solid fa-link text-purple-500 text-xl"></i>
              </div>
              <span className="text-white font-medium">WalletConnect</span>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" />
          </Button>
        </div>
        
        <p className="text-gray-400 text-sm text-center">
          By connecting your wallet, you agree to our <a href="#" className="text-primary hover:text-[#818cf8]">Terms of Service</a> and <a href="#" className="text-primary hover:text-[#818cf8]">Privacy Policy</a>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
