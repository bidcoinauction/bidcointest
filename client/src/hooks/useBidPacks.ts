import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBidPacks, purchaseBidPack } from "@/lib/api";
import { purchaseBidPack as web3PurchaseBidPack } from "@/lib/web3";
import useWallet from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { BidPack } from "@shared/schema";

export function useBidPacks() {
  const [selectedPack, setSelectedPack] = useState<BidPack | null>(null);
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { address, provider, isConnected } = useWallet();

  // Fetch all bid packs
  const {
    data: bidPacks,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/bidpacks"],
    queryFn: getBidPacks,
  });

  // Mutation for purchasing a bid pack
  const purchaseMutation = useMutation({
    mutationFn: async ({ packId, quantity }: { packId: number, quantity: number }) => {
      if (!isConnected || !address || !provider || !selectedPack) {
        throw new Error("Wallet not connected or pack not selected");
      }

      // Calculate total price based on quantity
      const totalPrice = (parseFloat(selectedPack.price) * quantity).toFixed(2);

      // First execute the web3 transaction
      await web3PurchaseBidPack(
        packId.toString(),
        totalPrice.toString(),
        provider
      );

      // Then record the purchase in our database
      // Note: In a real implementation, we would need to update the API to handle quantity
      // For now, we call purchaseBidPack multiple times based on quantity
      const purchases = [];
      for (let i = 0; i < quantity; i++) {
        purchases.push(purchaseBidPack(packId, address));
      }
      
      return Promise.all(purchases);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bidpacks"] });
      
      const totalBids = selectedPack ? (selectedPack.bidCount + selectedPack.bonusBids) * quantity : 0;
      
      toast({
        title: "Purchase Successful",
        description: `You've successfully purchased ${quantity} ${selectedPack?.name} (${totalBids} bids total)`,
      });
      
      setSelectedPack(null);
      setQuantity(1);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase bid pack",
      });
    }
  });

  const purchasePack = (pack: BidPack, qty: number = 1) => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase bid packs",
      });
      return;
    }
    
    setSelectedPack(pack);
    setQuantity(qty);
    purchaseMutation.mutate({ packId: pack.id, quantity: qty });
  };

  return {
    bidPacks,
    selectedPack,
    setSelectedPack,
    purchasePack,
    isLoading,
    isPurchasing: purchaseMutation.isPending,
    error
  };
}

export default useBidPacks;
