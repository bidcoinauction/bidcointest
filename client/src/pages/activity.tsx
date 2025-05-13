import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { Activity, ActivityType } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

function getActivityBadgeColor(type: ActivityType) {
  switch (type) {
    case "bid":
      return "bg-primary/20 text-primary";
    case "purchase":
      return "bg-secondary/20 text-secondary";
    case "listing":
      return "bg-accent/20 text-accent";
    case "bid-increase":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-primary/20 text-primary";
  }
}

function getActivityLabel(type: ActivityType) {
  switch (type) {
    case "bid":
      return "Bid Placed";
    case "purchase":
      return "Purchase";
    case "listing":
      return "Listing";
    case "bid-increase":
      return "Bid Increase";
    default:
      return "Activity";
  }
}

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["/api/activity"],
    queryFn: getActivity,
  });
  
  // Filter activities based on search query, type, and time range
  const filteredActivities = activities?.filter(activity => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      activity.nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.to.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by activity type
    const matchesType = activityType === 'all' || activity.type === activityType;
    
    // Filter by time range
    let matchesTimeRange = true;
    if (timeRange !== 'all') {
      const now = new Date();
      const activityTime = new Date(activity.timestamp);
      const timeDiff = now.getTime() - activityTime.getTime();
      
      switch (timeRange) {
        case '24h':
          matchesTimeRange = timeDiff < 24 * 60 * 60 * 1000;
          break;
        case '7d':
          matchesTimeRange = timeDiff < 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          matchesTimeRange = timeDiff < 30 * 24 * 60 * 60 * 1000;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesTimeRange;
  });

  return (
    <>
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-6">Activity</h1>
          
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="bg-[#1f2937] border-b border-[#374151] mb-6 w-full justify-start rounded-none h-auto py-1 px-0">
              <TabsTrigger value="all" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                All Activity
              </TabsTrigger>
              <TabsTrigger value="following" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Following
              </TabsTrigger>
              <TabsTrigger value="my-activity" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                My Activity
              </TabsTrigger>
            </TabsList>
            
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search by NFT, wallet, or user..."
                    className="pl-10 bg-[#1f2937] text-white border-[#374151]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger className="w-[130px] bg-[#1f2937] text-white border-[#374151]">
                      <SelectValue placeholder="Activity Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bid">Bids</SelectItem>
                      <SelectItem value="purchase">Purchases</SelectItem>
                      <SelectItem value="listing">Listings</SelectItem>
                      <SelectItem value="bid-increase">Bid Increases</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[130px] bg-[#1f2937] text-white border-[#374151]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="bg-[#1f2937] border-[#374151] text-white hover:bg-[#374151]">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </div>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151] animate-pulse">
                  <div className="p-4">
                    <div className="h-12 bg-[#374151] rounded mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-[#374151] rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                  <p className="text-white mb-2">Failed to load activity data</p>
                  <p className="text-gray-400">Please try again later</p>
                </div>
              ) : filteredActivities && filteredActivities.length > 0 ? (
                <div className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-[#374151]">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {filteredActivities.map((activity) => (
                          <tr key={activity.id} className="hover:bg-[#374151]/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden mr-3">
                                  <img src={activity.nft.imageUrl} alt={`${activity.nft.name} thumbnail`} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{activity.nft.name}</div>
                                  <div className="text-xs text-gray-400">Ordinal #{activity.nft.tokenId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityBadgeColor(activity.type)}`}>
                                {getActivityLabel(activity.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {activity.price} {activity.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{activity.from}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{activity.to}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {formatRelativeTime(activity.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                  <p className="text-white mb-2">No activities found</p>
                  <p className="text-gray-400">Try adjusting your filters</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="following">
              <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                <p className="text-white mb-2">You're not following anyone yet</p>
                <p className="text-gray-400 mb-4">Follow creators to see their activity here</p>
                <Button className="bg-primary hover:bg-primary-dark text-white">
                  Explore Creators
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="my-activity">
              <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                <p className="text-white mb-2">Connect your wallet to see your activity</p>
                <p className="text-gray-400 mb-4">Your bids, purchases, and listings will appear here</p>
                <Button className="bg-primary hover:bg-primary-dark text-white">
                  Connect Wallet
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </section>
        
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h3 className="text-lg font-medium text-white mb-4">Activity Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Total Transactions</span>
                    <span className="text-white">1,245</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Bids</span>
                    <span className="text-white">843</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Purchases</span>
                    <span className="text-white">312</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Listings</span>
                    <span className="text-white">90</span>
                  </div>
                  <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h3 className="text-lg font-medium text-white mb-4">Top Collectors</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="Collector avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm">CryptoMaestro</p>
                      <p className="text-gray-400 text-xs">12 purchases</p>
                    </div>
                  </div>
                  <span className="text-primary font-medium">3.2 ETH</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                      <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="Collector avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm">geometrymaster</p>
                      <p className="text-gray-400 text-xs">8 purchases</p>
                    </div>
                  </div>
                  <span className="text-primary font-medium">2.8 ETH</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="Collector avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm">pixelqueen</p>
                      <p className="text-gray-400 text-xs">5 purchases</p>
                    </div>
                  </div>
                  <span className="text-primary font-medium">1.9 ETH</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h3 className="text-lg font-medium text-white mb-4">Recent Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-3 mt-0.5">
                    <i className="fa-solid fa-gavel text-primary text-xs"></i>
                  </div>
                  <div>
                    <p className="text-white text-sm">Your bid has been placed</p>
                    <p className="text-gray-400 text-xs">Crypto Genesis #358 - 0.75 ETH</p>
                    <p className="text-gray-500 text-xs">5 mins ago</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary/20 p-2 rounded-full mr-3 mt-0.5">
                    <i className="fa-solid fa-tag text-secondary text-xs"></i>
                  </div>
                  <div>
                    <p className="text-white text-sm">New auction listed</p>
                    <p className="text-gray-400 text-xs">Abstract Geometry - 0.2 ETH</p>
                    <p className="text-gray-500 text-xs">28 mins ago</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-accent/20 p-2 rounded-full mr-3 mt-0.5">
                    <i className="fa-solid fa-coins text-accent text-xs"></i>
                  </div>
                  <div>
                    <p className="text-white text-sm">BidPack purchased</p>
                    <p className="text-gray-400 text-xs">Pro Pack - 50 bids + 15 bonus bids</p>
                    <p className="text-gray-500 text-xs">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
