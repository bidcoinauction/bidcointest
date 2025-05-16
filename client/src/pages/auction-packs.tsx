import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CheckCircle, CreditCard, Package2, Timer } from "lucide-react";
import { BidPack } from "@shared/schema";

// Mock bid packs data (to be replaced with API data later)
const mockBidPacks: Partial<BidPack>[] = [
  {
    id: 1,
    name: "Starter Pack",
    description: "Perfect for beginners to try out auctions",
    type: "basic",
    price: "24.99",
    bidCount: 100,
    bonusBids: 0,
    imageUrl: "/images/packs/starter-pack.png",
  },
  {
    id: 2,
    name: "Standard Pack",
    description: "Great value for regular auction participants",
    type: "standard",
    price: "49.99",
    bidCount: 250,
    bonusBids: 25,
    imageUrl: "/images/packs/standard-pack.png"
  },
  {
    id: 3,
    name: "Premium Pack",
    description: "Best value for serious auction enthusiasts",
    type: "premium",
    price: "99.99",
    bidCount: 600,
    bonusBids: 100,
    imageUrl: "/images/packs/premium-pack.png"
  },
  {
    id: 4,
    name: "Diamond Pack",
    description: "Ultimate pack for power users",
    type: "diamond",
    price: "199.99",
    bidCount: 1500,
    bonusBids: 300,
    imageUrl: "/images/packs/diamond-pack.png"
  }
];

// Mock purchase history data
const mockPurchaseHistory: { 
  id: number; 
  packName: string; 
  packType: string; 
  date: string; 
  price: number; 
  bidCount: number;
  status: "completed" | "pending" | "failed";
}[] = [
  {
    id: 12345,
    packName: "Standard Pack",
    packType: "standard",
    date: "2025-05-10T14:35:42Z",
    price: 49.99,
    bidCount: 250,
    status: "completed"
  },
  {
    id: 12346,
    packName: "Premium Pack",
    packType: "premium",
    date: "2025-05-05T09:12:18Z",
    price: 99.99,
    bidCount: 600,
    status: "completed"
  },
];

function getPackBadgeColor(type: string) {
  switch (type) {
    case "basic":
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "standard":
      return "bg-green-500/20 text-green-400 border-green-500/40";
    case "premium":
      return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    case "diamond":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/40";
  }
}

function getPackLabel(type: string) {
  switch (type) {
    case "basic":
      return "Basic";
    case "standard":
      return "Standard";
    case "premium":
      return "Premium";
    case "diamond":
      return "Diamond";
    default:
      return "Standard";
  }
}

function getPackButtonColor(type: string) {
  switch (type) {
    case "basic":
      return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    case "standard":
      return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
    case "premium":
      return "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500";
    case "diamond":
      return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
    default:
      return "bg-primary hover:bg-primary/90 focus:ring-primary";
  }
}

function AuctionPackCard({ pack, onPurchase }: { pack: Partial<BidPack>; onPurchase: (pack: Partial<BidPack>, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const badgeColorClass = getPackBadgeColor(pack.type);
  const buttonColorClass = getPackButtonColor(pack.type);
  
  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };
  
  const handlePurchase = () => {
    onPurchase(pack, quantity);
  };
  
  return (
    <div className="bg-[#111827] rounded-xl border border-[#374151] overflow-hidden transition-all duration-200 hover:border-[#4b5563] hover:shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${badgeColorClass}`}>
              {getPackLabel(pack.type)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Price</div>
            <div className="text-xl font-bold text-white">${pack.price.toFixed(2)}</div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
        <p className="text-gray-400 text-sm mb-4">{pack.description}</p>
        
        <div className="space-y-3 mb-5">
          <div className="flex justify-between">
            <div className="text-gray-300 flex items-center gap-2">
              <Package2 className="h-4 w-4 text-primary" />
              Bids:
            </div>
            <div className="text-white font-semibold">{pack.bidCount}</div>
          </div>
          
          {pack.bonusBids > 0 && (
            <div className="flex justify-between">
              <div className="text-gray-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-secondary" />
                Bonus Bids:
              </div>
              <div className="text-secondary font-semibold">+{pack.bonusBids}</div>
            </div>
          )}
          
          <div className="flex justify-between">
            <div className="text-gray-300 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Total Bids:
            </div>
            <div className="text-white font-semibold">{pack.bidCount + (pack.bonusBids || 0)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center justify-center col-span-1">
            <div className="flex items-center border border-[#374151] rounded-md">
              <button 
                onClick={() => handleQuantityChange(-1)} 
                disabled={quantity <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50"
              >
                -
              </button>
              <span className="w-8 text-center text-white">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(1)} 
                disabled={quantity >= 10}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <button 
            className={`col-span-2 ${buttonColorClass} text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 flex items-center justify-center`}
            onClick={handlePurchase}
          >
            Buy Now · ${(pack.price * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuctionPacksPage() {
  const [activeTab, setActiveTab] = useState("bidpacks");
  
  // Simulate loading data from an API
  const { data: bidPacks, isLoading } = useQuery({
    queryKey: ['/api/bid-packs'],
    queryFn: async () => {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockBidPacks;
    }
  });
  
  const { data: purchaseHistory } = useQuery({
    queryKey: ['/api/bid-packs/history'],
    queryFn: async () => {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 700));
      return mockPurchaseHistory;
    }
  });
  
  const handlePurchase = (pack: BidPack, quantity: number) => {
    console.log(`Purchasing ${quantity} of ${pack.name} for $${(pack.price * quantity).toFixed(2)}`);
    // API call to purchase packs would go here
    alert(`Thank you for purchasing ${quantity} ${pack.name}${quantity > 1 ? 's' : ''}!`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-display font-bold text-white mb-2 sm:mb-0">AuctionPacks</h1>
          <div className="flex space-x-2">
            <Button variant="outline" className="border-[#374151] text-white hover:bg-[#1f2937]">
              Gift Packs
            </Button>
            <Button className="bg-primary hover:bg-primary-dark text-white">
              Get Help
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-[#1f2937] border-b border-[#374151] mb-6 w-full justify-start rounded-none h-auto py-1 px-0">
            <TabsTrigger value="bidpacks" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              AuctionPacks
            </TabsTrigger>
            <TabsTrigger value="history" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Purchase History
            </TabsTrigger>
            <TabsTrigger value="usage" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              How It Works
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bidpacks">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#111827] rounded-xl border border-[#374151] overflow-hidden animate-pulse">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
                        <div className="text-right">
                          <div className="h-4 w-12 bg-gray-700 rounded mb-1"></div>
                          <div className="h-6 w-20 bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="h-7 bg-gray-700 rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-gray-700 rounded mb-1 w-full"></div>
                      <div className="h-4 bg-gray-700 rounded mb-4 w-2/3"></div>
                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-10 bg-gray-700 rounded"></div>
                        <div className="col-span-2 h-10 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bidPacks?.map((pack) => (
                  <AuctionPackCard key={pack.id} pack={pack} onPurchase={handlePurchase} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {!purchaseHistory || purchaseHistory.length === 0 ? (
              <div>
                <h3 className="text-xl font-medium text-white mb-4">Your Purchase History</h3>
                <div className="bg-[#111827] rounded-lg p-5 text-center">
                  <p className="text-gray-400 mb-6">You haven't purchased any bid packs yet.</p>
                  <Button className="bg-primary hover:bg-primary-dark text-white" onClick={() => setActiveTab("bidpacks")}>
                    Browse AuctionPacks
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-medium text-white mb-4">Your Purchase History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full bg-[#111827] rounded-lg border border-[#374151]">
                    <thead>
                      <tr className="border-b border-[#374151]">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Order ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Pack</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Bids</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map((item) => {
                        const date = new Date(item.date);
                        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                        
                        let statusColorClass = "";
                        switch (item.status) {
                          case "completed":
                            statusColorClass = "bg-green-500/20 text-green-400 border-green-500/40";
                            break;
                          case "pending":
                            statusColorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
                            break;
                          case "failed":
                            statusColorClass = "bg-red-500/20 text-red-400 border-red-500/40";
                            break;
                        }
                        
                        return (
                          <tr key={item.id} className="border-b border-[#374151] hover:bg-[#1f2937]">
                            <td className="px-4 py-3 text-sm text-gray-300">#{item.id}</td>
                            <td className="px-4 py-3 text-sm text-white">{item.packName}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{formattedDate}</td>
                            <td className="px-4 py-3 text-sm text-white">${item.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{item.bidCount}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs border ${statusColorClass}`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="usage">
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h2 className="text-2xl font-display font-bold text-white mb-6">How AuctionPacks Work</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#111827] p-5 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    Purchase AuctionPacks
                  </h3>
                  <p className="text-gray-300 mb-3">
                    AuctionPacks are ordinals containing a specific number of bids that you can use to participate in auctions.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Select from different pack sizes based on your needs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Pay securely with cryptocurrency or credit card</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Bigger packs offer bonus bids for better value</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#111827] p-5 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4 flex items-center">
                    <Timer className="h-5 w-5 mr-2 text-primary" />
                    Participate in Auctions
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Use your bids to participate in live auctions for premium NFTs and other digital collectibles.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Each bid costs a fixed amount from your pack balance</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Every bid increases the auction price slightly</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">The last bidder when the timer reaches zero wins the item</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-5 rounded-lg border border-primary/30">
                <h3 className="text-lg font-medium text-white mb-2">Why Use AuctionPacks?</h3>
                <p className="text-gray-300 mb-4">
                  AuctionPacks provide a more cost-effective way to participate in auctions compared to individual transactions. By purchasing bids in bulk, you save on transaction fees and get more value with larger packs.
                </p>
                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                  Learn More <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}