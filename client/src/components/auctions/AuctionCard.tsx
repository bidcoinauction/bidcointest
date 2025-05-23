import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import BidModal from "@/components/modals/BidModal";
import { useCountdown } from "@/hooks/useCountdown";
import { Auction } from "@shared/schema";
import { formatCurrency, formatAddress, formatPriceUSD, sanitizeNFTImageUrl, getOptimalNFTImageSource, formatPriceNative } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import useTokenURI from "@/hooks/useTokenURI";
import { nftApi } from "@/lib/apiService";
import { useCurrencyPreference } from "@/contexts/CurrencyContext";

interface AuctionCardProps {
  auction: Auction;
}

// Define interface for NFT metadata (TypeScript safety)
interface NFTDetailedMetadata {
  collection_name?: string;
  contract_address?: string;
  token_id?: string;
  name?: string;
  description?: string;
  image_url?: string;
  traits?: {
    trait_type: string;
    value: string;
    rarity?: string;
  }[];
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [localBidCount, setLocalBidCount] = useState(auction.bidCount || 0);
  const [detailedMetadata, setDetailedMetadata] = useState<NFTDetailedMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Get currency display preference from global context
  const { currencyDisplay } = useCurrencyPreference();

  // Calculate proper current bid based on bid count (each bid = $0.03)
  const initialBid = parseFloat(((auction.bidCount || 0) * 0.03).toFixed(2));
  const [localCurrentBid, setLocalCurrentBid] = useState<number>(initialBid);

  const [localLeader, setLocalLeader] = useState(auction.creator.walletAddress || "");

  // Get tokenURI data - only if we have contract address and token ID
  const { 
    imageUrl: tokenImageUrl, 
    isLoading: tokenURILoading,
    useFallback: tokenURIUnavailable 
  } = useTokenURI(
    auction.nft.contractAddress,
    auction.nft.tokenId
  );

  // Fetch detailed metadata from API
  useEffect(() => {
    const fetchDetailedMetadata = async () => {
      try {
        setLoading(true);

        // Get the contract address and token ID from the NFT
        const { contractAddress, tokenId, blockchain } = auction.nft;

        if (!contractAddress || !tokenId) {
          console.log('Missing contract address or token ID for detailed metadata');
          setLoading(false);
          return;
        }

        // Log details for debugging
        console.log('Attempting to fetch NFT metadata for:', {
          contractAddress,
          tokenId,
          blockchain: blockchain || 'ethereum'
        });

        // Try to get metadata from API
        try {
          const metadata = await nftApi.getNFTMetadata(contractAddress, tokenId);
          
          if (metadata) {
            setDetailedMetadata({
              collection_name: metadata.collection?.name || auction.nft.collection || '',
              contract_address: contractAddress,
              token_id: tokenId,
              name: metadata.title || auction.nft.name || `NFT #${tokenId}`,
              description: metadata.description || auction.nft.description || '',
              image_url: metadata.image?.url || auction.nft.imageUrl || '',
              traits: (metadata.attributes || []).map((attr: any) => ({
                trait_type: attr.trait_type,
                value: attr.value,
                rarity: attr.rarity
              }))
            });
          }
        } catch (error) {
          console.error('Error fetching metadata:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedMetadata();
  }, [auction.nft]);

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
    // Calculate based on bid count (always $0.03 per bid)
    const newBidCount = localBidCount + 1;
    setLocalCurrentBid(parseFloat((newBidCount * 0.03).toFixed(2)));

    // Update leader
    setLocalLeader(randomBidder);

    // Reset timer (Bidcoin reset mechanism to 1 minute)
    const resetTime = new Date();
    resetTime.setSeconds(resetTime.getSeconds() + 60);
    setLocalEndTime(resetTime);
  }, [localBidCount]);

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
      // Check if this update is for our auction
      if (data.auction && data.auction.id === auction.id) {
        // Update local state with new bid information
        const bidCount = data.auction.bidCount || 0;
        setLocalBidCount(bidCount);

        // Calculate price based on bid count (always $0.03 per bid)
        setLocalCurrentBid(parseFloat((bidCount * 0.03).toFixed(2)));

        // Set leader to the bidder address if available
        if (data.bid && data.bid.bidderAddress) {
          setLocalLeader(data.bid.bidderAddress);
        }

        // Reset timer (AuctionBlock reset mechanism)
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
    const unsubscribe = subscribe("new-bid", handleBidUpdate);

    return () => {
      // Cleanup subscription
      unsubscribe();
    };
  }, [auction.id, subscribe, secondsRemaining]);

  // Format auction leader address
  const leaderDisplay = localLeader ? formatAddress(localLeader) : "No bids yet";

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
    <div className="bg-[#0A0B0F] rounded-lg overflow-hidden transition-all border border-[#1A1E2D]">
      <div className="relative">
        {/* Bid count badge at top-left of image */}
        <Badge 
          className="absolute top-2 left-2 bg-indigo-600 text-white z-10 rounded-full px-2 py-0.5 text-xs"
        >
          {localBidCount || 3} bids
        </Badge>

        {/* Show video for mp4 files, otherwise show image */}
        {getOptimalNFTImageSource(auction.nft).endsWith('.mp4') ? (
          <video 
            src={getOptimalNFTImageSource(auction.nft)}
            className="w-full h-44 object-cover cursor-pointer"
            autoPlay
            loop
            muted
            playsInline
            onClick={() => window.location.href = `/auctions/${auction.id}`}
          />
        ) : (
          <img 
            src={tokenURIUnavailable ? getOptimalNFTImageSource(auction.nft) : (tokenImageUrl || getOptimalNFTImageSource(auction.nft))}
            alt={auction.nft.name}
            className="w-full h-44 object-cover cursor-pointer"
            onClick={() => window.location.href = `/auctions/${auction.id}`}
            onError={(e) => {
              // Multi-stage fallback system with tokenURI prioritization
              const target = e.target as HTMLImageElement;
              const auctionId = auction.id;

              // First try collection-specific assets if we know tokenURI failed 
              // or if tokenURI image failed to load specifically
              if (tokenURIUnavailable || (tokenImageUrl && target.src === tokenImageUrl)) {
                // Only log once per auction ID to reduce console spam
                const logKey = `tokenuri_log_${auctionId}`;
                if (!sessionStorage.getItem(logKey)) {
                  console.log(`TokenURI unavailable for auction #${auctionId}, using premium sources`);
                  sessionStorage.setItem(logKey, 'true');
                }

                // Map NFT collections based on auction ID to premium sources
                const collectionMapping: Record<number, {collection: string, id: string}> = {
                  1: {collection: 'azuki', id: '9605'},
                  2: {collection: 'milady', id: '7218'},
                  3: {collection: 'lilzadventure', id: '7221'},
                  4: {collection: 'degods', id: '8748'},
                  5: {collection: 'cryptopunks', id: '7804'},
                  6: {collection: 'doodles', id: '1234'},
                  7: {collection: 'madlads', id: '8993'}
                };

                const mapping = collectionMapping[auctionId];

                // Premium sources for high-value collections
                if (mapping) {
                  // Only log once per collection to reduce console spam
                  const sourceLogKey = `premium_source_${mapping.collection}_${mapping.id}`;
                  if (!sessionStorage.getItem(sourceLogKey)) {
                    console.log(`Using premium source for ${mapping.collection} #${mapping.id}`);
                    sessionStorage.setItem(sourceLogKey, 'true');
                  }

                  if (mapping.collection === 'degentoonz') {
                    target.src = `/attached_assets/0x56b0fda9566d9e9b35e37e2a29484b8ec28bb5f7833ac2f8a48ae157bad691b5.png`;
                  } else if (mapping.collection === 'madlads') {
                    target.src = 'https://i2.seadn.io/polygon/0x8ec79a75be1bf1394e8d657ee006da730d003789/ce2989e5ced9080494cf1ffddf8ed9/dace2989e5ced9080494cf1ffddf8ed9.jpeg?w=1000';
                  } else if (mapping.collection === 'degods') {
                    target.src = `/attached_assets/8747-dead.png`;
                  } else if (mapping.collection === 'azuki') {
                    target.src = `/attached_assets/8993.avif`;
                  } else if (mapping.collection === 'milady') {
                    target.src = `https://bidcoinlanding.standard.us-east-1.oortstorages.com/milady.png`;
                  } else if (mapping.collection === 'lilzadventure') {
                    target.src = `https://bidcoinlanding.standard.us-east-1.oortstorages.com/panz.png`;
                  } else if (target.src !== `https://bidcoinlanding.standard.us-east-1.oortstorages.com/panz.png`) {
                    // For all other collections, try attached asset
                    target.src = `https://bidcoinlanding.standard.us-east-1.oortstorages.com/panz.png`;
                  }
                  return;
                }
              }

              // Final fallback: use placeholder
              if (target.src !== `/placeholder-nft.png`) {
                // Only log once per auction ID
                const placeholderLogKey = `placeholder_${auctionId}`;
                if (!sessionStorage.getItem(placeholderLogKey)) {
                  console.log(`Using placeholder for auction #${auctionId}`);
                  sessionStorage.setItem(placeholderLogKey, 'true');
                }
                target.src = `/placeholder-nft.png`;
              }
            }}
          />
        )}
      </div>

      {/* Item name and ID */}
      <div className="p-3 pb-1 border-b border-[#1A1E2D]">
        <div className="flex justify-between">
          <h3 className="text-white font-medium text-base cursor-pointer truncate" onClick={() => window.location.href = `/auctions/${auction.id}`}>
            {auction.nft.name}
          </h3>
        </div>
        <div className="flex justify-between items-start text-xs">
          <p className="text-gray-400">{tokenDisplay}</p>
          <p className="text-gray-400 font-medium">
            Leader<br/>
            <span className="text-primary font-bold text-xs">
              {formatAddress(localLeader)}
            </span>
          </p>
        </div>
      </div>

      {/* Timer and price */}
      <div className="p-3 flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs">Leader</p>
          <p className="text-gray-200 text-xs truncate font-mono">
            {leaderDisplay}
          </p>
          <p className="text-gray-400 text-xs mt-1">Time Left</p>
          <div className="text-xs text-white flex items-center">
            <Clock className="h-3 w-3 mr-1 text-gray-400" />
            00:{formatTimeLeft()}
          </div>
          {/* Bid cost removed as requested */}
        </div>

        <div className="text-right">
          <p className="text-gray-400 text-xs">Price</p>
          <p className="text-white font-medium">
            {formatPriceUSD(localCurrentBid || 0.09)}
          </p>
          <div className="flex justify-end space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-indigo-600 text-indigo-400 hover:bg-indigo-900/20 hover:text-indigo-300 px-3"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsTracked(!isTracked);
              }}
            >
              Track
            </Button>

            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isComplete) {
                  // Simulate a bid
                  setLocalBidCount(prev => prev + 1);
                  // Calculate based on bid count (always $0.03 per bid)
                  const newBidCount = localBidCount + 1;
                  setLocalCurrentBid(parseFloat((newBidCount * 0.03).toFixed(2)));

                  // Reset timer (AuctionBlock reset mechanism)
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
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3"
              disabled={isComplete}
            >
              Bid Now
            </Button>
          </div>
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