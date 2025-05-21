import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BidPack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Coins, CreditCard, Award, PlusCircle, CheckCircle, Tag, Sparkles } from "lucide-react";
import { SiBitcoin, SiEthereum, SiSolana, SiTether } from "react-icons/si";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { purchaseBidPack } from "@/lib/api";
import useWallet from "@/hooks/useWallet";

interface BidPackCardProps {
  bidPack: BidPack;
  bestValue?: boolean;
  popular?: boolean;
  onSelect: (bidPack: BidPack) => void;
}

function BidPackCard({ bidPack, bestValue, popular, onSelect }: BidPackCardProps) {
  return (
    <Card 
      className={`bg-[#1f2937] border ${bestValue ? 'border-primary' : 'border-[#374151]'} transition-transform hover:scale-105 cursor-pointer relative`}
      onClick={() => onSelect(bidPack)}
    >
      {bestValue && (
        <div className="absolute top-0 left-0 right-0 bg-primary text-xs font-medium text-white py-1 px-2 text-center">
          Best Value
        </div>
      )}
      {popular && !bestValue && (
        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-xs font-medium text-white py-1 px-2 text-center">
          Most Popular
        </div>
      )}
      
      <CardHeader className={bestValue ? 'pt-8' : ''}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white text-lg">{bidPack.name}</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Coins className="h-5 w-5 text-primary" />
          </div>
        </div>
        <CardDescription className="text-gray-400">
          {bidPack.type === "premium" ? "Premium Bidding Package" : "Standard Bidding Package"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between mb-6">
          <div>
            <p className="text-3xl font-bold text-white">{bidPack.bidCount}</p>
            <p className="text-gray-400 text-sm">Bids</p>
          </div>
          
          {bidPack.bonusBids > 0 && (
            <div className="text-right">
              <p className="text-xl font-medium text-primary">+{bidPack.bonusBids}</p>
              <p className="text-primary text-sm">Bonus</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-gray-300 text-sm">Valid for all auctions</span>
          </div>
          {bidPack.type === "premium" && (
            <>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-300 text-sm">Priority bidding</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-300 text-sm">Enhanced bid bot</span>
              </div>
            </>
          )}
          {bidPack.bidCount >= 100 && (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-gray-300 text-sm">Never expires</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start">
        <div className="w-full border-t border-[#374151] pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-2xl font-bold">${bidPack.price}</p>
              {bidPack.originalPrice && parseFloat(bidPack.originalPrice) > parseFloat(bidPack.price) && (
                <p className="text-gray-400 text-xs line-through">${bidPack.originalPrice}</p>
              )}
            </div>
            <Button 
              className="bg-primary hover:bg-primary-dark text-white font-medium"
            >
              Buy Now
            </Button>
          </div>
          <p className="text-gray-400 text-xs mt-2">≈ {(parseFloat(bidPack.price) / 1800).toFixed(6)} ETH</p>
        </div>
      </CardFooter>
    </Card>
  );
}

type CryptoOption = "ETH" | "BTC" | "SOL" | "USDT" | "USDC";

interface CryptoPaymentProps {
  bidPack: BidPack;
  onComplete: () => void;
  onCancel: () => void;
}

function CryptoPayment({ bidPack, onComplete, onCancel }: CryptoPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<CryptoOption>("ETH");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { address } = useWallet();
  
  const cryptoAmount = {
    ETH: (parseFloat(bidPack.price) / 1800).toFixed(6),
    BTC: (parseFloat(bidPack.price) / 42000).toFixed(8),
    SOL: (parseFloat(bidPack.price) / 45).toFixed(4),
    USDT: bidPack.price,
    USDC: bidPack.price
  };
  
  const getCryptoIcon = (method: CryptoOption) => {
    switch (method) {
      case "ETH":
        return <SiEthereum className="h-6 w-6 text-[#627EEA]" />;
      case "BTC":
        return <SiBitcoin className="h-6 w-6 text-[#F7931A]" />;
      case "SOL":
        return <SiSolana className="h-6 w-6 text-[#00FFBD]" />;
      case "USDT":
      case "USDC":
        return <SiTether className="h-6 w-6 text-[#26A17B]" />;
    }
  };
  
  const handleConfirmPurchase = async () => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to make a purchase",
      });
      return;
    }
    
    setIsPending(true);
    
    try {
      // In a real implementation, this would call a blockchain transaction
      const result = await purchaseBidPack({ id: bidPack.id, address });
      
      toast({
        title: "Purchase Successful",
        description: `You have successfully purchased ${bidPack.bidCount} bids${bidPack.bonusBids ? ` (+ ${bidPack.bonusBids} bonus)` : ''}!`,
      });
      
      onComplete();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase bid pack",
      });
    } finally {
      setIsPending(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-[#111827] p-4 rounded-lg border border-[#374151]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-medium">{bidPack.name}</h3>
              <p className="text-gray-400 text-sm">{bidPack.bidCount} Bids {bidPack.bonusBids > 0 && `+ ${bidPack.bonusBids} Bonus`}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-medium">${bidPack.price}</p>
            <p className="text-gray-400 text-xs">Original: ${bidPack.originalPrice || bidPack.price}</p>
          </div>
        </div>
        
        <div className="border-t border-[#374151] pt-4">
          <p className="text-gray-400 text-sm mb-2">Select payment method:</p>
          <div className="grid grid-cols-5 gap-2">
            {(["ETH", "BTC", "SOL", "USDT", "USDC"] as CryptoOption[]).map((method) => (
              <div 
                key={method}
                className={`p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer
                ${paymentMethod === method 
                  ? 'bg-primary/20 border border-primary' 
                  : 'bg-[#1f2937] border border-[#374151] hover:bg-[#2a3441]'
                }`}
                onClick={() => setPaymentMethod(method)}
              >
                {getCryptoIcon(method)}
                <span className="text-white text-xs mt-2">{method}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-[#111827] p-4 rounded-lg border border-[#374151]">
        <h3 className="text-white font-medium mb-4">Payment Details</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white">{cryptoAmount[paymentMethod]} {paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Network Fee:</span>
            <span className="text-white">Included</span>
          </div>
          <div className="flex justify-between border-t border-[#374151] pt-3">
            <span className="text-gray-200 font-medium">Total:</span>
            <span className="text-white font-medium">{cryptoAmount[paymentMethod]} {paymentMethod}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-[#374151] bg-background hover:bg-[#374151] text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmPurchase}
          disabled={isPending}
          className="bg-primary hover:bg-primary-dark text-white"
        >
          {isPending ? "Processing..." : "Confirm Purchase"}
        </Button>
      </div>
    </div>
  );
}

function CreditCardPayment({ bidPack, onComplete, onCancel }: CryptoPaymentProps) {
  // Simplified credit card payment form
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const handleConfirmPurchase = () => {
    setIsPending(true);
    
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: "Payment Method Not Available",
        description: "Credit card payments are temporarily unavailable. Please use cryptocurrency payment methods.",
        variant: "destructive"
      });
      setIsPending(false);
    }, 1500);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg">
        <div className="flex items-start">
          <Sparkles className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
          <p className="text-yellow-100 text-sm">
            Credit card payments are temporarily unavailable. 
            Please use cryptocurrency for faster processing!
          </p>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-[#374151] bg-background hover:bg-[#374151] text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmPurchase}
          disabled={isPending}
          className="bg-primary hover:bg-primary-dark text-white opacity-50 cursor-not-allowed"
        >
          {isPending ? "Processing..." : "Credit Card Unavailable"}
        </Button>
      </div>
    </div>
  );
}

interface BuyBidsProps {
  availableBidPacks: BidPack[];
  onPurchaseComplete?: () => void;
}

export default function BuyBids({ availableBidPacks, onPurchaseComplete }: BuyBidsProps) {
  const [selectedBidPack, setSelectedBidPack] = useState<BidPack | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [paymentType, setPaymentType] = useState<"crypto" | "card">("crypto");
  
  const { toast } = useToast();
  
  const standardPacks = availableBidPacks.filter(pack => pack.type === "standard");
  const premiumPacks = availableBidPacks.filter(pack => pack.type === "premium");
  
  const popularPacks = [...availableBidPacks].sort((a, b) => {
    // Sort by number of bids
    return b.bidCount - a.bidCount;
  });
  
  const valuePacks = [...availableBidPacks].sort((a, b) => {
    // Sort by cost per bid
    const costPerBidA = parseFloat(a.price) / (a.bidCount + a.bonusBids);
    const costPerBidB = parseFloat(b.price) / (b.bidCount + b.bonusBids);
    return costPerBidA - costPerBidB;
  });
  
  const handleSelectBidPack = (bidPack: BidPack) => {
    setSelectedBidPack(bidPack);
    setShowPaymentDialog(true);
  };
  
  const handlePaymentComplete = () => {
    setShowPaymentDialog(false);
    
    if (onPurchaseComplete) {
      onPurchaseComplete();
    }
  };
  
  return (
    <>
      <Card className="bg-[#1f2937] border-[#374151]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle className="text-white">Buy Bids</CardTitle>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Purchase bid packs to participate in auctions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="grid grid-cols-3 bg-[#111827]">
                <TabsTrigger 
                  value="popular" 
                  className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger 
                  value="value" 
                  className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
                >
                  Best Value
                </TabsTrigger>
                <TabsTrigger 
                  value="premium" 
                  className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
                >
                  Premium
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="popular" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularPacks.slice(0, 3).map((bidPack, index) => (
                  <BidPackCard 
                    key={bidPack.id} 
                    bidPack={bidPack} 
                    popular={index === 0}
                    onSelect={handleSelectBidPack}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="value" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {valuePacks.slice(0, 3).map((bidPack, index) => (
                  <BidPackCard 
                    key={bidPack.id} 
                    bidPack={bidPack} 
                    bestValue={index === 0}
                    onSelect={handleSelectBidPack}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="premium" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiumPacks.slice(0, 3).map((bidPack, index) => (
                  <BidPackCard 
                    key={bidPack.id} 
                    bidPack={bidPack}
                    bestValue={index === 0}
                    onSelect={handleSelectBidPack}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-[#374151] p-6">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-white font-medium mb-2">Need More Options?</h3>
            <p className="text-gray-400 text-sm mb-4">
              We offer custom bid packages for high-volume users. Contact us for special pricing.
            </p>
            <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/10">
              <PlusCircle className="h-4 w-4 mr-2" />
              Request Custom Package
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-[#1f2937] border border-[#374151] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-white">Complete Your Purchase</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose your preferred payment method.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as "crypto" | "card")}>
            <TabsList className="grid grid-cols-2 bg-[#111827]">
              <TabsTrigger 
                value="crypto" 
                className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                <SiBitcoin className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
              <TabsTrigger 
                value="card" 
                className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Credit Card
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="crypto" className="mt-4">
              {selectedBidPack && (
                <CryptoPayment 
                  bidPack={selectedBidPack} 
                  onComplete={handlePaymentComplete} 
                  onCancel={() => setShowPaymentDialog(false)}
                />
              )}
            </TabsContent>
            
            <TabsContent value="card" className="mt-4">
              {selectedBidPack && (
                <CreditCardPayment 
                  bidPack={selectedBidPack} 
                  onComplete={handlePaymentComplete} 
                  onCancel={() => setShowPaymentDialog(false)}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
