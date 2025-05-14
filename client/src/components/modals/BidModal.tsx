import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import useWallet from "@/hooks/useWallet";
import { placeBid } from "@/lib/web3";
import { placeBid as apiPlaceBid } from "@/lib/api";
import { Auction } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Info, Star, Trophy, Lightbulb } from "lucide-react";
import BidStrategySelector, { BidStrategyType, StrategyTip } from "@/components/auctions/BidStrategy";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction;
  onPlaceBid: (amount: string) => void;
  minimumBid: number;
}

export default function BidModal({ isOpen, onClose, auction, onPlaceBid, minimumBid }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState<string>((minimumBid || 0).toFixed(4));
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [selectedStrategy, setSelectedStrategy] = useState<BidStrategyType>("beginner-friendly");
  const [showPrompt, setShowPrompt] = useState(true);
  
  const { toast } = useToast();
  const { address, provider, balance, isConnected } = useWallet();
  const queryClient = useQueryClient();
  
  const minBid = minimumBid;
  
  const handleMaxBid = () => {
    if (balance) {
      const maxAmount = parseFloat(balance);
      // Set max bid to 90% of wallet balance to account for gas fees
      setBidAmount((Math.min(maxAmount * 0.9, parseFloat(balance))).toFixed(4));
    }
  };
  
  const handleSelectStrategy = (strategy: BidStrategyType) => {
    setSelectedStrategy(strategy);
    setShowPrompt(false);
    
    // Apply strategy-specific bid suggestions
    switch (strategy) {
      case "aggressive":
        // For aggressive, suggest a slightly higher bid
        setBidAmount((minBid * 1.05).toFixed(4));
        break;
      case "patient":
        // For patient strategy, suggest the minimum bid
        setBidAmount(minBid.toFixed(4));
        break;
      case "last-second":
        // For last-second, ready the minimum bid
        setBidAmount(minBid.toFixed(4));
        break;
      case "feint":
        // For feint, suggest the exact minimum
        setBidAmount(minBid.toFixed(4));
        break;
      case "early-bird":
        // For early bird, suggest a slightly higher bid to discourage others
        setBidAmount((minBid * 1.02).toFixed(4));
        break;
      default:
        // Default beginner-friendly approach
        setBidAmount(minBid.toFixed(4));
    }
  };
  
  const getStrategyTooltip = () => {
    switch (selectedStrategy) {
      case "aggressive":
        return "Respond instantly to outbid competitors and show determination.";
      case "patient":
        return "Wait for the right moment and avoid bidding wars.";
      case "last-second":
        return "Save your bids for the final moments of the auction.";
      case "feint":
        return "Place strategic bids to mislead competitors about your intentions.";
      case "early-bird":
        return "Start strong to discourage competition and establish dominance.";
      default:
        return "Focus on learning the mechanics and setting clear limits.";
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
        
        // Add strategy-specific messaging
        let successMessage = `Your bid of ${bidAmount} ${auction.currency} has been placed`;
        let strategyTip = "";
        
        switch (selectedStrategy) {
          case "aggressive":
            strategyTip = "Stay vigilant! Be ready to place another bid if someone outbids you.";
            break;
          case "patient":
            strategyTip = "Good move! Continue monitoring the auction for the right moment to bid again.";
            break;
          case "last-second":
            strategyTip = "Great timing! Remember to prepare for the next opportunity as the auction nears its end.";
            break;
          case "feint":
            strategyTip = "Strategic placement! Now watch how others respond before your next move.";
            break;
          case "early-bird":
            strategyTip = "Strong start! Your early presence may discourage other bidders.";
            break;
          default:
            strategyTip = "Well done! Keep track of your budget as the auction progresses.";
        }
        
        toast({
          title: "Bid Placed Successfully",
          description: (
            <div>
              {successMessage}
              <p className="mt-1 text-sm font-medium text-primary">{strategyTip}</p>
            </div>
          ),
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
      <DialogContent className="bg-[#1f2937] border border-[#374151] text-white sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-white">Place a Bid</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose your bidding approach for {auction.nft.name}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#374151]/50 p-1 rounded-xl mb-4">
            <TabsTrigger 
              value="basic" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Basic Bidding
            </TabsTrigger>
            <TabsTrigger 
              value="strategy" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Strategic Bidding
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-0">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-lg overflow-hidden">
                <img src={auction.nft.imageUrl || '/placeholder-image.jpg'} alt={`${auction.nft.name} thumbnail`} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-white font-medium text-lg">{auction.nft.name}</h4>
                <p className="text-gray-400 text-sm">Current bid: <span className="text-white">{auction.currentBid || 0} {auction.currency}</span></p>
                <div className="flex items-center mt-1">
                  <span className="text-gray-400 text-xs mr-2">Total bids:</span>
                  <span className="text-white text-xs">{auction.bidCount || 0}</span>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="ml-4 inline-flex items-center text-primary text-xs">
                          <StrategyTip type={selectedStrategy} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-[#111827] border border-[#374151] p-3">
                        <p className="text-sm text-white">{getStrategyTooltip()}</p>
                        <p className="text-xs text-gray-400 mt-1">Switch to Strategic tab for more options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
          </TabsContent>
          
          <TabsContent value="strategy" className="mt-0">
            {showPrompt ? (
              <div className="bg-[#111827] border border-[#374151] rounded-xl p-5 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-medium text-white">Enhance Your Bidding Strategy</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Bidcoin offers strategic bidding options to improve your chances of winning auctions. 
                  Each strategy has different advantages based on auction dynamics and competition.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#1f2937] p-3 rounded-lg border border-[#374151]">
                    <div className="flex items-center mb-2">
                      <Trophy className="h-4 w-4 text-primary mr-2" />
                      <span className="text-white text-sm font-medium">Improved Win Rate</span>
                    </div>
                    <p className="text-xs text-gray-400">Strategic approaches can increase your chances of success</p>
                  </div>
                  <div className="bg-[#1f2937] p-3 rounded-lg border border-[#374151]">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-primary mr-2" />
                      <span className="text-white text-sm font-medium">Cost Efficiency</span>
                    </div>
                    <p className="text-xs text-gray-400">Some strategies help you optimize your bid budget</p>
                  </div>
                  <div className="bg-[#1f2937] p-3 rounded-lg border border-[#374151]">
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 text-primary mr-2" />
                      <span className="text-white text-sm font-medium">Learning Curve</span>
                    </div>
                    <p className="text-xs text-gray-400">Discover different bidding styles to find what works for you</p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors" 
                  onClick={() => setShowPrompt(false)}
                >
                  Explore Strategies <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <BidStrategySelector 
                onSelectStrategy={handleSelectStrategy} 
                defaultStrategy={selectedStrategy}
              />
            )}
          </TabsContent>
        </Tabs>
        
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