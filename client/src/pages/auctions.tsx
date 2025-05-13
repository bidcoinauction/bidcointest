import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "@/lib/api";
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
    queryFn: getAuctions,
  });

  // Apply filters to auctions
  const filteredAuctions = auctions ? auctions.filter((auction) => {
    if (filters.category === "all") return true;
    return auction.nft.category === filters.category;
  }) : [];

  // Apply sorting to filtered auctions
  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (filters.sortBy) {
      case "ending-soon":
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      case "price-low-high":
        return a.currentBid - b.currentBid;
      case "price-high-low":
        return b.currentBid - a.currentBid;
      case "most-bids":
        return b.bidCount - a.bidCount;
      case "recently-added":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8">
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
      </main>
    </>
  );
}
