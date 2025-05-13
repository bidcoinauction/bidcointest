import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { getAuction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useCountdown from "@/hooks/useCountdown";
import { formatRelativeTime } from "@/lib/utils";
import { useState } from "react";
import BidModal from "@/components/modals/BidModal";
import { Heart, Share2, ExternalLink } from "lucide-react";

export default function AuctionDetailsPage() {
  const [, params] = useRoute("/auctions/:id");
  const auctionId = params ? parseInt(params.id) : 0;
  const [showBidModal, setShowBidModal] = useState(false);
  
  const { data: auction, isLoading, error } = useQuery({
    queryKey: [`/api/auctions/${auctionId}`],
    queryFn: () => getAuction(auctionId),
  });
  
  const { formattedTime, isComplete } = useCountdown({
    endTime: auction?.endTime || new Date(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="md:flex gap-8">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="h-[500px] bg-[#374151] rounded-xl mb-4"></div>
            </div>
            <div className="md:w-1/2">
              <div className="h-10 w-3/4 bg-[#374151] rounded mb-4"></div>
              <div className="h-6 w-1/4 bg-[#374151] rounded mb-6"></div>
              <div className="h-4 w-full bg-[#374151] rounded mb-2"></div>
              <div className="h-4 w-5/6 bg-[#374151] rounded mb-8"></div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-24 bg-[#374151] rounded"></div>
                <div className="h-24 bg-[#374151] rounded"></div>
              </div>
              
              <div className="flex items-center mb-8">
                <div className="h-12 w-12 bg-[#374151] rounded-full mr-4"></div>
                <div>
                  <div className="h-4 w-24 bg-[#374151] rounded mb-2"></div>
                  <div className="h-4 w-32 bg-[#374151] rounded"></div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-12 flex-1 bg-[#374151] rounded"></div>
                <div className="h-12 w-12 bg-[#374151] rounded"></div>
                <div className="h-12 w-12 bg-[#374151] rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#1f2937] rounded-xl p-8 text-center">
          <p className="text-white text-lg mb-2">Failed to load auction details</p>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="md:flex gap-8">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="bg-[#1f2937] rounded-xl overflow-hidden mb-4">
              <img 
                src={auction.nft.imageUrl} 
                alt={auction.nft.name}
                className="w-full object-cover"
              />
            </div>
            <div className="bg-[#1f2937] p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4">NFT Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Token Standard</p>
                  <p className="text-white">{auction.nft.tokenStandard}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Blockchain</p>
                  <p className="text-white">{auction.nft.blockchain}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Token ID</p>
                  <p className="text-white">#{auction.nft.tokenId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Royalty</p>
                  <p className="text-white">{auction.nft.royalty}%</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-1">Contract Address</p>
                <div className="flex items-center">
                  <p className="text-white font-mono text-sm truncate">{auction.nft.contractAddress}</p>
                  <a href={`https://etherscan.io/address/${auction.nft.contractAddress}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:text-[#818cf8]">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="flex flex-wrap justify-between items-start mb-2">
              <h1 className="text-3xl font-display font-bold text-white mb-2">{auction.nft.name}</h1>
              <span className="bg-[#111827] px-3 py-1 rounded-lg text-xs font-mono text-primary">
                {auction.nft.blockchain}
              </span>
            </div>
            
            <p className="text-gray-300 mb-6">{auction.nft.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1f2937] p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Current Bid</p>
                <p className="font-display text-2xl font-bold text-white">
                  <span className="text-accent-light">{auction.currentBid} {auction.currency}</span>
                </p>
                <p className="text-gray-400 text-xs">{auction.bidCount} bids placed</p>
              </div>
              
              <div className="bg-[#1f2937] p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">
                  {isComplete ? "Auction Ended" : "Ending In"}
                </p>
                <p className="font-mono text-2xl font-bold text-white auction-timer">
                  {isComplete ? "Completed" : formattedTime}
                </p>
                <p className="text-gray-400 text-xs">
                  {isComplete ? "Ended" : "Ends"} {formatRelativeTime(auction.endTime)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                <img src={auction.creator.avatar || ''} alt={`${auction.creator.username} avatar`} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Created by</p>
                <p className="text-md font-medium text-white">{auction.creator.username}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mb-8">
              <Button 
                className={`bid-button flex-1 bg-primary hover:bg-[#4f46e5] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-glow ${isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isComplete && setShowBidModal(true)}
                disabled={isComplete}
              >
                {isComplete ? "Auction Ended" : "Place Bid"}
              </Button>
              <Button variant="outline" size="icon" className="bg-[#1f2937] hover:bg-[#374151] text-white border-[#374151]">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="bg-[#1f2937] hover:bg-[#374151] text-white border-[#374151]">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            
            <Tabs defaultValue="bids" className="w-full">
              <TabsList className="bg-[#1f2937] border-b border-[#374151] w-full justify-start rounded-none">
                <TabsTrigger value="bids" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Bid History</TabsTrigger>
                <TabsTrigger value="attributes" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Attributes</TabsTrigger>
                <TabsTrigger value="provenance" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Provenance</TabsTrigger>
              </TabsList>
              <TabsContent value="bids" className="pt-4">
                <div className="bg-[#1f2937] rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-[#374151]">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bidder</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#374151]">
                      {auction.bids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-[#374151]/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden mr-3">
                                <img src={bid.bidder.avatar} alt={`${bid.bidder.username} avatar`} className="h-full w-full object-cover" />
                              </div>
                              <span className="text-white">{bid.bidder.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-white">
                            {bid.amount} {auction.currency}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                            {formatRelativeTime(bid.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="attributes" className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {auction.nft.attributes.map((attr) => (
                    <div key={attr.trait_type} className="bg-[#1f2937] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">{attr.trait_type}</p>
                      <p className="text-white font-medium">{attr.value}</p>
                      <p className="text-xs text-primary">{attr.rarity}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="provenance" className="pt-4">
                <div className="bg-[#1f2937] rounded-lg p-4">
                  <div className="space-y-4">
                    {auction.history.map((event) => (
                      <div key={event.id} className="flex items-start">
                        <div className="bg-[#374151] h-8 w-8 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <i className={`fa-solid ${event.icon} text-xs text-white`}></i>
                        </div>
                        <div>
                          <p className="text-white">{event.description}</p>
                          <p className="text-gray-400 text-sm">{formatRelativeTime(event.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {auction && (
        <BidModal 
          open={showBidModal} 
          onOpenChange={setShowBidModal} 
          auction={auction}
        />
      )}
    </>
  );
}
