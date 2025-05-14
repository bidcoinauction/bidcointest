import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlarmClock, Award, Lightbulb, Brain, Target, TrendingUp, AlertTriangle } from "lucide-react";

// Define common strategy types
export type BidStrategyType = 
  | "beginner-friendly" 
  | "aggressive" 
  | "patient" 
  | "last-second" 
  | "feint" 
  | "early-bird";

// Strategy definition type
interface BidStrategy {
  id: BidStrategyType;
  name: string;
  description: string;
  tips: string[];
  icon: React.ReactNode;
  difficultyLevel: 1 | 2 | 3; // 1=Easy, 2=Medium, 3=Hard
  successRate: string;
  idealFor: string;
}

// Define all available bidding strategies
const bidStrategies: BidStrategy[] = [
  {
    id: "beginner-friendly",
    name: "Beginner's Approach",
    description: "Simple strategy focused on learning the mechanics and having fun without getting caught in bidding wars.",
    tips: [
      "Set a strict budget and stick to it",
      "Observe other auctions before participating",
      "Focus on less popular items with fewer bids",
      "Place bids early to gauge interest"
    ],
    icon: <Lightbulb className="h-5 w-5" />,
    difficultyLevel: 1,
    successRate: "Low to Medium",
    idealFor: "First-time users learning the platform mechanics"
  },
  {
    id: "aggressive",
    name: "Aggressive Bidding",
    description: "Discourage competitors by showing an aggressive commitment to winning the auction at any cost.",
    tips: [
      "Respond instantly to any competing bids",
      "Bid in quick succession to intimidate competitors",
      "Don't hesitate - be the first to respond to any action",
      "Maintain your aggressive stance until the auction closes"
    ],
    icon: <TrendingUp className="h-5 w-5" />,
    difficultyLevel: 2,
    successRate: "High but expensive",
    idealFor: "High-value items with determined competition"
  },
  {
    id: "patient",
    name: "Patient Observer",
    description: "Wait for the right moment and conserve your bids until the final stretch of the auction.",
    tips: [
      "Monitor the auction without bidding initially",
      "Study your competitors' bidding patterns",
      "Wait until the last 20-30% of the auction time",
      "Use saved bids strategically in the final minutes"
    ],
    icon: <Brain className="h-5 w-5" />,
    difficultyLevel: 2,
    successRate: "Medium to High",
    idealFor: "Longer auctions with steady bidding activity"
  },
  {
    id: "last-second",
    name: "Last-Second Strike",
    description: "Save all your resources for the final moments of the auction when many competitors have exhausted their bids.",
    tips: [
      "Have your bids ready before the final countdown begins",
      "Monitor the auction closely in the last 2 minutes",
      "Place rapid bids in the final 30 seconds",
      "Be prepared for time extensions due to your last-second bids"
    ],
    icon: <AlarmClock className="h-5 w-5" />,
    difficultyLevel: 3,
    successRate: "Variable",
    idealFor: "Auctions with time extension mechanics"
  },
  {
    id: "feint",
    name: "Strategic Feint",
    description: "Create a false impression of your bidding power and intentions to mislead competitors.",
    tips: [
      "Place occasional bids on multiple auctions to divide attention",
      "Make competitors think you've reached your limit",
      "Briefly pause bidding to suggest you've given up",
      "Return with strong consecutive bids when others relax"
    ],
    icon: <Target className="h-5 w-5" />,
    difficultyLevel: 3,
    successRate: "High when executed well",
    idealFor: "Experienced users comfortable with misdirection"
  },
  {
    id: "early-bird",
    name: "Early Momentum",
    description: "Build a commanding lead early to discourage other bidders from entering the auction.",
    tips: [
      "Be the first bidder and maintain an active presence",
      "Respond instantly to any new competitor",
      "Create a perception that you're determined to win",
      "Gradually slow down bidding if no serious competition emerges"
    ],
    icon: <Award className="h-5 w-5" />,
    difficultyLevel: 2,
    successRate: "Medium",
    idealFor: "Less popular items where discouraging competition is viable"
  }
];

interface StrategyCardProps {
  strategy: BidStrategy;
  isSelected: boolean;
  onSelect: (id: BidStrategyType) => void;
}

// Individual strategy card component
function StrategyCard({ strategy, isSelected, onSelect }: StrategyCardProps) {
  return (
    <div 
      className={`border rounded-xl p-4 transition-all cursor-pointer ${
        isSelected 
          ? 'border-primary bg-primary/10 shadow-glow' 
          : 'border-[#374151] bg-[#111827] hover:border-gray-500'
      }`}
      onClick={() => onSelect(strategy.id)}
    >
      <div className="flex items-center mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
          isSelected ? 'bg-primary text-white' : 'bg-[#1f2937] text-gray-400'
        }`}>
          {strategy.icon}
        </div>
        <h4 className="font-medium text-white">{strategy.name}</h4>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-gray-400 text-xs">Difficulty</span>
          <div className="flex">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ml-1 ${
                  i < strategy.difficultyLevel ? 'bg-primary' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Success Rate</span>
          <span className="text-xs text-white">{strategy.successRate}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-300 mb-3">{strategy.description}</p>
      
      {isSelected && (
        <div className="mt-4 border-t border-[#374151] pt-3">
          <div className="text-xs text-gray-400 mb-2">Strategy Tips:</div>
          <ul className="text-xs text-white space-y-1">
            {strategy.tips.map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface BidStrategyProps {
  onSelectStrategy?: (strategy: BidStrategyType) => void;
  defaultStrategy?: BidStrategyType;
}

export default function BidStrategySelector({ onSelectStrategy, defaultStrategy }: BidStrategyProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<BidStrategyType>(
    defaultStrategy || "beginner-friendly"
  );
  
  const handleSelectStrategy = (id: BidStrategyType) => {
    setSelectedStrategy(id);
    if (onSelectStrategy) {
      onSelectStrategy(id);
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-bold text-white">Choose Your Bidding Strategy</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <AlertTriangle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#111827] border border-[#374151] p-3 max-w-sm">
              <p className="text-sm text-gray-300">
                These strategies are suggestions to enhance your bidding experience. 
                Success is not guaranteed, and each auction's dynamics may vary. 
                Always bid responsibly within your budget.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {bidStrategies.map(strategy => (
          <StrategyCard 
            key={strategy.id}
            strategy={strategy}
            isSelected={selectedStrategy === strategy.id}
            onSelect={handleSelectStrategy}
          />
        ))}
      </div>
    </div>
  );
}

// Export a simple component to show inline strategy tips
export function StrategyTip({ type, className = "" }: { type: BidStrategyType, className?: string }) {
  const strategy = bidStrategies.find(s => s.id === type);
  if (!strategy) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center bg-primary/20 text-primary text-xs px-2 py-1 rounded-full cursor-help ${className}`}>
            {strategy.icon}
            <span className="ml-1">{strategy.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-[#111827] border border-[#374151] p-3 max-w-md">
          <h4 className="font-medium text-white mb-1">{strategy.name}</h4>
          <p className="text-sm text-gray-300 mb-2">{strategy.description}</p>
          <div className="text-xs text-gray-400 mb-1">Quick Tips:</div>
          <ul className="text-xs text-white space-y-1">
            {strategy.tips.slice(0, 2).map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}