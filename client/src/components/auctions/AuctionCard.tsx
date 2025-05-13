import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BidModal from "@/components/modals/BidModal";
import useCountdown from "@/hooks/useCountdown";
import { Auction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Clock, Check } from "lucide-react";

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  
  const { formattedTime, isComplete } = useCountdown({
    endTime: auction.endTime,
  });

  return (
    <div className="bg-[#111827] rounded-lg overflow-hidden transition-all">
      <div onClick={() => window.location.href = `/auctions/${auction.id}`} className="cursor-pointer">
        <div className="relative">
          <img 
            src={auction.nft.imageUrl}
            alt={auction.nft.name}
            className="w-full h-48 object-cover"
          />
        </div>
        
        <div className="p-3">
          <div className="flex justify-between mb-1">
            <div className="text-white font-medium">{auction.nft.name}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-xs text-gray-400">Leader</div>
              <div className="text-xs text-white truncate">{auction.creator.walletAddress ? auction.creator.walletAddress.substring(0, 8) + '...' : '@' + auction.creator.username}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Price</div>
              <div className="text-white text-sm font-medium flex items-center">
                {formatCurrency(auction.currentBid || 0, auction.currency || 'ETH')}
                <span className="text-xs ml-1 opacity-70">≈</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-xs text-gray-400">Time Left</div>
              <div className="text-white text-sm font-mono flex items-center">
                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                {formattedTime}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-2 rounded-md transition-all text-sm"
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
              className="border border-blue-600 text-blue-600 hover:bg-blue-600/10 font-medium py-1 px-2 rounded-md transition-all text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {isComplete ? "Ended" : "Track"}
            </Button>
          </div>
        </div>
      </div>

      <BidModal 
        open={showBidModal} 
        onOpenChange={setShowBidModal} 
        auction={auction}
      />
    </div>
  );
}
