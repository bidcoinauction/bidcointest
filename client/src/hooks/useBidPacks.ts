import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBidPacks, purchaseBidPack } from "@/lib/api";
import { purchaseBidPack as web3PurchaseBidPack } from "@/lib/web3";
import useWallet from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { BidPack } from "@shared/schema";

export function useBidPacks() {
  const [selectedPack, setSelectedPack] = useState<BidPack | null>(null);
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
    mutationFn: async (packId: number) => {
      if (!isConnected || !address || !provider || !selectedPack) {
        throw new Error("Wallet not connected or pack not selected");
      }

      // First execute the web3 transaction
      await web3PurchaseBidPack(
        packId.toString(),
        selectedPack.price.toString(),
        provider
      );

      // Then record the purchase in our database
      return purchaseBidPack(packId, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bidpacks"] });
      
      toast({
        title: "Purchase Successful",
        description: `You've successfully purchased the ${selectedPack?.name} bid pack`,
      });
      
      setSelectedPack(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase bid pack",
      });
    }
  });

  const purchasePack = (pack: BidPack) => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase bid packs",
      });
      return;
    }
    
    setSelectedPack(pack);
    purchaseMutation.mutate(pack.id);
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
