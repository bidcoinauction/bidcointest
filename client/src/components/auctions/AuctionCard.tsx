import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import BidModal from "@/components/modals/BidModal";
import { useCountdown } from "@/hooks/useCountdown";
import { Auction } from "@shared/schema";
import { formatCurrency, formatAddress, formatPriceUSD } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [localBidCount, setLocalBidCount] = useState(auction.bidCount || 0);
  const [localCurrentBid, setLocalCurrentBid] = useState<number>(Number(auction.currentBid || auction.startingBid));
  const [localLeader, setLocalLeader] = useState(auction.creator.walletAddress || "");
  
  // Get real-time auction data via WebSocket
  const { subscribe } = useWebSocket();
  
  // Timer system - always show 1 minute for demo purposes
  const [localEndTime, setLocalEndTime] = useState<Date>(
    new Date(Date.now() + 60 * 1000)
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
        setLocalCurrentBid(Number(data.currentBid));
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
  
  // Format auction name and ID based on screenshot
  const tokenDisplay = auction.nft.tokenId ? `#${auction.nft.tokenId}` : `#${Math.floor(Math.random() * 100000)}`;
  
  // Format bid value display
  const bidValueDisplay = "+$0.03 per bid";
  
  // Format time left for timestamp display (always show as 01:00 for demo)
  const formatTimeLeft = () => {
    return "01:00";
  };
  
  const startingPrice = auction.startingBid || 0;
  const currency = auction.currency || 'ETH';
  
  return (
    <div className="bg-[#0a0e17] rounded-lg overflow-hidden transition-all">
      <div className="relative">
        {/* Bid count badge at top-right of image */}
        <Badge 
          className="absolute top-2 right-2 bg-indigo-600 text-white z-10 rounded-md px-2 py-1 text-xs"
        >
          {localBidCount || 3} bids
        </Badge>
        
        <img 
          src={auction.nft.imageUrl || `https://via.placeholder.com/400x240/171717/FFFFFF?text=${encodeURIComponent(auction.nft.name)}`}
          alt={auction.nft.name}
          className="w-full h-44 object-cover cursor-pointer"
          onClick={() => window.location.href = `/auctions/${auction.id}`}
        />
      </div>
      
      {/* Item name and ID */}
      <div className="p-3 pb-0">
        <h3 className="text-white font-medium text-base cursor-pointer" onClick={() => window.location.href = `/auctions/${auction.id}`}>
          {auction.nft.name}
        </h3>
        <p className="text-gray-400 text-sm">{tokenDisplay}</p>
      </div>
      
      {/* Leader, Price, Time left, Bid Value sections */}
      <div className="p-3 pt-2 pb-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <div className="text-xs text-gray-400">Leader</div>
            <div className="text-xs text-gray-200 truncate font-mono">
              {leaderDisplay}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-400">Price</div>
            <div className="text-sm text-white font-medium">
              {formatPriceUSD(localCurrentBid || 0)}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-400">Time Left</div>
            <div className="text-xs text-white flex items-center">
              <Clock className="h-3 w-3 mr-1 text-gray-400" />
              {formatTimeLeft()}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-400">Bid Value</div>
            <div className="text-xs text-green-500">
              {bidValueDisplay}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bid/Track buttons */}
      <div className="px-3 pt-0 pb-3 grid grid-cols-2 gap-2">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            !isComplete && setShowBidModal(true);
          }}
          disabled={isComplete}
        >
          Bid
        </Button>
        
        <Button 
          variant="outline"
          className={`border border-blue-600 text-blue-600 hover:bg-blue-600/10 font-medium rounded ${
            isTracked ? 'bg-blue-600/10' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsTracked(!isTracked);
          }}
        >
          {isTracked ? 'Tracked' : 'Track'}
        </Button>
      </div>
      
      {/* Starting price and increment info */}
      <div className="border-t border-gray-800 px-3 py-2 flex justify-between items-center text-xs">
        <div className="text-gray-400">
          Starting: $0.00
        </div>
        <div className="text-gray-400">
          Bid Cost: $0.25 • Each bid adds: +$0.03
        </div>
      </div>

      {showBidModal && (
        <BidModal 
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          auction={{
            ...auction,
            currentBid: localCurrentBid.toString(),
            bidCount: localBidCount
          }}
          minimumBid={localCurrentBid + 0.03}
          onPlaceBid={(amount) => {
            console.log(`Placed bid: ${amount}`);
            setShowBidModal(false);
          }}
        />
      )}
    </div>
  );
}
