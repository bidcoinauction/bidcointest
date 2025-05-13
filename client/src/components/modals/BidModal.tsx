import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import useWallet from "@/hooks/useWallet";
import { placeBid } from "@/lib/web3";
import { placeBid as apiPlaceBid } from "@/lib/api";
import { Auction } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction;
  onPlaceBid: (amount: string) => void;
  minimumBid: number;
}

export default function BidModal({ isOpen, onClose, auction, onPlaceBid, minimumBid }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState<string>((minimumBid || 0).toFixed(2));
  const [isPending, setIsPending] = useState(false);
  
  const { toast } = useToast();
  const { address, provider, balance, isConnected } = useWallet();
  const queryClient = useQueryClient();
  
  const minBid = minimumBid;
  
  const handleMaxBid = () => {
    if (balance) {
      const maxAmount = parseFloat(balance);
      // Set max bid to 90% of wallet balance to account for gas fees
      setBidAmount((Math.min(maxAmount * 0.9, parseFloat(balance))).toFixed(2));
    }
  };
  
  const handleBidSubmit = async () => {
    if (!address || !provider || !isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place a bid",
      });
      return;
    }
    
    const bidValue = parseFloat(bidAmount);
    
    if (isNaN(bidValue) || bidValue < minBid) {
      toast({
        variant: "destructive",
        title: "Invalid Bid Amount",
        description: `Minimum bid is ${minBid} ${auction.currency}`,
      });
      return;
    }
    
    if (balance && bidValue > parseFloat(balance)) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: `Your balance is ${balance} ${auction.currency}`,
      });
      return;
    }
    
    try {
      setIsPending(true);
      
      // Execute the web3 transaction
      const success = await placeBid(
        auction.id,
        bidAmount,
        provider
      );
      
      if (success) {
        // Record the bid in our database
        await apiPlaceBid(auction.id, bidAmount, address);
        
        // Invalidate queries to refresh auction data
        queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auction.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
        
        toast({
          title: "Bid Placed Successfully",
          description: `Your bid of ${bidAmount} ${auction.currency} has been placed`,
        });
        
        onPlaceBid(bidAmount);
        onClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Bid Failed",
        description: error instanceof Error ? error.message : "Failed to place bid",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-[#1f2937] border border-[#374151] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-white">Place a Bid</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-lg overflow-hidden">
            <img src={auction.nft.imageUrl || '/placeholder-image.jpg'} alt={`${auction.nft.name} thumbnail`} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-white font-medium text-lg">{auction.nft.name}</h4>
            <p className="text-gray-400 text-sm">Current bid: <span className="text-white">{auction.currentBid || 0} {auction.currency}</span></p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">Your bid ({auction.currency})</label>
          <div className="flex">
            <Input
              type="number"
              min={minBid}
              step="0.01"
              placeholder={minBid.toString()}
              className="bg-background text-white border border-[#374151] rounded-l-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-primary"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <Button
              className="bg-primary hover:bg-[#4f46e5] text-white font-medium px-4 py-3 rounded-r-lg transition-colors"
              onClick={handleMaxBid}
            >
              Max
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Minimum bid: {minBid} {auction.currency}</p>
        </div>
        
        <div className="bg-[#111827] p-4 rounded-lg mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Your balance:</span>
            <span className="text-white">{balance || "0.00"} {auction.currency}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Bid amount:</span>
            <span className="text-white">{bidAmount} {auction.currency}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Transaction fee:</span>
            <span className="text-white">0.002 {auction.currency}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-background">
            <span className="text-gray-200 font-medium">Total:</span>
            <span className="text-white font-medium">{(parseFloat(bidAmount) + 0.002).toFixed(3)} {auction.currency}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-[#4f46e5] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-glow"
            onClick={handleBidSubmit}
            disabled={isPending}
          >
            {isPending ? "Processing..." : "Confirm Bid"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-background hover:bg-[#374151] text-white py-3 px-4 rounded-lg transition-colors border border-[#374151]"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}