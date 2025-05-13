import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BidModal from "@/components/modals/BidModal";
import useCountdown from "@/hooks/useCountdown";
import { Auction } from "@shared/schema";

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  
  const { formattedTime, isComplete } = useCountdown({
    endTime: auction.endTime,
  });

  return (
    <div className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151] hover:shadow-glow transition-shadow duration-300">
      <div className="relative">
        <img 
          src={auction.nft.imageUrl}
          alt={auction.nft.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between">
          <span className="bg-primary/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
            #{auction.nft.tokenId}
          </span>
          <span className="bg-black/60 text-white text-xs font-mono px-2 py-1 rounded backdrop-blur-sm">
            {auction.bidCount} bids
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-3">
          {!isComplete ? (
            <div className="bg-black/70 backdrop-blur-sm text-white text-sm rounded py-1 px-2 font-mono text-center auction-timer">
              {formattedTime}
            </div>
          ) : (
            <div className="bg-secondary/80 backdrop-blur-sm text-white text-sm rounded py-1 px-2 font-mono text-center">
              Auction Ended
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-bold text-white text-lg">{auction.nft.name}</h3>
          <span className="bg-background px-2 py-0.5 rounded text-xs font-mono text-primary">
            {auction.currency}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-primary">
              <img 
                src={auction.creator.avatar} 
                alt={`${auction.creator.username} avatar`} 
                className="w-full h-full object-cover" 
              />
            </div>
            <p className="text-sm text-gray-400">@{auction.creator.username}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Current Bid</p>
            <p className="font-bold text-white">{auction.currentBid} {auction.currency}</p>
          </div>
        </div>
        
        <Button 
          className={`bid-button w-full bg-primary hover:bg-[#4f46e5] text-white font-medium py-2 rounded-lg transition-all ${isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isComplete && setShowBidModal(true)}
          disabled={isComplete}
        >
          {isComplete ? "Auction Ended" : "Place Bid"}
        </Button>
      </div>

      <BidModal 
        open={showBidModal} 
        onOpenChange={setShowBidModal} 
        auction={auction}
      />
    </div>
  );
}
