import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBidPacks, getAuctions, getNFTs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Bell, 
  Bot, 
  Tag, 
  Clock, 
  PlusCircle,
  Coins,
  LucidePieChart,
  Trophy
} from "lucide-react";
import BidTracking from "@/components/bidding/BidTracking";
import BuyBids from "@/components/bidding/BuyBids";
import UserAchievements from "@/components/achievements/UserAchievements";
import useWallet from "@/hooks/useWallet";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { address, connect, disconnect, isConnected } = useWallet();
  const { toast } = useToast();
  
  const { data: bidPacks, isLoading: isBidPacksLoading } = useQuery({
    queryKey: ["/api/bidpacks"],
    queryFn: getBidPacks,
  });
  
  const { data: auctions, isLoading: isAuctionsLoading } = useQuery({
    queryKey: ["/api/auctions"],
    queryFn: getAuctions,
  });
  
  // Mock user bid balance
  const [userBidBalance, setUserBidBalance] = useState({
    available: 25,
    used: 47,
    total: 72,
  });
  
  // Get user's auctions (auctions with bids from the user)
  const getUserAuctions = () => {
    if (!auctions || !address) return [];
    
    // Get auctions where the user has placed bids
    return auctions.filter(auction => 
      auction.bids && 
      auction.bids.some(bid => bid.bidder.walletAddress === address)
    );
  };
  
  const handlePurchaseComplete = () => {
    // In a real implementation, we would fetch the updated bid balance
    // For now, let's mock adding 100 bids
    setUserBidBalance(prev => ({
      ...prev,
      available: prev.available + 100,
      total: prev.total + 100,
    }));
    
    toast({
      title: "Purchase Complete",
      description: "Your bid packs have been added to your account",
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Bidder Dashboard</h1>
        <p className="text-gray-400">Manage your bidding activity, track auctions, and purchase bid packs</p>
      </div>
      
      {!isConnected ? (
        <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-8 text-center">
          <h2 className="text-xl font-medium text-white mb-2">Connect Wallet to Access Dashboard</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Connect your wallet to view your bid balance, track auctions, and access all dashboard features.
          </p>
          <Button 
            className="bg-primary hover:bg-primary-dark text-white"
            onClick={() => connect('metamask')}
          >
            Connect Wallet
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Available Bids</h3>
                  <p className="text-gray-400 text-sm">Your current bid balance</p>
                </div>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Available:</span>
                <span className="text-white font-medium">{userBidBalance.available}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Used:</span>
                <span className="text-white font-medium">{userBidBalance.used}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#374151]">
                <span className="text-gray-200">Total:</span>
                <span className="text-white font-bold">{userBidBalance.total}</span>
              </div>
              
              <Button 
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white"
                onClick={() => setActiveTab("buy-bids")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Bids
              </Button>
            </div>
            
            <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Active Auctions</h3>
                  <p className="text-gray-400 text-sm">Ongoing auctions with your bids</p>
                </div>
              </div>
              
              {isAuctionsLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-gray-400">Loading auctions...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {getUserAuctions().slice(0, 2).map(auction => (
                      <Link key={auction.id} href={`/auctions/${auction.id}`}>
                        <div className="bg-[#111827] rounded-lg p-3 hover:bg-[#1a2030] cursor-pointer">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg overflow-hidden mr-3">
                              <img 
                                src={auction.nft.imageUrl} 
                                alt={auction.nft.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white text-sm font-medium truncate">{auction.nft.name}</h4>
                              <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-xs">Current: {auction.currentBid} {auction.currency}</p>
                                <p className="text-primary text-xs">
                                  {new Date(auction.endTime) > new Date() 
                                    ? `Ends in ${Math.floor((new Date(auction.endTime).getTime() - Date.now()) / 3600000)}h` 
                                    : 'Ended'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {getUserAuctions().length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">You haven't placed any bids yet</p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary/20 hover:bg-primary/10"
                    onClick={() => setActiveTab("tracking")}
                  >
                    View All Auctions
                  </Button>
                </>
              )}
            </div>
            
            <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <LucidePieChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Bidding Stats</h3>
                  <p className="text-gray-400 text-sm">Your activity summary</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <p className="text-white text-xl font-medium">{userBidBalance.used}</p>
                  <p className="text-gray-400 text-xs">Bids Placed</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <p className="text-white text-xl font-medium">{getUserAuctions().length}</p>
                  <p className="text-gray-400 text-xs">Auctions Joined</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <p className="text-white text-xl font-medium">
                    {Math.floor(Math.random() * 3)}
                  </p>
                  <p className="text-gray-400 text-xs">Auctions Won</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg text-center">
                  <p className="text-white text-xl font-medium">
                    {getUserAuctions().length > 0 
                      ? `${((userBidBalance.used / getUserAuctions().length) || 0).toFixed(1)}` 
                      : '0'}
                  </p>
                  <p className="text-gray-400 text-xs">Avg. Bids/Auction</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full text-gray-400 border-[#374151] hover:bg-[#374151]"
                onClick={() => setActiveTab("statistics")}
              >
                View Detailed Stats
              </Button>
            </div>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="mb-8"
          >
            <div className="mb-6">
              <TabsList className="bg-[#111827] p-1 h-auto flex flex-wrap">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-[#1f2937] data-[state=active]:text-white py-2"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="tracking" 
                  className="data-[state=active]:bg-[#1f2937] data-[state=active]:text-white py-2"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Tracked Auctions
                </TabsTrigger>
                <TabsTrigger 
                  value="automated" 
                  className="data-[state=active]:bg-[#1f2937] data-[state=active]:text-white py-2"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Automated Bidding
                </TabsTrigger>
                <TabsTrigger 
                  value="buy-bids" 
                  className="data-[state=active]:bg-[#1f2937] data-[state=active]:text-white py-2"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Buy Bids
                </TabsTrigger>
                <TabsTrigger 
                  value="achievements" 
                  className="data-[state=active]:bg-[#1f2937] data-[state=active]:text-white py-2"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Achievements
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6">
                  <h2 className="text-xl font-display font-bold text-white mb-4">Welcome to Your Dashboard</h2>
                  <p className="text-gray-400 mb-4">
                    Manage your bidding activity, track auctions, and purchase bid packs all in one place.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div 
                      className="bg-[#111827] rounded-lg p-4 hover:bg-[#1a2030] cursor-pointer border border-[#374151]"
                      onClick={() => setActiveTab("tracking")}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Track Auctions</h3>
                          <p className="text-gray-400 text-sm">Monitor your favorite auctions</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="bg-[#111827] rounded-lg p-4 hover:bg-[#1a2030] cursor-pointer border border-[#374151]"
                      onClick={() => setActiveTab("automated")}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Automated Bidding</h3>
                          <p className="text-gray-400 text-sm">Let Bid Bot do the work</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="bg-[#111827] rounded-lg p-4 hover:bg-[#1a2030] cursor-pointer border border-[#374151]"
                      onClick={() => setActiveTab("buy-bids")}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Buy Bid Packs</h3>
                          <p className="text-gray-400 text-sm">Get more bids for auctions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/auctions">
                    <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                      Browse Active Auctions
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tracking" className="mt-0">
              <BidTracking />
            </TabsContent>
            
            <TabsContent value="automated" className="mt-0">
              <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6">
                <h2 className="text-xl font-display font-bold text-white mb-4">Automated Bidding</h2>
                <p className="text-gray-400 mb-6">
                  Bid Bot allows you to set up automated bidding strategies for auctions.
                  Visit an auction page to configure Bid Bot for that specific auction.
                </p>
                
                <div className="bg-[#111827] p-6 rounded-lg border border-dashed border-[#374151] text-center">
                  <Bot className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Active Bid Bots</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    You don't have any active Bid Bots. Visit an auction page to set up automated bidding.
                  </p>
                  <Link href="/auctions">
                    <Button className="bg-primary hover:bg-primary-dark text-white">
                      Browse Auctions
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="buy-bids" className="mt-0">
              {bidPacks && (
                <BuyBids 
                  availableBidPacks={bidPacks} 
                  onPurchaseComplete={handlePurchaseComplete}
                />
              )}
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-0">
              <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-6">
                <h2 className="text-xl font-display font-bold text-white mb-4">Your Achievements</h2>
                <p className="text-gray-400 mb-6">
                  Track your progress and earn rewards by participating in the BidCoin platform.
                </p>
                
                <UserAchievements />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}