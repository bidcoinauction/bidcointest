import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Auction } from "@shared/schema";
import { 
  Bot, 
  Settings2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Gauge,
  Check,
  X
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BidStrategyType } from "../auctions/BidStrategy";

interface BidBotProps {
  auction: Auction;
  availableBids: number;
  onPlaceBid?: (amount: string) => void;
}

type BidTiming = "early" | "middle" | "late" | "random";
type BidIntensity = "conservative" | "moderate" | "aggressive";

interface BidBotSettings {
  enabled: boolean;
  maxBids: number;
  maxPriceLimit: string;
  bidTiming: BidTiming;
  bidIntensity: BidIntensity;
  strategy: BidStrategyType;
  smartBidding: boolean;
  antiSnipe: boolean;
}

export default function BidBot({ auction, availableBids, onPlaceBid }: BidBotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<BidBotSettings>({
    enabled: false,
    maxBids: Math.min(10, availableBids),
    maxPriceLimit: (parseFloat(auction.currentBid || auction.startingBid) * 2).toFixed(4),
    bidTiming: "late",
    bidIntensity: "moderate",
    strategy: "patient",
    smartBidding: true,
    antiSnipe: true
  });
  
  const { toast } = useToast();
  
  const handleToggle = (enabled: boolean) => {
    if (!availableBids && enabled) {
      toast({
        variant: "destructive",
        title: "No bids available",
        description: "You need to purchase bid packs to use Bid Bot",
      });
      return;
    }
    
    setSettings(prev => ({ ...prev, enabled }));
    
    if (enabled) {
      toast({
        title: "Bid Bot Activated",
        description: "Your automated bidding assistant is now active for this auction.",
      });
    } else {
      toast({
        title: "Bid Bot Deactivated",
        description: "Your automated bidding has been stopped.",
      });
    }
  };
  
  const handleMaxBidsChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, maxBids: value[0] }));
  };
  
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value;
    setSettings(prev => ({ ...prev, maxPriceLimit: price }));
  };
  
  const handleStrategyChange = (value: BidStrategyType) => {
    // Adjust other settings based on strategy
    let newSettings = { ...settings, strategy: value as BidStrategyType };
    
    switch (value) {
      case "aggressive":
        newSettings.bidIntensity = "aggressive";
        newSettings.bidTiming = "early";
        break;
      case "patient":
        newSettings.bidIntensity = "conservative";
        newSettings.bidTiming = "middle";
        break;
      case "last-second":
        newSettings.bidIntensity = "moderate";
        newSettings.bidTiming = "late";
        newSettings.antiSnipe = true;
        break;
      case "feint":
        newSettings.bidIntensity = "moderate";
        newSettings.bidTiming = "random";
        break;
      case "early-bird":
        newSettings.bidIntensity = "moderate";
        newSettings.bidTiming = "early";
        break;
      default:
        newSettings.bidIntensity = "moderate";
        newSettings.bidTiming = "middle";
    }
    
    setSettings(newSettings);
  };
  
  const getStrategyDescription = (strategy: BidStrategyType) => {
    switch (strategy) {
      case "aggressive":
        return "Places bids consistently throughout the auction to intimidate competitors";
      case "patient":
        return "Waits for the right moment to place calculated bids";
      case "last-second":
        return "Focuses on bidding in the final moments of the auction";
      case "feint":
        return "Creates a misleading pattern to confuse other bidders";
      case "early-bird":
        return "Establishes dominance early to discourage other bidders";
      default:
        return "Balanced approach suitable for beginners";
    }
  };
  
  const getTimingLabel = (timing: BidTiming) => {
    switch (timing) {
      case "early":
        return "Early auction (first 25%)";
      case "middle":
        return "Mid auction (25-75%)";
      case "late":
        return "Late auction (last 25%)";
      case "random":
        return "Random intervals";
    }
  };
  
  const getIntensityLabel = (intensity: BidIntensity) => {
    switch (intensity) {
      case "conservative":
        return "Fewer, well-timed bids";
      case "moderate":
        return "Balanced bid frequency";
      case "aggressive":
        return "More frequent bidding";
    }
  };
  
  const getBotEfficiency = (): number => {
    // Calculate a score based on settings alignment
    let score = 0;
    
    // Strategy and timing alignment
    if (
      (settings.strategy === "last-second" && settings.bidTiming === "late") ||
      (settings.strategy === "early-bird" && settings.bidTiming === "early") ||
      (settings.strategy === "patient" && settings.bidTiming === "middle") ||
      (settings.strategy === "aggressive" && settings.bidIntensity === "aggressive") ||
      (settings.strategy === "feint" && settings.bidTiming === "random")
    ) {
      score += 40;
    } else {
      score += 20;
    }
    
    // Smart features
    if (settings.smartBidding) score += 25;
    if (settings.antiSnipe) score += 15;
    
    // Bid limit reasonability
    if (settings.maxBids >= 5 && settings.maxBids <= availableBids) {
      score += 20;
    } else {
      score += 10;
    }
    
    return Math.min(100, score);
  };
  
  const botEfficiency = getBotEfficiency();
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return "text-green-500";
    if (efficiency >= 70) return "text-yellow-500";
    return "text-red-500";
  };
  
  return (
    <Card className="bg-[#1f2937] border-[#374151]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-white">Bid Bot</CardTitle>
          </div>
          <div className="flex items-center space-x-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`px-2 py-1 rounded-full text-xs flex items-center ${settings.enabled ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-400"}`}>
                    {settings.enabled ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        <span>Inactive</span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[#111827] border-[#374151]">
                  <p className="text-sm">
                    {settings.enabled 
                      ? "Bid Bot is currently active and will place bids based on your settings" 
                      : "Bid Bot is inactive. Toggle the switch to activate"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Switch 
              checked={settings.enabled} 
              onCheckedChange={handleToggle} 
              className="data-[state=checked]:bg-primary"
            />
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-400">
          Automate your bidding strategy for this auction
        </CardDescription>
      </CardHeader>
      
      {!isExpanded ? (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#111827] p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Available Bids</p>
              <p className="text-white font-medium">{availableBids}</p>
            </div>
            <div className="bg-[#111827] p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Strategy</p>
              <p className="text-white font-medium capitalize">{settings.strategy.replace("-", " ")}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Bot Efficiency</span>
            <span className={`font-medium ${getEfficiencyColor(botEfficiency)}`}>{botEfficiency}%</span>
          </div>
          <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                botEfficiency >= 85 
                  ? "bg-green-500" 
                  : botEfficiency >= 70 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
              }`} 
              style={{ width: `${botEfficiency}%` }}
            ></div>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(true)} 
            className="w-full mt-4 text-primary hover:bg-primary/10"
          >
            Configure Bid Bot
          </Button>
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strategy" className="text-gray-400">Bidding Strategy</Label>
                <Select 
                  value={settings.strategy} 
                  onValueChange={(value) => handleStrategyChange(value as BidStrategyType)}
                >
                  <SelectTrigger className="bg-[#111827] border-[#374151] text-white">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#374151] text-white">
                    <SelectItem value="beginner-friendly">Beginner Friendly</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="patient">Patient Observer</SelectItem>
                    <SelectItem value="last-second">Last-Second Strike</SelectItem>
                    <SelectItem value="feint">Strategic Feint</SelectItem>
                    <SelectItem value="early-bird">Early Momentum</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{getStrategyDescription(settings.strategy)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bidTiming" className="text-gray-400">Bid Timing</Label>
                <Select 
                  value={settings.bidTiming} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, bidTiming: value as BidTiming }))}
                >
                  <SelectTrigger className="bg-[#111827] border-[#374151] text-white">
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#374151] text-white">
                    <SelectItem value="early">Early Auction</SelectItem>
                    <SelectItem value="middle">Mid Auction</SelectItem>
                    <SelectItem value="late">Late Auction</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{getTimingLabel(settings.bidTiming)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bidIntensity" className="text-gray-400">Bid Intensity</Label>
                <Select 
                  value={settings.bidIntensity} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, bidIntensity: value as BidIntensity }))}
                >
                  <SelectTrigger className="bg-[#111827] border-[#374151] text-white">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#374151] text-white">
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{getIntensityLabel(settings.bidIntensity)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxPrice" className="text-gray-400">Max Price Limit ({auction.currency})</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min={parseFloat(auction.currentBid || auction.startingBid)}
                  step="0.01"
                  className="bg-[#111827] border-[#374151] text-white"
                  value={settings.maxPriceLimit}
                  onChange={handleMaxPriceChange}
                />
                <p className="text-xs text-gray-500">Bot will stop bidding above this price</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="maxBids" className="text-gray-400">Max Bids to Use</Label>
                  <span className="text-white">{settings.maxBids} / {availableBids}</span>
                </div>
                <Slider
                  id="maxBids"
                  min={1}
                  max={availableBids}
                  step={1}
                  value={[settings.maxBids]}
                  onValueChange={handleMaxBidsChange}
                  className="py-2"
                />
                <p className="text-xs text-gray-500">Limit how many bids the bot can use</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <Label htmlFor="smartBidding" className="text-gray-400">Smart Bidding</Label>
                </div>
                <Switch 
                  id="smartBidding"
                  checked={settings.smartBidding} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smartBidding: checked }))} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Label htmlFor="antiSnipe" className="text-gray-400">Anti-Snipe Protection</Label>
                </div>
                <Switch 
                  id="antiSnipe"
                  checked={settings.antiSnipe} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, antiSnipe: checked }))} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-[#111827] rounded-lg border border-yellow-500/30">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-gray-300">
                Bid Bot will place bids automatically according to your strategy. 
                You can deactivate the bot at any time.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Bot Efficiency</span>
              <span className={`font-medium ${getEfficiencyColor(botEfficiency)}`}>{botEfficiency}%</span>
            </div>
            <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  botEfficiency >= 85 
                    ? "bg-green-500" 
                    : botEfficiency >= 70 
                      ? "bg-yellow-500" 
                      : "bg-red-500"
                }`} 
                style={{ width: `${botEfficiency}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardFooter className="pt-0 justify-between">
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(false)} 
          className="bg-background hover:bg-[#374151] text-white border-[#374151]"
        >
          {isExpanded ? "Collapse" : "View Details"}
        </Button>
        
        <Button 
          disabled={!availableBids || settings.enabled} 
          onClick={() => handleToggle(!settings.enabled)} 
          className="bg-primary hover:bg-primary-dark text-white"
        >
          {settings.enabled ? "Deactivate Bot" : "Activate Bot"}
        </Button>
      </CardFooter>
    </Card>
  );
}