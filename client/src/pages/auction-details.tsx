import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { getAuction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useCountdown from "@/hooks/useCountdown";
import { 
  formatRelativeTime, 
  formatAddress, 
  formatPriceUSD, 
  getRarityColor, 
  getRarityLabel, 
  formatRarity,
  getBlockchainExplorerUrl
} from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import BidModal from "@/components/modals/BidModal";
import PaymentMethodModal from "@/components/modals/PaymentMethodModal";
import BidActivity from "@/components/auctions/BidActivity";
import { Heart, Share2, ExternalLink, Trophy, TrendingUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useWallet from "@/hooks/useWallet";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getNFTDetailedMetadata } from "@/lib/unleashApi";

export default function AuctionDetailsPage() {
  const [, params] = useRoute("/auctions/:id");
  const auctionId = params ? parseInt(params.id) : 0;
  const [showBidModal, setShowBidModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localCurrentBid, setLocalCurrentBid] = useState<number>(0.04);
  const [localBidCount, setLocalBidCount] = useState<number>(3);
  const [localEndTime, setLocalEndTime] = useState<Date>(new Date(Date.now() + 60 * 1000));
  const [localLeader, setLocalLeader] = useState<string>("");
  const [detailedMetadata, setDetailedMetadata] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { address } = useWallet();
  const { subscribe } = useWebSocket();
  
  const { data: auction, isLoading, error } = useQuery({
    queryKey: [`/api/auctions/${auctionId}`],
    queryFn: () => getAuction(auctionId),
  });
  
  // Initialize local state from auction data when it loads
  useEffect(() => {
    if (auction) {
      // Calculate proper current bid based on bid count (each bid = $0.03)
      const bidCount = auction.bidCount || 0;
      const calculatedBid = parseFloat((bidCount * 0.03).toFixed(2));
      
      setLocalCurrentBid(calculatedBid);
      setLocalBidCount(bidCount);
      setLocalLeader(auction.bids?.[0]?.bidder?.walletAddress || auction.creator.walletAddress || "");
    }
  }, [auction]);
  
  // Function to navigate to NFT Collections page for API key management
  const navigateToApiSettings = () => {
    window.location.href = '/nft-collections';
  };

  // Fetch detailed metadata from UnleashNFTs API
  useEffect(() => {
    if (!auction || !auction.nft) return;
    
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
        
        // Call the UnleashNFTs API to get the detailed metadata
        console.log('Attempting to fetch NFT metadata for:', {
          contractAddress,
          tokenId,
          blockchain: blockchain || 'ethereum'
        });
        
        const metadata = await getNFTDetailedMetadata(
          contractAddress, 
          tokenId, 
          blockchain || 'ethereum'
        );
        
        if (metadata) {
          console.log('✅ Detailed metadata loaded:', metadata);
          console.log('Properties:', metadata.traits);
          setDetailedMetadata(metadata);
        } else {
          console.log('❌ No detailed metadata available from UnleashNFTs API');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error fetching detailed metadata:', error);
        
        // Handle specific API errors
        if (errorMessage.includes('401') || errorMessage.includes('Invalid API key')) {
          toast({
            title: "API Authentication Error",
            description: "Invalid API key for UnleashNFTs. Please update your API key in NFT Collections page settings.",
            variant: "destructive",
            action: (
              <Button variant="outline" onClick={navigateToApiSettings}>
                Update API Key
              </Button>
            )
          });
        } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          toast({
            title: "API Rate Limit Exceeded",
            description: "Too many requests to UnleashNFTs API. Please try again later or upgrade your API plan.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetailedMetadata();
  }, [auction, toast]);
  
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
    if (!auction) return;
    
    // Start automatic bid simulation on a random interval
    const simulationInterval = setInterval(() => {
      simulateRandomBid();
    }, Math.random() * 15000 + 10000); // Random interval between 10-25 seconds
    
    return () => {
      clearInterval(simulationInterval);
    };
  }, [auction, simulateRandomBid]);
  
  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    // Subscribe to bid updates
    const unsubscribeBids = subscribe("new-bid", (data) => {
      if (data.auctionId === auctionId) {
        console.log("Real-time bid update received for this auction:", data);
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
        
        // Update local state with new bid information
        setLocalBidCount(data.bidCount);
        setLocalCurrentBid(Number(data.currentBid));
        setLocalLeader(data.bidderAddress);
        
        // Reset timer (Bidcoin reset mechanism)
        const resetTime = new Date();
        resetTime.setSeconds(resetTime.getSeconds() + 60);
        setLocalEndTime(resetTime);
      }
    });
    
    return () => {
      unsubscribeBids();
    };
  }, [auctionId, queryClient, subscribe]);
  
  // Use local countdown instead of server time
  const { formattedTime, isComplete } = useCountdown({
    // Ensure we always pass a valid Date object to useCountdown
    endTime: localEndTime || new Date(Date.now() + 60 * 1000),
    onComplete: () => {
      console.log("Auction complete!");
      
      // If user is highest bidder, show payment method selection
      if (isHighestBidder) {
        setShowPaymentModal(true);
        toast({
          title: "Congratulations! 🎉",
          description: `You've won the auction for ${auction?.nft.name}. Please select your payment method.`,
        });
      }
    }
  });
  
  // Check if the current user is the highest bidder
  const isHighestBidder = address && localLeader === address;
  const isActive = !isComplete;
  
  // Parse the formatted time string into components
  const timeComponents = formattedTime ? formattedTime.split(':') : ['00', '00', '00'];
  const hours = parseInt(timeComponents[0]);
  const minutes = parseInt(timeComponents[1]);
  const seconds = parseInt(timeComponents[2]);
  const days = Math.floor(hours / 24);
  const hoursLeft = hours % 24;
  
  const bidIncrement = 0.03; // Fixed bid increment of $0.03 (3 pennies, converted to crypto equivalent)
  const minimumBid = localCurrentBid + bidIncrement;
  
  const handleOpenBidModal = () => {
    setShowBidModal(true);
  };
  
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };
  
  const handleSelectPaymentMethod = (method: string) => {
    console.log(`Selected payment method: ${method} for auction ${auction?.id}`);
    setShowPaymentModal(false);
    
    // Get the total amount to pay based on current bid
    // Make sure localCurrentBid is a valid number before calling toFixed
    const paymentAmount = typeof localCurrentBid === 'number' ? localCurrentBid.toFixed(2) : '0.00';
    const nftName = auction?.nft.name || "NFT";
    
    toast({
      title: "Payment Method Selected",
      description: `You've chosen to pay with ${method}. An invoice for $${paymentAmount} in ${method} will be sent to your connected wallet.`,
    });
    
    // In a real implementation, this would initiate a crypto payment transaction
    setTimeout(() => {
      toast({
        title: "Payment Instructions Sent",
        description: `Check your email for instructions on how to complete your payment for ${nftName}.`,
        variant: "default",
      });
    }, 2000);
  };
  
  const handleCloseBidModal = () => {
    setShowBidModal(false);
  };
  
  const handlePlaceBid = async (amount: string) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet before placing a bid.",
        variant: "destructive"
      });
      setShowBidModal(false);
      return;
    }
    
    try {
      console.log("Placing bid:", amount, "on auction:", auctionId, "with address:", address);
      
      // Increment bid count
      const newBidCount = localBidCount + 1;
      setLocalBidCount(newBidCount);
      
      // Calculate price based on bid count (always $0.03 per bid)
      const newPrice = parseFloat((newBidCount * 0.03).toFixed(2));
      setLocalCurrentBid(newPrice);
      
      // Set current user as leader
      setLocalLeader(address);
      
      // Reset timer (Bidcoin reset mechanism to 1 minute)
      const resetTime = new Date();
      resetTime.setSeconds(resetTime.getSeconds() + 60);
      setLocalEndTime(resetTime);
      
      toast({
        title: "Bid Placed Successfully!",
        description: `Your bid of $0.24 has been placed. New auction price: $${newPrice.toFixed(2)}`,
        variant: "default",
      });
      
      // Refresh the auction data using React Query
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
    } catch (error) {
      console.error("Error placing bid:", error);
      toast({
        title: "Bid Failed",
        description: error instanceof Error ? error.message : "Failed to place bid. Please try again.",
        variant: "destructive",
      });
    }
    
    setShowBidModal(false);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="h-[400px] bg-[#1f2937] rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-10 bg-[#1f2937] rounded w-3/4"></div>
            <div className="h-6 bg-[#1f2937] rounded w-1/2"></div>
            <div className="h-20 bg-[#1f2937] rounded"></div>
            <div className="h-12 bg-[#1f2937] rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#1f2937] rounded-xl p-8 text-center">
          <h2 className="text-xl font-medium text-white mb-2">Failed to load auction</h2>
          <p className="text-gray-400 mb-6">Please try again later or check if the auction exists</p>
          <Button className="bg-primary hover:bg-primary-dark text-white" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="mb-6 relative">
            <img 
              src={detailedMetadata?.image_url || auction.nft.imageUrl || '/placeholder-image.jpg'} 
              alt={detailedMetadata?.name || auction.nft.name} 
              className="w-full h-auto rounded-xl object-cover aspect-square" 
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button variant="outline" size="sm" className="bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-full w-9 h-9 p-0">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" className="bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-full w-9 h-9 p-0">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="bg-[#1f2937] p-5 rounded-xl border border-[#374151] mb-6">
            <h3 className="text-lg font-display font-bold text-white mb-4">NFT Properties</h3>
            {loading && (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-[#111827] rounded-lg p-3 text-center animate-pulse">
                    <div className="h-4 bg-[#1f2937] rounded mb-2"></div>
                    <div className="h-5 bg-[#1f2937] rounded mb-2"></div>
                    <div className="h-4 bg-[#1f2937] rounded w-1/2 mx-auto"></div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show enhanced metadata from UnleashNFTs when available */}
            {!loading && detailedMetadata && detailedMetadata.traits && detailedMetadata.traits.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {detailedMetadata.traits.map((attr: any, index: number) => (
                  <div key={index} className="bg-[#111827] rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">{attr.trait_type}</p>
                    <p className="text-white font-medium text-sm truncate">{attr.value}</p>
                    {attr.rarity !== undefined && (
                      <div className="mt-1 flex items-center justify-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getRarityColor(attr.rarity)}`}>
                          {/* Force "Rare" label for specific traits as requested */}
                          {attr.trait_type === "Background" && attr.value === "Orange" ? 
                            "Rare" : 
                            attr.trait_type === "Clothes" && attr.value === "Orange Hoodie" ? 
                            "Rare" : 
                            attr.trait_type === "Eyes" && attr.value === "Laser" ? 
                            "Rare" : 
                            getRarityLabel(attr.rarity)
                          } ({formatRarity(attr.rarity)})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : 
            /* Fallback to original attributes if detailed metadata is not available */
            !loading && auction.nft.attributes && auction.nft.attributes.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {auction.nft.attributes.map((attr, index) => (
                  <div key={index} className="bg-[#111827] rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">{attr.trait_type}</p>
                    <p className="text-white font-medium text-sm truncate">{attr.value}</p>
                    {attr.rarity !== undefined && (
                      <div className="mt-1 flex items-center justify-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getRarityColor(typeof attr.rarity === 'string' ? parseFloat(attr.rarity) : attr.rarity)}`}>
                          {getRarityLabel(typeof attr.rarity === 'string' ? parseFloat(attr.rarity) : attr.rarity)} ({formatRarity(typeof attr.rarity === 'string' ? parseFloat(attr.rarity) : attr.rarity)})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="bg-[#111827] rounded-lg p-4 text-center">
                  <p className="text-gray-400">No properties found for this NFT</p>
                </div>
              )
            )}
          </div>
          
          <div className="bg-[#1f2937] rounded-xl border border-[#374151]">
            <div className="p-5">
              <h3 className="text-lg font-display font-bold text-white mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Standard</span>
                  <span className="text-white">{auction.nft.tokenStandard || "ERC-721"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Blockchain</span>
                  <span className="text-white">{auction.nft.blockchain || "Ethereum"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token ID</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-white truncate max-w-[150px]">{auction.nft.tokenId || "Unknown"}</span>
                    {auction.nft.tokenId && auction.nft.contractAddress && (
                      <a 
                        href={getBlockchainExplorerUrl(auction.nft.contractAddress, auction.nft.tokenId, auction.nft.blockchain || "ethereum")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contract</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-white truncate max-w-[150px]">
                      {auction.nft.contractAddress ? 
                        formatAddress(auction.nft.contractAddress) : 
                        "Unknown"
                      }
                    </span>
                    {auction.nft.contractAddress && (
                      <a 
                        href={`https://etherscan.io/address/${auction.nft.contractAddress}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Creator Royalty</span>
                  <span className="text-white">{auction.nft.royalty || "2.5%"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-[#1f2937] rounded-xl border border-[#374151] mb-6">
            <div className="p-5 border-b border-[#374151]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h1 className="text-2xl font-display font-bold text-white mb-2 md:mb-0">
                  {detailedMetadata?.name || auction.nft.name}
                </h1>
                
                <div className="flex space-x-2 items-center">
                  <span className="text-sm px-2 py-1 bg-[#111827] rounded-full text-gray-300">
                    {formatRelativeTime(auction.createdAt)}
                  </span>
                  
                  <span className="text-sm px-2 py-1 bg-[#111827] rounded-full text-gray-300">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    {isActive ? "Live" : "Ended"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 text-gray-400 text-sm mb-4">
                <span>Created by</span>
                <a href={`/profile/${auction.creator.id}`} className="text-primary hover:text-primary-dark font-medium">
                  {auction.creator.username || formatAddress(auction.creator.walletAddress)}
                </a>
                <span>•</span>
                <span>Collection: {detailedMetadata?.collection_name || auction.nft.collectionName || "Unknown"}</span>
              </div>
              
              <p className="text-gray-300 text-sm mb-6">
                {detailedMetadata?.description || auction.nft.description || "No description available for this NFT."}
              </p>
              
              <div className="bg-[#111827] rounded-xl p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 className="text-white text-lg font-display font-bold">Current Bid</h2>
                    <p className="text-3xl font-bold text-white mt-1">
                      ${typeof localCurrentBid === 'number' ? localCurrentBid.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">Time Remaining</p>
                      <div className="bg-[#1f2937] rounded-lg p-2 inline-block min-w-36">
                        {isActive ? (
                          <div className="flex items-center justify-center space-x-1">
                            {days > 0 && (
                              <div className="text-center">
                                <span className="text-2xl font-bold text-white">{days}</span>
                                <span className="text-gray-400 text-xs block">days</span>
                              </div>
                            )}
                            <div className="text-center px-1">
                              <span className="text-2xl font-bold text-white">{hoursLeft.toString().padStart(2, '0')}</span>
                              <span className="text-gray-400 text-xs block">hours</span>
                            </div>
                            <span className="text-white font-bold mt-1">:</span>
                            <div className="text-center px-1">
                              <span className="text-2xl font-bold text-white">{minutes.toString().padStart(2, '0')}</span>
                              <span className="text-gray-400 text-xs block">mins</span>
                            </div>
                            <span className="text-white font-bold mt-1">:</span>
                            <div className="text-center px-1">
                              <span className="text-2xl font-bold text-white">{seconds.toString().padStart(2, '0')}</span>
                              <span className="text-gray-400 text-xs block">secs</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white text-lg font-medium">Auction Ended</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center text-gray-400 mb-4 md:mb-0">
                    <div className="flex items-center space-x-1 mr-4">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>{localBidCount} {localBidCount === 1 ? 'bid' : 'bids'}</span>
                    </div>
                    {localLeader && (
                      <div className="flex items-center space-x-1">
                        <span>Highest bidder:</span>
                        <span className="text-primary">{formatAddress(localLeader)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    {isHighestBidder && (
                      <div className="bg-green-950 text-green-400 px-3 py-1 rounded-md text-sm flex items-center">
                        <Trophy className="h-4 w-4 mr-1 text-green-400" />
                        Current Leader
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all shadow-glow"
                    onClick={handleOpenBidModal}
                    disabled={!isActive}
                  >
                    {isActive ? "Place Bid" : "Auction Ended"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-transparent border border-[#374151] text-white hover:bg-[#374151]/50 py-3 px-4 rounded-lg transition-colors"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex space-x-4 mb-4">
                  <div className="bg-[#111827] rounded-lg p-3 text-center flex-1">
                    <p className="text-gray-400 text-xs mb-1">Retail Price</p>
                    <p className="text-white font-medium">
                      {auction.nft.retailPrice 
                        ? `$${formatPriceUSD(auction.nft.retailPrice)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-[#111827] rounded-lg p-3 text-center flex-1">
                    <p className="text-gray-400 text-xs mb-1">Floor Price</p>
                    <p className="text-white font-medium">
                      {detailedMetadata?.floor_price 
                        ? (
                          <span className="flex flex-col items-center">
                            <span className="font-bold text-primary">
                              {detailedMetadata.floor_price} ETH
                            </span>
                            <span className="text-gray-400 text-xs">
                              (${detailedMetadata.floor_price_usd ? formatPriceUSD(detailedMetadata.floor_price_usd) : '0.00'})
                            </span>
                          </span>
                        )
                        : auction.nft.floorPrice 
                        ? `$${formatPriceUSD(auction.nft.floorPrice)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-[#111827] rounded-lg p-3 text-center flex-1">
                    <p className="text-gray-400 text-xs mb-1">Volume (24h)</p>
                    <p className="text-white font-medium">
                      {auction.nft.volume24h 
                        ? `$${formatPriceUSD(auction.nft.volume24h)}` 
                        : "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#111827] rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 text-sm">Bid fee:</span>
                    <span className="text-white text-sm">$0.24</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 text-sm">Bid increment:</span>
                    <span className="text-white text-sm">$0.03</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Timer reset:</span>
                    <span className="text-white text-sm">60 seconds</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-display font-bold text-white">Auction Stats</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#111827] rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">Discount</p>
                    <p className="text-green-400 font-medium">
                      {auction.nft.retailPrice && localCurrentBid
                        ? `${Math.max(0, Math.round((1 - localCurrentBid / (typeof auction.nft.retailPrice === 'string' 
                            ? parseFloat(auction.nft.retailPrice) 
                            : Number(auction.nft.retailPrice))) * 100))}% off`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-[#111827] rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">You Save</p>
                    <p className="text-green-400 font-medium">
                      {auction.nft.retailPrice && localCurrentBid
                        ? `$${(
                            (typeof auction.nft.retailPrice === 'string' 
                              ? parseFloat(auction.nft.retailPrice) 
                              : Number(auction.nft.retailPrice)) - localCurrentBid
                          ).toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-[#111827] rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">Total Bids</p>
                    <p className="text-white font-medium">{localBidCount}</p>
                  </div>
                  <div className="bg-[#111827] rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">Bid Value</p>
                    <p className="text-white font-medium">${(localBidCount * 0.24).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#111827]/50">
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="history">Auction History</TabsTrigger>
                </TabsList>
                <TabsContent value="activity" className="mt-4">
                  <BidActivity auctionId={auction.id} />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <div className="text-center py-8 text-gray-400">
                    <p>Auction history will be available after the auction ends</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]">
        <div className="flex items-center mb-6">
          <Award className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-xl font-display font-bold text-white">Related NFTs</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111827] rounded-xl overflow-hidden border border-[#374151] hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={`/placeholder-nft-${(i % 4) + 1}.jpg`} 
                  alt="Related NFT" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium mb-1 truncate">Collection #{1000 + i}</h3>
                <p className="text-gray-400 text-sm mb-2">Floor: $0.32</p>
                <Button 
                  variant="outline" 
                  className="w-full text-primary border-primary hover:bg-primary/10"
                >
                  View Auctions
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bid Modal */}
      {showBidModal && (
        <BidModal
          isOpen={true}
          onClose={handleCloseBidModal}
          auction={auction}
          minimumBid={minimumBid}
        />
      )}
      
      {/* Payment Method Selection Modal */}
      {showPaymentModal && (
        <PaymentMethodModal
          isOpen={true}
          onClose={handleClosePaymentModal}
          auction={auction}
          onSelectPaymentMethod={handleSelectPaymentMethod}
        />
      )}
    </div>
  );
}