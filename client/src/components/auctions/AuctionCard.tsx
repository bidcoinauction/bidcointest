import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import BidModal from "@/components/modals/BidModal";
import { useCountdown } from "@/hooks/useCountdown";
import { Auction } from "@shared/schema";
import { formatCurrency, formatAddress } from "@/lib/utils";
import { Clock, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [localBidCount, setLocalBidCount] = useState(auction.bidCount || 0);
  const [localCurrentBid, setLocalCurrentBid] = useState(auction.currentBid || auction.startingBid);
  const [localLeader, setLocalLeader] = useState(auction.creator.walletAddress || "");
  
  // Get real-time auction data via WebSocket
  const { subscribe } = useWebSocket();
  
  // Timer system - each bid resets to 10 seconds per Bidcoin mechanics
  const [localEndTime, setLocalEndTime] = useState<Date>(
    auction.endTime ? new Date(auction.endTime) : new Date(Date.now() + 10000)
  );
  
  const { formattedTime, isComplete, secondsRemaining } = useCountdown({
    endTime: localEndTime,
    onComplete: () => {
      // Auction complete logic
      console.log("Auction complete!");
    }
  });
  
  // Listen for bid events via WebSocket
  useEffect(() => {
    const handleBidUpdate = (data: any) => {
      if (data.auctionId === auction.id) {
        // Update local state with new bid information
        setLocalBidCount(data.bidCount);
        setLocalCurrentBid(data.currentBid);
        setLocalLeader(data.bidderAddress);
        
        // Reset timer (Bidcoin reset mechanism)
        const resetTime = new Date();
        resetTime.setSeconds(resetTime.getSeconds() + 10);
        
        // If bid in last 3 seconds, add +3 seconds (prevent sniping)
        if (secondsRemaining < 3) {
          resetTime.setSeconds(resetTime.getSeconds() + 3);
        }
        
        setLocalEndTime(resetTime);
      }
    };
    
    // Subscribe to auction bid updates
    const unsubscribe = subscribe("bid", handleBidUpdate);
    
    return () => {
      // Cleanup subscription
      unsubscribe;
    };
  }, [auction.id, subscribe, secondsRemaining]);
  
  // Format auction leader address
  const leaderDisplay = formatAddress(localLeader);
  
  // Get color coding for time remaining
  const getTimeClass = () => {
    if (isComplete) return "text-red-500";
    if (secondsRemaining <= 3) return "text-red-500 animate-pulse";
    if (secondsRemaining <= 10) return "text-amber-500";
    return "text-green-500";
  };
  
  // Format bid price with tiny increment ($0.01 per bid)
  const bidIncrement = (localBidCount * 0.01).toFixed(2);
  
  return (
    <div className="bg-[#111827] rounded-lg overflow-hidden transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]">
      <div 
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `/auctions/${auction.id}`;
        }} 
        className="cursor-pointer"
      >
        <div className="relative">
          <img 
            src={auction.nft.imageUrl || `https://via.placeholder.com/400x300/171717/FFFFFF?text=${encodeURIComponent(auction.nft.name)}`}
            alt={auction.nft.name}
            className="w-full h-48 object-cover"
          />
          {isComplete && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-red-600 text-white px-3 py-1 text-sm font-bold">
                AUCTION ENDED
              </Badge>
            </div>
          )}
          {localBidCount > 0 && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-xs font-bold">
              {localBidCount} bids
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <h3 className="text-white font-bold text-sm truncate">{auction.nft.name}</h3>
            <div className="text-xs text-gray-300 truncate">#{auction.nft.tokenId}</div>
          </div>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-xs text-gray-400">Leader</div>
              <div className="text-xs text-white truncate font-mono">{leaderDisplay}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Price</div>
              <div className="text-white text-sm font-medium flex items-center">
                {formatCurrency(localCurrentBid || 0, auction.currency || 'ETH')}
                <span className="text-xs ml-1 opacity-70">≈</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-xs text-gray-400">Time Left</div>
              <div className={`text-white text-sm font-mono flex items-center ${getTimeClass()}`}>
                <Clock className="w-3 h-3 mr-1" />
                {formattedTime}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Bid Value</div>
              <div className="text-white text-xs flex items-center">
                <span className="text-green-400 mr-1">+$0.01</span> 
                <span className="text-xs text-gray-300">per bid</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button 
              className={`${isComplete ? 'bg-gray-700 hover:bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-1 px-2 rounded-md transition-all text-sm`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                !isComplete && setShowBidModal(true);
              }}
              disabled={isComplete}
            >
              {isComplete ? "Ended" : "Bid"}
            </Button>
            
            <Button 
              variant="outline"
              className={`${isTracked 
                ? 'border border-green-500 text-green-500 hover:bg-green-500/10' 
                : 'border border-blue-600 text-blue-600 hover:bg-blue-600/10'} 
                font-medium py-1 px-2 rounded-md transition-all text-sm`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isComplete) {
                  setIsTracked(!isTracked);
                }
              }}
            >
              {isTracked ? (
                <span className="flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Tracked
                </span>
              ) : "Track"}
            </Button>
          </div>
          
          {/* Bid increment indicator based on Bidcoin model */}
          <div className="mt-2 text-xs text-gray-400 text-center">
            <div className="flex justify-between items-center">
              <span>Starting: {formatCurrency(auction.startingBid, auction.currency || 'ETH')}</span>
              <span>+${bidIncrement}</span>
            </div>
          </div>
        </div>
      </div>

      <BidModal 
        open={showBidModal} 
        onOpenChange={setShowBidModal} 
        auction={{
          ...auction,
          currentBid: localCurrentBid,
          bidCount: localBidCount
        }}
      />
    </div>
  );
}
