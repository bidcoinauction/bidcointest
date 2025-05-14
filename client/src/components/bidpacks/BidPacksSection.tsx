import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getBidPacks } from "@/lib/api";
import useBidPacks from "@/hooks/useBidPacks";
import {
  Bolt,
  Rocket,
  Crown,
  Gem
} from "lucide-react";
import { BidPack } from "@shared/schema";

const PackIcon = ({ type }: { type: string }) => {
  switch (type) {
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
    case "starter":
      return "Most Popular";
    case "pro":
      return "Best Value";
    case "premium":
      return "Exclusive";
    case "whale":
      return "Ultimate";
    default:
      return "Pack";
  }
}

function getPackButtonColor(type: string) {
  switch (type) {
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
        <p className="text-gray-400 text-sm">{pack.bidCount} bids + {pack.bonusBids} bonus bids</p>
        <p className="text-xs text-primary">Each bid costs $0.24</p>
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
          <span className="text-white font-display text-2xl font-bold">{totalPrice} {pack.currency}</span>
          <span className="text-gray-400 text-xs">Total {totalBids} bids</span>
        </div>
        <span className="text-gray-400 text-sm line-through">{totalOriginalPrice} {pack.currency}</span>
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

export default function BidPacksSection() {
  const { purchasePack, isPurchasing } = useBidPacks();
  
  const { data: bidPacks, isLoading, error } = useQuery({
    queryKey: ["/api/bidpacks"],
    queryFn: getBidPacks,
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">BidPacks (Ordinals)</h2>
          <div 
            className="text-primary hover:text-[#818cf8] font-medium text-sm flex items-center cursor-pointer"
            onClick={() => window.location.href = "/bid-packs"}
          >
            View All 
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1f2937]/80 rounded-xl p-5 border border-[#374151] animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-12 w-12 bg-[#374151] rounded-lg"></div>
                <div className="h-6 w-24 bg-[#374151] rounded-full"></div>
              </div>
              <div className="h-6 w-32 bg-[#374151] rounded mb-2"></div>
              <div className="h-4 w-48 bg-[#374151] rounded mb-4"></div>
              <div className="flex justify-between mb-4">
                <div className="h-8 w-24 bg-[#374151] rounded"></div>
                <div className="h-4 w-16 bg-[#374151] rounded"></div>
              </div>
              <div className="h-10 bg-[#374151] rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !bidPacks) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">BidPacks (Ordinals)</h2>
        </div>
        <div className="bg-[#1f2937] rounded-xl p-8 text-center">
          <p className="text-white mb-2">Failed to load bid packs</p>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-white">BidPacks (Ordinals)</h2>
        <div 
          className="text-primary hover:text-[#818cf8] font-medium text-sm flex items-center cursor-pointer"
          onClick={() => window.location.href = "/bid-packs"}
        >
          View All 
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bidPacks.map((pack) => (
          <BidPackCard 
            key={pack.id} 
            pack={pack} 
            onPurchase={purchasePack}
          />
        ))}
      </div>
    </section>
  );
}
