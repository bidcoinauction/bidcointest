import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Auction } from "@shared/schema";
import { SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";
import { FaCircleDollarToSlot } from "react-icons/fa6";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction;
  onSelectPaymentMethod: (method: string) => void;
}

const PAYMENT_METHODS = [
  { id: "ethereum", name: "Ethereum (ETH)", icon: SiEthereum, color: "text-blue-500" },
  { id: "solana", name: "Solana (SOL)", icon: SiSolana, color: "text-purple-500" },
  { id: "bitcoin", name: "Bitcoin (BTC)", icon: SiBitcoin, color: "text-yellow-500" },
  { id: "stablecoin", name: "USDC/USDT", icon: FaCircleDollarToSlot, color: "text-green-500" },
];

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  auction, 
  onSelectPaymentMethod 
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("ethereum");
  const { toast } = useToast();
  
  const handleSubmit = () => {
    onSelectPaymentMethod(selectedMethod);
    toast({
      title: "Payment Method Selected",
      description: `You've chosen to pay with ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}`,
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-[#1f2937] border border-[#374151] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-white">Select Payment Method</DialogTitle>
          <DialogDescription className="text-gray-400">
            Congratulations! You won the auction for {auction.nft.name}. Please select your preferred payment method.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="flex items-center space-x-2 rounded-md border border-[#374151] p-3 cursor-pointer hover:bg-[#2d3748]">
                  <RadioGroupItem value={method.id} id={method.id} className="border-gray-500" />
                  <Label htmlFor={method.id} className="flex items-center flex-1 cursor-pointer">
                    <Icon className={`mr-2 h-5 w-5 ${method.color}`} />
                    <span>{method.name}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary-dark text-white rounded-md transition-all"
          >
            Confirm Payment Method
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}