import { useQuery } from "@tanstack/react-query";
import { auctionService } from "@/lib/apiService";
import FeaturedAuction from "@/components/auctions/FeaturedAuction";
import AuctionFilters, { AuctionFilters as Filters } from "@/components/auctions/AuctionFilters";
import AuctionCard from "@/components/auctions/AuctionCard";
import AuctionHistory from "@/components/auctions/AuctionHistory";
import BidPacksSection from "@/components/bidpacks/BidPacksSection";
import BitCrunchSection from "@/components/analytics/BitCrunchSection";
import { useState } from "react";

export default function AuctionsPage() {
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    sortBy: "recently-added"
  });
  
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ["/api/auctions"],
    queryFn: auctionService.getAuctions,
  });

  // Apply filters to auctions
  const filteredAuctions = auctions ? auctions.filter((auction) => {
    if (filters.category === "all") return true;
    return auction.nft.category === filters.category;
  }) : [];

  // Apply sorting to filtered auctions
  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (filters.sortBy) {
      case "ending-soon": {
        const timeA = a.endTime ? new Date(a.endTime).getTime() : Date.now();
        const timeB = b.endTime ? new Date(b.endTime).getTime() : Date.now();
        return timeA - timeB;
      }
      case "price-low-high": {
        const bidA = a.currentBid ? parseFloat(String(a.currentBid)) : 0;
        const bidB = b.currentBid ? parseFloat(String(b.currentBid)) : 0;
        return bidA - bidB;
      }
      case "price-high-low": {
        const bidA = a.currentBid ? parseFloat(String(a.currentBid)) : 0;
        const bidB = b.currentBid ? parseFloat(String(b.currentBid)) : 0;
        return bidB - bidA;
      }
      case "most-bids": {
        const bidCountA = a.bidCount !== null && a.bidCount !== undefined ? Number(a.bidCount) : 0;
        const bidCountB = b.bidCount !== null && b.bidCount !== undefined ? Number(b.bidCount) : 0;
        return bidCountB - bidCountA;
      }
      case "recently-added":
      default: {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
    }
  });

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <FeaturedAuction />
      <AuctionFilters onFilterChange={handleFilterChange} />
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151] animate-pulse">
              <div className="h-48 bg-[#374151]"></div>
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <div className="h-6 w-32 bg-[#374151] rounded"></div>
                  <div className="h-4 w-12 bg-[#374151] rounded"></div>
                </div>
                <div className="flex justify-between mb-4">
                  <div className="h-8 w-24 bg-[#374151] rounded"></div>
                  <div className="h-8 w-24 bg-[#374151] rounded"></div>
                </div>
                <div className="h-10 bg-[#374151] rounded"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full p-8 text-center">
            <p className="text-white text-lg mb-2">Failed to load auctions</p>
            <p className="text-gray-400">Please try again later</p>
          </div>
        ) : (
          sortedAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))
        )}
      </section>
      
      <BidPacksSection />
      <BitCrunchSection />
      <AuctionHistory />
    </div>
  );
}
