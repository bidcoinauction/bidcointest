import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
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
  const [localCurrentBid, setLocalCurrentBid] = useState<number>(0.04);
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
  
  // Automatic bid simulation function
  const simulateRandomBid = useCallback(() => {
    // Generate a new random bidder
    const randomBidders = [
      "0x3aF15EA8b2e986E729E9Aa383EB18bc84A989c5D8",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      "0x2B96A7178F08F11d3aBc2b95E64CF2c4c55301E8",
      "0x1A90f32fDb08E7A17D25A4D27AaAaD67D3Dc3303",
      "0x9a8E43C44e37A52e219371c45Db11a057c6c7FFe",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    ];
    const randomBidder = randomBidders[Math.floor(Math.random() * randomBidders.length)];
    
    // Increment bid count
    setLocalBidCount(prev => prev + 1);
    
    // Add $0.03 to current bid
    setLocalCurrentBid(prev => {
      const newValue = prev + 0.03;
      return Number(newValue.toFixed(2));
    });
    
    // Update leader
    setLocalLeader(randomBidder);
    
    // Reset timer (Bidcoin reset mechanism to 1 minute)
    const resetTime = new Date();
    resetTime.setSeconds(resetTime.getSeconds() + 60);
    setLocalEndTime(resetTime);
  }, []);

  // Set up automatic bid simulation
  useEffect(() => {
    // Start automatic bid simulation on a random interval
    const simulationInterval = setInterval(() => {
      if (!isComplete) {
        simulateRandomBid();
      }
    }, Math.random() * 15000 + 5000); // Random interval between 5-20 seconds
    
    return () => {
      clearInterval(simulationInterval);
    };
  }, [isComplete, simulateRandomBid]);

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
        resetTime.setSeconds(resetTime.getSeconds() + 60);
        
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
      unsubscribe();
    };
  }, [auction.id, subscribe, secondsRemaining]);
  
  // Format auction leader address
  const leaderDisplay = formatAddress(localLeader);
  
  // Format auction name and ID based on screenshot
  const tokenDisplay = auction.nft.tokenId ? `#${auction.nft.tokenId}` : `#${Math.floor(Math.random() * 100000)}`;
  
  // Format bid value display
  const bidValueDisplay = "+$0.03 per bid";
  
  // Format time left with actual countdown
  const formatTimeLeft = () => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = Math.floor(secondsRemaining % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const startingPrice = auction.startingBid || 0;
  // Always use USD for penny auctions
  const currency = 'USD';
  
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
            <div className="text-xs text-gray-400">Bids</div>
            <div className="text-xs text-white">
              {localBidCount || 3} bids
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
            if (!isComplete) {
              // Simulate a bid
              setLocalBidCount(prev => prev + 1);
              setLocalCurrentBid(prev => {
                const newValue = prev + 0.03;
                return Number(newValue.toFixed(2));
              });
              
              // Reset timer (Bidcoin reset mechanism)
              const resetTime = new Date();
              resetTime.setSeconds(resetTime.getSeconds() + 60);
              setLocalEndTime(resetTime);
              
              // Update random leader
              const randomBidders = [
                "0x3aF15EA8b2e986E729E9Aa383EB18bc84A989c5D8",
                "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
                "0x2B96A7178F08F11d3aBc2b95E64CF2c4c55301E8"
              ];
              setLocalLeader(randomBidders[Math.floor(Math.random() * randomBidders.length)]);
            }
          }}
          disabled={isComplete}
        >
          Bid Now
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
