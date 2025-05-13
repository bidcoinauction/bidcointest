import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { getAuction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useCountdown from "@/hooks/useCountdown";
import { formatRelativeTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import BidModal from "@/components/modals/BidModal";
import PaymentMethodModal from "@/components/modals/PaymentMethodModal";
import { Heart, Share2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useWallet from "@/hooks/useWallet";

export default function AuctionDetailsPage() {
  const [, params] = useRoute("/auctions/:id");
  const auctionId = params ? parseInt(params.id) : 0;
  const [showBidModal, setShowBidModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const { address } = useWallet();
  
  const { data: auction, isLoading, error } = useQuery({
    queryKey: [`/api/auctions/${auctionId}`],
    queryFn: () => getAuction(auctionId),
  });
  
  const timeRemaining = auction?.endTime ? new Date(auction.endTime).getTime() - Date.now() : 0;
  
  // Check if the current user is the highest bidder
  const isHighestBidder = auction?.bids && auction.bids.length > 0 && 
    auction.bids[0].bidder.walletAddress === address;
    
  const handleAuctionComplete = () => {
    console.log("Auction complete!");
    
    // If user is highest bidder, show payment method selection
    if (isHighestBidder) {
      setShowPaymentModal(true);
      toast({
        title: "Congratulations! 🎉",
        description: `You've won the auction for ${auction?.nft.name}. Please select your payment method.`,
      });
    }
  };
  
  const { timeRemaining: countdownTime, isComplete } = useCountdown({ 
    endTime: auction?.endTime ? new Date(auction.endTime) : new Date(Date.now() + 3600000),
    onComplete: handleAuctionComplete
  });
  
  // Calculate time units for display
  const days = Math.floor(countdownTime / 86400);
  const hours = Math.floor((countdownTime % 86400) / 3600);
  const minutes = Math.floor((countdownTime % 3600) / 60);
  const seconds = countdownTime % 60;
  const isActive = !isComplete;
  
  const bidIncrement = 0.24; // Fixed bid increment of $0.24 (converted to crypto equivalent)
  const minimumBid = auction?.currentBid ? parseFloat(auction.currentBid) + bidIncrement : parseFloat(auction?.startingBid || "0");
  
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
    const paymentAmount = auction?.currentBid || "0";
    const nftName = auction?.nft.name || "NFT";
    
    toast({
      title: "Payment Method Selected",
      description: `You've chosen to pay with ${method}. An invoice for ${paymentAmount} ${method} will be sent to your connected wallet.`,
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
  
  const handlePlaceBid = (amount: string) => {
    console.log("Placing bid:", amount);
    // Implementation to place bid would go here
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
              src={auction.nft.imageUrl || '/placeholder-image.jpg'} 
              alt={auction.nft.name} 
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
            <div className="grid grid-cols-3 gap-3">
              {auction.nft.attributes && auction.nft.attributes.map((attr, index) => (
                <div key={index} className="bg-[#111827] rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">{attr.trait_type}</p>
                  <p className="text-white font-medium text-sm truncate">{attr.value}</p>
                  <p className="text-primary text-xs mt-1">{attr.rarity}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#1f2937] rounded-xl border border-[#374151]">
            <div className="p-5">
              <h3 className="text-lg font-display font-bold text-white mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Standard</span>
                  <span className="text-white">{auction.nft.tokenStandard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Blockchain</span>
                  <span className="text-white">{auction.nft.blockchain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token ID</span>
                  <span className="text-white">{auction.nft.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Creator Royalty</span>
                  <span className="text-white">{auction.nft.royalty}%</span>
                </div>
              </div>
            </div>
            <div className="border-t border-[#374151] p-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">View on Explorer</span>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-light">
                  <ExternalLink className="h-4 w-4 mr-1" /> Explorer
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-white mb-1">{auction.nft.name}</h1>
                <p className="text-gray-400">{auction.nft.collection}</p>
              </div>
              
              <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                {auction.nft.category}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                <img src={auction.creator.avatar || '/placeholder-avatar.jpg'} alt={`${auction.creator.username} avatar`} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Created by</p>
                <p className="text-md font-medium text-white">{auction.creator.username}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-gray-400 mb-2">Current Bid</p>
              <div className="flex items-baseline">
                <span className="text-3xl font-display font-bold text-white mr-2">{auction.currentBid || 0} {auction.currency}</span>
                <span className="text-gray-400">(~${(Number(auction.currentBid || 0) * 1800).toFixed(2)} USD)</span>
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-gray-400 mb-2">Auction Ends In</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <span className="text-2xl font-display font-bold text-white">{days}</span>
                  <p className="text-xs text-gray-400 mt-1">Days</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <span className="text-2xl font-display font-bold text-white">{hours}</span>
                  <p className="text-xs text-gray-400 mt-1">Hours</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <span className="text-2xl font-display font-bold text-white">{minutes}</span>
                  <p className="text-xs text-gray-400 mt-1">Minutes</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <span className="text-2xl font-display font-bold text-white">{seconds}</span>
                  <p className="text-xs text-gray-400 mt-1">Seconds</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Total Bids</span>
                <span className="text-white">{auction.bidCount || 0}</span>
              </div>
              <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((auction.bidCount || 0) / 100) * 100)}%` }}></div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 text-lg" 
              onClick={handleOpenBidModal}
              disabled={!isActive}
            >
              {isActive ? `Place Bid (${minimumBid} ${auction.currency})` : "Auction Ended"}
            </Button>
          </div>
          
          <div className="bg-[#1f2937] rounded-xl border border-[#374151] mb-6">
            <Tabs defaultValue="description">
              <TabsList className="bg-[#374151]/50 rounded-tl-xl rounded-tr-xl p-1">
                <TabsTrigger value="description" className="rounded-md data-[state=active]:bg-[#1f2937] data-[state=active]:text-white">
                  Description
                </TabsTrigger>
                <TabsTrigger value="bids" className="rounded-md data-[state=active]:bg-[#1f2937] data-[state=active]:text-white">
                  Bid History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="p-5">
                <p className="text-gray-300 whitespace-pre-line">{auction.nft.description}</p>
              </TabsContent>
              
              <TabsContent value="bids" className="p-5">
                {auction.bids && auction.bids.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bidder</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {auction.bids.map((bid) => (
                          <tr key={bid.id} className="hover:bg-[#374151]/50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden mr-3">
                                  <img src={bid.bidder.avatar || '/placeholder-avatar.jpg'} alt={`${bid.bidder.username} avatar`} className="h-full w-full object-cover" />
                                </div>
                                <span className="text-white">{bid.bidder.username}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-white">
                              {bid.amount} {auction.currency}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                              {bid.timestamp ? formatRelativeTime(bid.timestamp) : 'Unknown time'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400">No bids have been placed yet</p>
                    <Button className="mt-4 bg-primary hover:bg-primary-dark text-white" onClick={handleOpenBidModal}>
                      Be the first to bid
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="bg-[#1f2937] p-5 rounded-xl border border-[#374151]">
            <h3 className="text-lg font-display font-bold text-white mb-4">Auction Rules</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="bg-primary/20 rounded-full text-primary text-xs w-5 h-5 flex items-center justify-center mr-3 mt-0.5">1</span>
                <div>
                  <p className="text-white text-sm font-medium">Fixed Bid Increment</p>
                  <p className="text-gray-400 text-sm">Each bid will increase the price by exactly {bidIncrement} {auction.currency}.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-primary/20 rounded-full text-primary text-xs w-5 h-5 flex items-center justify-center mr-3 mt-0.5">2</span>
                <div>
                  <p className="text-white text-sm font-medium">Time Extension</p>
                  <p className="text-gray-400 text-sm">Each bid in the last 5 minutes adds 5 minutes to the auction time.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-primary/20 rounded-full text-primary text-xs w-5 h-5 flex items-center justify-center mr-3 mt-0.5">3</span>
                <div>
                  <p className="text-white text-sm font-medium">Bid Cost</p>
                  <p className="text-gray-400 text-sm">Each bid costs 1 bid credit from your BidPack.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6 mb-12">
        <h2 className="text-xl font-display font-bold text-white mb-6">More from this Collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#111827] rounded-xl overflow-hidden border border-[#374151] transition-transform hover:scale-105">
              <div className="relative">
                <img 
                  src={`/assets/nft_images/${i < 3 ? '300' : 'tnb'}.${i < 3 ? 'png' : 'jpg'}`} 
                  alt="Collection item" 
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                  {(1.5 - i * 0.2).toFixed(2)} ETH
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-white font-medium truncate">Cosmic Dream #{i+1}</h3>
                <p className="text-gray-400 text-xs">{auction.nft.collection}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {showBidModal && (
        <BidModal 
          auction={auction}
          minimumBid={Number(minimumBid)}
          isOpen={showBidModal}
          onClose={handleCloseBidModal}
          onPlaceBid={handlePlaceBid}
        />
      )}
      
      {showPaymentModal && auction && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          auction={auction}
          onSelectPaymentMethod={handleSelectPaymentMethod}
        />
      )}
    </div>
  );
}