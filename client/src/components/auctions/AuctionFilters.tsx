import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface AuctionFiltersProps {
  onFilterChange?: (filters: AuctionFilters) => void;
}

export interface AuctionFilters {
  category: string;
  sortBy: string;
}

export default function AuctionFilters({ onFilterChange }: AuctionFiltersProps) {
  const [filters, setFilters] = useState<AuctionFilters>({
    category: "all",
    sortBy: "recently-added"
  });

  const handleCategoryChange = (value: string) => {
    const newFilters = { ...filters, category: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSortChange = (value: string) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-white">Live Auctions</h2>
        
        <div className="flex flex-wrap gap-3">
          <Select value={filters.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px] md:w-[180px] bg-[#1f2937] text-white border-[#374151]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="nft-art">NFT Art</SelectItem>
              <SelectItem value="collectibles">Collectibles</SelectItem>
              <SelectItem value="domain-names">Domain Names</SelectItem>
              <SelectItem value="virtual-land">Virtual Land</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px] md:w-[180px] bg-[#1f2937] text-white border-[#374151]">
              <SelectValue placeholder="Recently Added" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
              <SelectItem value="recently-added">Recently Added</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="price-low-high">Price: Low to High</SelectItem>
              <SelectItem value="price-high-low">Price: High to Low</SelectItem>
              <SelectItem value="most-bids">Most Bids</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 bg-[#1f2937] hover:bg-[#374151] text-white border-[#374151]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
