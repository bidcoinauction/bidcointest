import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AuctionFiltersProps {
  onFilterChange?: (filters: AuctionFilters) => void;
}

export interface AuctionFilters {
  category: string;
  sortBy: string;
  tags?: string[];
  currency?: string;
  search?: string;
}

export default function AuctionFilters({ onFilterChange }: AuctionFiltersProps) {
  const [filters, setFilters] = useState<AuctionFilters>({
    category: "all",
    sortBy: "recently-added",
    tags: [],
    currency: "all"
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleCurrencyChange = (value: string) => {
    const newFilters = { ...filters, currency: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSortChange = (value: string) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    const newFilters = { ...filters, tags: newTags };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchQuery };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="mb-6">
      {/* Search field */}
      <div className="relative mb-5">
        <Input
          type="text"
          placeholder="Search by name or trait"
          className="bg-[#0f1623] border-gray-800 text-white pr-10 rounded-lg w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Search 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
          onClick={handleSearch}
        />
      </div>

      {/* Filter options */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tag pills */}
        <div className="mr-1">
          <Badge 
            className={`cursor-pointer py-1.5 px-3 rounded-full ${
              filters.tags?.includes('newbies') 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-[#1e293b] hover:bg-[#1e293b]/80'
            }`}
            onClick={() => handleTagToggle('newbies')}
          >
            <span className="mr-1.5 text-white">●</span> Newbies
          </Badge>
        </div>
        
        <div className="mr-1">
          <Badge 
            className={`cursor-pointer py-1.5 px-3 rounded-full ${
              filters.tags?.includes('bam-pros') 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-[#1e293b] hover:bg-[#1e293b]/80'
            }`}
            onClick={() => handleTagToggle('bam-pros')}
          >
            <span className="mr-1.5 text-white">●</span> BAM Pros
          </Badge>
        </div>
        
        {/* Currency dropdown */}
        <div className="flex-grow-0">
          <Select value={filters.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="bg-[#1e293b] text-white border-gray-700 rounded-lg h-9 min-w-[160px]">
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1623] text-white border-gray-700">
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
              <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
              <SelectItem value="SOL">Solana (SOL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort dropdown */}
        <div className="flex-grow-0">
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="bg-[#1e293b] text-white border-gray-700 rounded-lg h-9 min-w-[160px]">
              <SelectValue placeholder="Recently..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1623] text-white border-gray-700">
              <SelectItem value="recently-added">Recently Added</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="price-low-high">Price: Low to High</SelectItem>
              <SelectItem value="price-high-low">Price: High to Low</SelectItem>
              <SelectItem value="most-bids">Most Bids</SelectItem>
            </SelectContent>
          </Select>
        </div>
      
        {/* Filters button */}
        <Button 
          variant="outline" 
          className="flex items-center space-x-1 bg-[#1e293b] hover:bg-[#1e293b]/80 text-white border-gray-700 rounded-lg h-9"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </div>
    </div>
  );
}
