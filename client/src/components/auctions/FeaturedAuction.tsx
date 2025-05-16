import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedAuctions, formatPriceNative } from "@/lib/api";
import useCountdown from "@/hooks/useCountdown";
import BidModal from "@/components/modals/BidModal";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPriceUSD, formatCurrency, formatAddress, sanitizeNFTImageUrl, getOptimalNFTImageSource } from "@/lib/utils";
import { useCurrencyPreference } from "@/contexts/CurrencyContext";

export default function FeaturedAuction() {
  const [showBidModal, setShowBidModal] = useState(false);
  const [localBidCount, setLocalBidCount] = useState<number>(3);
  // Calculate price based on bid count (always $0.03 per bid)
  const initialPrice = parseFloat((3 * 0.03).toFixed(2)); // 3 bids = $0.09
  const [localPrice, setLocalPrice] = useState<number>(initialPrice);
  const [localEndTime, setLocalEndTime] = useState<Date>(new Date(Date.now() + 60 * 1000));
  const [localLeader, setLocalLeader] = useState<string>("");

  // Get currency display preference from global context
  const { currencyDisplay } = useCurrencyPreference();

  const { data: featuredAuctions, isLoading, error } = useQuery({
    queryKey: ["/api/auctions/featured"],
    queryFn: getFeaturedAuctions,
  });

  const featuredAuction = featuredAuctions?.[0];

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

    // Calculate price based on bid count (always $0.03 per bid)
    setLocalPrice(prev => {
      const newBidCount = localBidCount + 1;
      return parseFloat((newBidCount * 0.03).toFixed(2));
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
    if (!featuredAuction) return;

    // Initialize leader
    setLocalLeader(featuredAuction.bids?.[0]?.bidder?.walletAddress || featuredAuction.creator.walletAddress || "");

    // Start automatic bid simulation on a random interval
    const simulationInterval = setInterval(() => {
      simulateRandomBid();
    }, Math.random() * 20000 + 10000); // Random interval between 10-30 seconds

    return () => {
      clearInterval(simulationInterval);
    };
  }, [featuredAuction, simulateRandomBid]);

  // Get current auction leader/bidder (either from local state or from the fetched data)
  const currentLeader = localLeader || 
                        featuredAuction?.bids?.[0]?.bidder?.walletAddress || 
                        featuredAuction?.creator?.walletAddress || "";

  // Use local end time for countdown
  const { formattedTime } = useCountdown({
    endTime: localEndTime,
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
              src={getOptimalNFTImageSource(featuredAuction.nft)}
              alt={featuredAuction.nft.name} 
              className="w-full h-64 md:h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Try collection-specific fallback
                const collectionImages: Record<string, string> = {
                  'DEGEN TOONZ': '/attached_assets/Screenshot 2025-05-15 at 17.04.25.png',
                  'MAD LADS': '/attached_assets/8993.avif',
                  'MILADY': '/attached_assets/7218.avif'
                };

                const collectionName = featuredAuction.nft.collectionName || '';
                if (collectionImages[collectionName]) {
                  target.src = collectionImages[collectionName];
                  return;
                }

                // Final fallback
                target.src = '/placeholder-nft.png';
              }}
            />
            <div className="absolute top-4 left-4 bg-accent/80 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              Featured Auction
            </div>
          </div>
          <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">CRYPTOPUNKS #7804</h2>
                <span className="bg-[#111827] px-3 py-1 rounded-lg text-xs font-mono text-primary">
                  ETH
                </span>
              </div>
              <p className="text-gray-300 mb-4">DEGEN TOONZ Collection is the debut PFP collection from Degen Toonz, featuring a wide set of rare traits that make each NFT unique.</p>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-background/50 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Current Bid</p>
                  <p className="font-display text-xl font-bold text-white">
                    <span className="text-accent-light">{formatPriceUSD(localPrice)}</span>
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
                  <p className="text-gray-400 text-xs mb-1">Bids</p>
                  <p className="text-xs text-white">
                    {localBidCount} bids
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button 
                className="bid-button flex-1 bg-primary hover:bg-[#4f46e5] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-glow"
                onClick={() => {
                  // Simulate a bid
                  setLocalBidCount(prev => prev + 1);

                  // Calculate price based on bid count (always $0.03 per bid)
                  const newBidCount = localBidCount + 1;
                  setLocalPrice(parseFloat((newBidCount * 0.03).toFixed(2)));

                  // Update random leader
                  const randomBidders = [
                    "0x3aF15EA8b2e986E729E9Aa383EB18bc84A989c5D8",
                    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
                    "0x2B96A7178F08F11d3aBc2b95E64CF2c4c55301E8"
                  ];
                  setLocalLeader(randomBidders[Math.floor(Math.random() * randomBidders.length)]);

                  // Extend the auction time
                  setLocalEndTime(new Date(Date.now() + 60 * 1000));
                }}
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
          onPlaceBid={(amount: string) => {
            setShowBidModal(false);
          }}
        />
      )}
    </section>
  );
}