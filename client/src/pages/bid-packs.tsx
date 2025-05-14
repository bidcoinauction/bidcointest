// Removed header/footer imports
import { useQuery } from "@tanstack/react-query";
import { getBidPacks } from "@/lib/api";
import useBidPacks from "@/hooks/useBidPacks";
import { Button } from "@/components/ui/button";
import { Bolt, Rocket, Crown, Gem, CheckCircle, AlertCircle, CreditCard, Wallet, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BidPack } from "@shared/schema";
import useWallet from "@/hooks/useWallet";
import { useState } from "react";

const PackIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "single":
      return <CreditCard className="text-blue-400 text-xl" />;
    case "starter":
      return <Bolt className="text-accent text-xl" />;
    case "pro":
      return <Rocket className="text-primary text-xl" />;
    case "premium":
      return <Crown className="text-secondary text-xl" />;
    case "whale":
      return <Gem className="text-purple-500 text-xl" />;
    default:
      return <Bolt className="text-accent text-xl" />;
  }
};

function getPackBadgeColor(type: string) {
  switch (type) {
    case "single":
      return "bg-blue-500/20 text-blue-400";
    case "starter":
      return "bg-accent/20 text-accent";
    case "pro":
      return "bg-primary/20 text-primary";
    case "premium":
      return "bg-secondary/20 text-secondary";
    case "whale":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-accent/20 text-accent";
  }
}

function getPackLabel(type: string) {
  switch (type) {
    case "single":
      return "Single Bid";
    case "starter":
      return "Save 16%";
    case "pro":
      return "Save 19%";
    case "premium":
      return "Save 20%";
    case "whale":
      return "Save 23%";
    default:
      return "Pack";
  }
}

function getPackButtonColor(type: string) {
  switch (type) {
    case "single":
      return "bg-blue-500 hover:bg-blue-600";
    case "starter":
      return "bg-accent hover:bg-[#ea580c]";
    case "pro":
      return "bg-primary hover:bg-[#4f46e5]";
    case "premium":
      return "bg-secondary hover:bg-[#059669]";
    case "whale":
      return "bg-purple-600 hover:bg-purple-700";
    default:
      return "bg-primary hover:bg-[#4f46e5]";
  }
}

function BidPackCard({ pack, onPurchase }: { pack: BidPack; onPurchase: (pack: BidPack, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  
  // Calculate total price based on quantity
  const totalPrice = (parseFloat(pack.price) * quantity).toFixed(2);
  const totalOriginalPrice = (parseFloat(pack.originalPrice) * quantity).toFixed(2);
  
  // Calculate total bid count based on quantity
  const totalBids = (pack.bidCount + pack.bonusBids) * quantity;
  
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <div className="bg-[#1f2937]/80 rounded-xl p-5 border border-[#374151] hover:shadow-glow transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-[#374151] rounded-lg flex items-center justify-center">
          <PackIcon type={pack.type} />
        </div>
        <span className={`${getPackBadgeColor(pack.type)} px-2 py-1 rounded-full text-xs`}>
          {getPackLabel(pack.type)}
        </span>
      </div>
      <h3 className="font-display text-lg font-bold text-white mb-1">{pack.name}</h3>
      <div className="flex flex-col space-y-2 mb-3">
        <p className="text-gray-400 text-sm">{pack.bidCount} bids</p>
      </div>
      
      {/* Quantity selector */}
      <div className="flex items-center justify-between mb-4 bg-[#374151]/50 p-2 rounded-lg">
        <span className="text-white text-sm">Quantity:</span>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={decrementQuantity} 
            className="h-8 w-8 p-0 rounded-md border-[#4b5563]"
            disabled={quantity <= 1}
          >
            -
          </Button>
          <span className="text-white font-medium w-8 text-center">{quantity}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={incrementQuantity} 
            className="h-8 w-8 p-0 rounded-md border-[#4b5563]"
          >
            +
          </Button>
        </div>
      </div>
      
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-white font-display text-2xl font-bold">${totalPrice}</span>
          <span className="text-gray-400 text-xs">Total {totalBids} bids</span>
        </div>
        <span className="text-gray-400 text-sm line-through">${totalOriginalPrice}</span>
      </div>
      
      <Button 
        className={`w-full ${getPackButtonColor(pack.type)} text-white font-medium py-2 rounded-lg transition-colors`}
        onClick={() => onPurchase(pack, quantity)}
      >
        Buy Now
      </Button>
    </div>
  );
}

export default function BidPacksPage() {
  const { purchasePack, isPurchasing } = useBidPacks();
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("bidpacks");
  
  const { data: bidPacks, isLoading, error } = useQuery({
    queryKey: ["/api/bidpacks"],
    queryFn: getBidPacks,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <div className="md:flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">BidPacks</h1>
            <p className="text-gray-400 max-w-2xl">Purchase bid packs to save 10-20% compared to single bids. Choose from a variety of pack sizes or buy bids individually. All bids can be used across any auction.</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-[#1f2937] border-b border-[#374151] mb-6 w-full justify-start rounded-none h-auto py-1 px-0">
            <TabsTrigger value="bidpacks" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              BidPacks
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#1f2937]/80 rounded-xl p-5 border border-[#374151]">
                    <div className="flex justify-between mb-4">
                      <div className="h-12 w-12 bg-[#374151] rounded-lg"></div>
                      <div className="h-6 w-24 bg-[#374151] rounded-full"></div>
                    </div>
                    <div className="h-6 w-1/2 bg-[#374151] rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-[#374151] rounded mb-4"></div>
                    <div className="flex justify-between mb-4">
                      <div className="h-8 w-1/3 bg-[#374151] rounded"></div>
                      <div className="h-4 w-1/4 bg-[#374151] rounded"></div>
                    </div>
                    <div className="h-10 bg-[#374151] rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                <p className="text-white mb-2">Failed to load bid packs</p>
                <p className="text-gray-400">Please try again later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {bidPacks?.map((pack) => (
                  <BidPackCard 
                    key={pack.id} 
                    pack={pack} 
                    onPurchase={purchasePack}
                  />
                ))}
              </div>
            )}
            
            {!isConnected && (
              <div className="bg-[#1f2937] p-5 rounded-xl mt-8 border border-[#374151]">
                <div className="flex items-center text-amber-400 mb-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Wallet Not Connected</h3>
                </div>
                <p className="text-gray-300 mb-4">Connect your wallet to purchase bid packs and participate in auctions.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {isConnected ? (
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
                <h3 className="text-xl font-medium text-white mb-4">Your Purchase History</h3>
                <div className="bg-[#111827] rounded-lg p-5 text-center">
                  <p className="text-gray-400 mb-6">You haven't purchased any bid packs yet.</p>
                  <Button className="bg-primary hover:bg-primary-dark text-white" onClick={() => setActiveTab("bidpacks")}>
                    Browse BidPacks
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151] text-center">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-xl font-medium text-white mb-2">Wallet Not Connected</h3>
                <p className="text-gray-400 mb-4">Please connect your wallet to view your purchase history.</p>
                <Button className="bg-primary hover:bg-primary-dark text-white">
                  Connect Wallet
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="usage">
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h2 className="text-2xl font-display font-bold text-white mb-6">How BidPacks Work</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#111827] p-5 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    Purchase BidPacks
                  </h3>
                  <p className="text-gray-300 mb-3">
                    BidPacks are ordinals containing a specific number of bids that you can use to participate in auctions.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Select from different pack sizes based on your needs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Pay in USD (convertible to crypto at checkout)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Get more value with larger packs</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#111827] p-5 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4 flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-accent" />
                    Use Your Bids
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Once purchased, bids are stored in your wallet and can be used across any auction on the platform.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Each bid allows you to place one bid on an auction</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Bids are deducted from your balance automatically</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Track your remaining bids in your dashboard</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-5 rounded-lg border border-primary/30">
                <h3 className="text-lg font-medium text-white mb-2">Why Use BidPacks?</h3>
                <p className="text-gray-300 mb-4">
                  BidPacks provide a more cost-effective way to participate in auctions compared to individual transactions. By purchasing bids in bulk, you save on transaction fees and get more value with larger packs.
                </p>
                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                  Learn More <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
      

    </div>
  );
}