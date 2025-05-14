import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedAuctions } from "@/lib/api";
import useCountdown from "@/hooks/useCountdown";
import BidModal from "@/components/modals/BidModal";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPriceUSD, formatCurrency, formatAddress } from "@/lib/utils";

export default function FeaturedAuction() {
  const [showBidModal, setShowBidModal] = useState(false);
  
  const { data: featuredAuctions, isLoading, error } = useQuery({
    queryKey: ["/api/auctions/featured"],
    queryFn: getFeaturedAuctions,
  });

  const featuredAuction = featuredAuctions?.[0];
  
  // Get current auction leader/bidder
  const currentLeader = featuredAuction?.bids?.[0]?.bidder?.walletAddress || 
                        featuredAuction?.creator?.walletAddress || "";
  
  const { formattedTime } = useCountdown({
    endTime: featuredAuction?.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="bg-gradient-to-r from-[#1f2937] to-[#374151] rounded-2xl overflow-hidden shadow-lg border border-[#374151]">
          <div className="md:flex">
            <Skeleton className="md:w-1/2 h-64 md:h-[400px]" />
            <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6 mb-1" />
                <Skeleton className="h-4 w-4/6 mb-4" />
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                
                <div className="flex items-center space-x-3 mb-6">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-2">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !featuredAuction) {
    return (
      <section className="mb-12">
        <div className="bg-gradient-to-r from-[#1f2937] to-[#374151] rounded-2xl overflow-hidden shadow-lg border border-[#374151] p-8 text-center">
          <p className="text-white text-lg mb-2">Failed to load featured auction</p>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="bg-gradient-to-r from-[#1f2937] to-[#374151] rounded-2xl overflow-hidden shadow-lg border border-[#374151]">
        <div className="md:flex">
          <div className="md:w-1/2 relative overflow-hidden">
            <img 
              src={featuredAuction.nft.imageUrl}
              alt={featuredAuction.nft.name} 
              className="w-full h-64 md:h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-accent/80 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              Featured Auction
            </div>
          </div>
          <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">{featuredAuction.nft.name}</h2>
                <span className="bg-[#111827] px-3 py-1 rounded-lg text-xs font-mono text-primary">
                  {featuredAuction.nft.blockchain}
                </span>
              </div>
              <p className="text-gray-300 mb-4">{featuredAuction.nft.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-background/50 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Current Bid</p>
                  <p className="font-display text-xl font-bold text-white">
                    <span className="text-accent-light">{formatPriceUSD(featuredAuction.currentBid?.toString() || "0")}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(featuredAuction.currentBid?.toString() || "0", featuredAuction.currency)}
                  </p>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Ending In</p>
                  <p className="font-mono text-xl font-bold text-white auction-timer">
                    {formattedTime}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background/50 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Leader</p>
                  <p className="text-xs text-white font-mono">
                    {formatAddress(currentLeader)}
                  </p>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Bid Value</p>
                  <p className="text-xs text-green-500">
                    +$0.03 per bid
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary">
                  <img src={featuredAuction.creator.avatar || '/placeholder-avatar.jpg'} alt={`${featuredAuction.creator.username} avatar`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created by</p>
                  <p className="text-sm font-medium text-white">{featuredAuction.creator.username}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-2">
              <Button 
                className="bid-button flex-1 bg-primary hover:bg-[#4f46e5] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-glow"
                onClick={() => setShowBidModal(true)}
              >
                Place Bid
              </Button>
              <Button variant="outline" size="icon" className="bg-[#1f2937] hover:bg-[#374151] text-white border-[#374151]">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="bg-[#1f2937] hover:bg-[#374151] text-white border-[#374151]">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {featuredAuction && showBidModal && (
        <BidModal 
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          auction={featuredAuction}
          minimumBid={Number(featuredAuction.currentBid || 0) + 0.01}
          onPlaceBid={(amount) => {
            console.log(`Placed bid: ${amount}`);
            setShowBidModal(false);
          }}
        />
      )}
    </section>
  );
}
