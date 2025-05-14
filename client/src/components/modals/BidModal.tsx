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
import { placeBid } from "@/lib/api";
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
  // Fixed values for penny auction mechanics
  const [bidAmount, setBidAmount] = useState<string>("0.03");
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [selectedStrategy, setSelectedStrategy] = useState<BidStrategyType>("beginner-friendly");
  const [showPrompt, setShowPrompt] = useState(true);
  
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  // Mock balance for demo purposes (in USD)
  const balance = "100.0";
  const queryClient = useQueryClient();
  
  // In penny auctions, bids are fixed price increments
  const minBid = 0.03; // Fixed $0.03 price increment
  
  const handleMaxBid = () => {
    // No maximum bid in penny auctions - each bid is a fixed $0.03 increment
    setBidAmount("0.03");
    toast({
      title: "Penny Auction Mechanics",
      description: "Each bid costs $0.24 but only increases the price by $0.03",
    });
  };
  
  const handleSelectStrategy = (strategy: BidStrategyType) => {
    setSelectedStrategy(strategy);
    setShowPrompt(false);
    
    // In penny auctions, the bid amount is always fixed
    // We're just applying different strategies for when to bid
    setBidAmount("0.03");
    
    // Show strategy-specific toasts
    switch (strategy) {
      case "aggressive":
        toast({
          title: "Aggressive Strategy Selected",
          description: "Bid frequently to intimidate other bidders",
        });
        break;
      case "patient":
        toast({
          title: "Patient Strategy Selected",
          description: "Wait for the right moment to place strategic bids",
        });
        break;
      case "last-second":
        toast({
          title: "Last-Second Strategy Selected", 
          description: "Wait until the final seconds to place your bid",
        });
        break;
      case "feint":
        toast({
          title: "Feint Strategy Selected",
          description: "Mislead competitors with your bidding pattern",
        });
        break;
      case "early-bird":
        toast({
          title: "Early Bird Strategy Selected",
          description: "Start bidding early to establish presence",
        });
        break;
      default:
        // Default beginner-friendly approach
        toast({
          title: "Beginner Strategy Selected",
          description: "Focus on learning the mechanics and setting clear limits",
        });
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
    if (!address || !isConnected) {
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
        description: `Each bid costs $0.24 and increases auction price by $0.03`,
      });
      return;
    }
    
    if (balance && 0.24 > parseFloat(balance)) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: `Your balance is $${balance}. You need more bids to continue.`,
      });
      return;
    }
    
    try {
      setIsPending(true);
      
      // Add strategy-specific messaging
      let successMessage = `Your bid has been placed! Auction price has increased`;
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
      
      // Call API to place bid
      await placeBid(auction.id, bidAmount, address);
      
      // Invalidate queries to refresh auction data
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auction.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      
      // Show success message
      toast({
        title: "Bid Placed Successfully",
        description: (
          <div>
            {successMessage}
            <p className="mt-1 text-sm font-medium text-primary">{strategyTip}</p>
          </div>
        ),
      });
      
      // Notify parent component
      onPlaceBid(bidAmount);
      
      // Close modal
      onClose();
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
                <p className="text-gray-400 text-sm">Current bid: <span className="text-white">${auction.currentBid || 0}</span></p>
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
              <label className="block text-gray-400 text-sm mb-2">Bid Information</label>
              <div className="bg-[#111827] p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Bid cost:</span>
                  <span className="text-white">$0.24</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price increase:</span>
                  <span className="text-white">$0.03</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Timer extension:</span>
                  <span className="text-white">60 seconds</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Each bid costs $0.24 but only increases auction price by $0.03</p>
            </div>
            
            <div className="bg-[#111827] p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Your balance:</span>
                <span className="text-white">${balance || "0.00"}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Bid cost:</span>
                <span className="text-white">$0.24</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Processing fee:</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-background">
                <span className="text-gray-200 font-medium">Total per bid:</span>
                <span className="text-white font-medium">$0.24</span>
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
            {isPending ? "Processing..." : "Place Bid"}
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