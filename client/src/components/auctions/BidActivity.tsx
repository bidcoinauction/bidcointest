import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Bid } from "@shared/schema";
import { AlertTriangle, TrendingUp, Flame } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { BidStrategyType } from "./BidStrategy";

interface BidActivityProps {
  auctionId: number;
  initialBids?: Bid[];
  maxItems?: number;
}

type BidWithStrategy = Bid & {
  strategy?: BidStrategyType;
  intensity?: 'low' | 'medium' | 'high';
};

// This component displays real-time bid activity with strategy insights
export default function BidActivity({ auctionId, initialBids = [], maxItems = 5 }: BidActivityProps) {
  const [bids, setBids] = useState<BidWithStrategy[]>([]);
  const [bidStatus, setBidStatus] = useState<"normal" | "heated" | "intense">("normal");
  const [bidStats, setBidStats] = useState({
    lastMinuteBids: 0,
    bidRate: 0, // bids per minute
  });
  const { subscribe } = useWebSocket();
  
  // Process initial bids and add strategy insights
  useEffect(() => {
    if (initialBids.length > 0) {
      const enhancedBids = initialBids.map(bid => {
        return {
          ...bid,
          strategy: getRandomStrategy(),
          intensity: getRandomIntensity(),
        };
      });
      setBids(enhancedBids.slice(0, maxItems));
    }
  }, [initialBids, maxItems]);
  
  // Subscribe to bid events
  useEffect(() => {
    const handleNewBid = (data: any) => {
      if (data.auctionId === auctionId) {
        const newBid: BidWithStrategy = {
          ...data.bid,
          strategy: getRandomStrategy(),
          intensity: getRandomIntensity(),
        };
        
        setBids(prev => {
          const updated = [newBid, ...prev].slice(0, maxItems);
          
          // Update bid stats
          const now = new Date();
          const oneMinuteAgo = new Date(now.getTime() - 60000);
          const lastMinuteBids = updated.filter(
            b => b.timestamp && new Date(b.timestamp) >= oneMinuteAgo
          ).length;
          
          const bidRatePerMinute = Math.round(lastMinuteBids / 1);
          
          setBidStats({
            lastMinuteBids,
            bidRate: bidRatePerMinute,
          });
          
          // Update bidding intensity status
          if (bidRatePerMinute >= 10) {
            setBidStatus("intense");
          } else if (bidRatePerMinute >= 5) {
            setBidStatus("heated");
          } else {
            setBidStatus("normal");
          }
          
          return updated;
        });
      }
    };
    
    // Subscribe to bid events
    const unsubscribe = subscribe("new-bid", handleNewBid);
    
    return () => {
      unsubscribe();
    };
  }, [auctionId, maxItems, subscribe]);
  
  // Helper function to assign a random strategy for demo purposes
  // In a real app, this would be based on actual user behavior analysis
  const getRandomStrategy = (): BidStrategyType => {
    const strategies: BidStrategyType[] = [
      "beginner-friendly",
      "aggressive", 
      "patient",
      "last-second",
      "feint",
      "early-bird"
    ];
    
    return strategies[Math.floor(Math.random() * strategies.length)];
  };
  
  // Helper function to assign random intensity for demo purposes
  const getRandomIntensity = (): 'low' | 'medium' | 'high' => {
    const intensities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    return intensities[Math.floor(Math.random() * intensities.length)];
  };
  
  const getIntensityColor = (intensity?: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'high':
        return 'bg-red-500/20 text-red-500';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'low':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };
  
  const getStrategyIcon = (strategy?: BidStrategyType) => {
    switch (strategy) {
      case 'aggressive':
        return <TrendingUp className="h-4 w-4" />;
      case 'patient':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = () => {
    switch (bidStatus) {
      case "intense":
        return "text-red-500";
      case "heated":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-display font-bold text-white">Live Bidding Activity</h3>
        {bidStats.bidRate > 0 && (
          <div className={`flex items-center ${getStatusColor()}`}>
            <Flame className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{bidStats.bidRate} bids/min</span>
          </div>
        )}
      </div>
      
      {bids.length === 0 ? (
        <div className="bg-[#111827] rounded-lg p-4 text-center">
          <p className="text-gray-400">No bidding activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {bids.map((bid, index) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`bg-[#111827] rounded-lg p-3 border border-[#2c3646] ${index === 0 ? 'border-primary/50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                      <img 
                        src={bid.bidder?.avatar || '/placeholder-avatar.jpg'} 
                        alt={`${bid.bidder?.username || 'User'}'s avatar`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{bid.bidder?.username || 'Anonymous'}</p>
                      <p className="text-gray-400 text-xs">
                        {bid.timestamp ? formatRelativeTime(bid.timestamp) : 'Just now'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {bid.strategy && (
                      <div className={`px-2 py-1 rounded-full text-xs flex items-center mr-2 ${getIntensityColor(bid.intensity)}`}>
                        {getStrategyIcon(bid.strategy)}
                        <span className="ml-1">{bid.intensity}</span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{bid.amount}</p>
                      {index === 0 && <p className="text-primary text-xs">Current Leader</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {bidStatus !== "normal" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-4 p-3 rounded-lg border ${
            bidStatus === "intense" 
              ? "bg-red-500/10 border-red-500/30 text-red-400" 
              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
          }`}
        >
          <div className="flex items-center">
            <Flame className="h-5 w-5 mr-2" />
            <p className="text-sm">
              {bidStatus === "intense" 
                ? "Bidding war in progress! Activity is intense right now."
                : "Heating up! Bidding activity is increasing."
              }
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}