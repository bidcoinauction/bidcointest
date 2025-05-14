import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Auction } from "@shared/schema";
import { Bell, BellOff, Timer, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";
import { formatRelativeTime } from "@/lib/utils";

interface TrackedAuction extends Auction {
  notificationsEnabled: boolean;
}

interface BidTrackingProps {
  currentAuctionId?: number; // If present, we're on an auction details page
  onTrackAuction?: (auction: Auction) => void;
}

export default function BidTracking({ currentAuctionId, onTrackAuction }: BidTrackingProps) {
  const [trackedAuctions, setTrackedAuctions] = useState<TrackedAuction[]>([]);
  const { toast } = useToast();
  
  // Load tracked auctions from localStorage on component mount
  useEffect(() => {
    const storedAuctions = localStorage.getItem('trackedAuctions');
    if (storedAuctions) {
      try {
        setTrackedAuctions(JSON.parse(storedAuctions));
      } catch (e) {
        console.error('Error parsing tracked auctions', e);
        localStorage.removeItem('trackedAuctions');
      }
    }
  }, []);
  
  // Save tracked auctions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('trackedAuctions', JSON.stringify(trackedAuctions));
  }, [trackedAuctions]);
  
  const isTracked = (auctionId: number) => {
    return trackedAuctions.some(auction => auction.id === auctionId);
  };
  
  const handleToggleTrack = (auction: Auction | undefined) => {
    if (!auction) return;
    
    if (isTracked(auction.id)) {
      // Remove from tracked
      setTrackedAuctions(prev => prev.filter(a => a.id !== auction.id));
      toast({
        title: "Auction Untracked",
        description: `You will no longer receive updates for ${auction.nft.name}`,
      });
    } else {
      // Add to tracked
      setTrackedAuctions(prev => [
        ...prev, 
        { ...auction, notificationsEnabled: true } as TrackedAuction
      ]);
      toast({
        title: "Auction Tracked",
        description: `You will now receive updates for ${auction.nft.name}`,
      });
      
      if (onTrackAuction) {
        onTrackAuction(auction);
      }
    }
  };
  
  const handleToggleNotifications = (auctionId: number) => {
    setTrackedAuctions(prev => 
      prev.map(auction => 
        auction.id === auctionId 
          ? { ...auction, notificationsEnabled: !auction.notificationsEnabled } 
          : auction
      )
    );
    
    const auction = trackedAuctions.find(a => a.id === auctionId);
    if (auction) {
      toast({
        title: auction.notificationsEnabled ? "Notifications Disabled" : "Notifications Enabled",
        description: `Notifications ${auction.notificationsEnabled ? "disabled" : "enabled"} for ${auction.nft.name}`,
      });
    }
  };
  
  const handleRemoveAll = () => {
    setTrackedAuctions([]);
    toast({
      title: "Tracking Cleared",
      description: "All tracked auctions have been removed",
    });
  };
  
  // If on auction details page, render the track/untrack button
  if (currentAuctionId !== undefined) {
    const isCurrentAuctionTracked = isTracked(currentAuctionId);
    
    return (
      <Button
        variant={isCurrentAuctionTracked ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleToggleTrack({ id: currentAuctionId } as Auction)}
        className={isCurrentAuctionTracked ? "bg-red-600 hover:bg-red-700" : ""}
      >
        {isCurrentAuctionTracked ? (
          <>
            <BellOff className="h-4 w-4 mr-2" />
            Untrack
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Track Auction
          </>
        )}
      </Button>
    );
  }
  
  // Otherwise render the full tracking dashboard
  return (
    <Card className="bg-[#1f2937] border-[#374151]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-white">Tracked Auctions</CardTitle>
          </div>
          {trackedAuctions.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={handleRemoveAll}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-gray-400">
          Monitor your favorite auctions
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {trackedAuctions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">You aren't tracking any auctions yet</p>
            <p className="text-gray-500 text-sm">
              Browse auctions and click "Track Auction" to monitor them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trackedAuctions.map(auction => (
              <div 
                key={auction.id} 
                className="flex items-center justify-between bg-[#111827] p-3 rounded-lg border border-[#374151]"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg overflow-hidden mr-3">
                    <img 
                      src={auction.nft?.imageUrl || '/placeholder-image.jpg'} 
                      alt={auction.nft?.name || 'NFT'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">{auction.nft?.name || 'NFT'}</h4>
                    <div className="flex items-center text-gray-400 text-xs">
                      <Timer className="h-3 w-3 mr-1" />
                      <span>
                        {auction.endTime 
                          ? formatRelativeTime(new Date(auction.endTime)) 
                          : 'Unknown time'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-1 ${auction.notificationsEnabled ? 'text-primary' : 'text-gray-400'}`}
                          onClick={() => handleToggleNotifications(auction.id)}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#111827] border border-[#374151]">
                        <p className="text-sm">
                          {auction.notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/auctions/${auction.id}`}>
                          <Button variant="ghost" size="sm" className="p-1 text-gray-400">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#111827] border border-[#374151]">
                        <p className="text-sm">View auction</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 text-gray-400 hover:text-red-500"
                          onClick={() => handleToggleTrack(auction)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#111827] border border-[#374151]">
                        <p className="text-sm">Remove from tracking</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {trackedAuctions.length > 0 && (
        <CardFooter className="flex justify-end">
          <Button 
            variant="outline" 
            className="text-primary hover:bg-primary/10 border-primary/20"
          >
            Manage Notifications
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}