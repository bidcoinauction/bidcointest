import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, SlidersHorizontal, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AuctionFiltersProps {
  onFilterChange?: (filters: AuctionFilters) => void;
}

export interface AuctionFilters {
  category: string;
  sortBy: string;
  tags?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
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

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleCurrencyChange = (value: string) => {
    const newFilters = { ...filters, currency: value };
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
    <section className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-white">Live Auctions</h2>
        
        <div className="w-full md:w-auto">
          {/* Search bar */}
          <div className="relative mb-4 w-full md:w-auto">
            <div className="flex">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search by name or trait"
                  className="bg-[#111827] border-[#374151] text-white pr-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={handleSearch}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-3">
            {/* Tag filters - styled like the screenshot */}
            <div className="flex flex-wrap gap-2 mr-2">
              <Badge 
                className={`cursor-pointer ${filters.tags?.includes('newbies') ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                onClick={() => handleTagToggle('newbies')}
              >
                <span className="mr-1">●</span> Newbies
              </Badge>
              <Badge 
                className={`cursor-pointer ${filters.tags?.includes('bam-pros') ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                onClick={() => handleTagToggle('bam-pros')}
              >
                <span className="mr-1">●</span> BAM Pros
              </Badge>
            </div>
          
            {/* Currency select */}
            <Select value={filters.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[140px] bg-[#111827] text-white border-[#374151]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] text-white border-[#374151]">
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="SOL">Solana (SOL)</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort options */}
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[140px] bg-[#111827] text-white border-[#374151]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] text-white border-[#374151]">
                <SelectItem value="recently-added">Recently Added</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="most-bids">Most Bids</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Advanced filters button */}
            <Button 
              variant="outline" 
              className="flex items-center space-x-1 bg-[#111827] hover:bg-[#1f2937] text-white border-[#374151]"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium text-white mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox 
                  id="cat-all" 
                  checked={filters.category === 'all'}
                  onCheckedChange={() => handleCategoryChange('all')}
                  className="border-[#374151]"
                />
                <Label htmlFor="cat-all" className="ml-2 text-sm text-gray-300">All Categories</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="cat-nft-art" 
                  checked={filters.category === 'nft-art'}
                  onCheckedChange={() => handleCategoryChange('nft-art')}
                  className="border-[#374151]"
                />
                <Label htmlFor="cat-nft-art" className="ml-2 text-sm text-gray-300">NFT Art</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="cat-collectibles" 
                  checked={filters.category === 'collectibles'}
                  onCheckedChange={() => handleCategoryChange('collectibles')}
                  className="border-[#374151]"
                />
                <Label htmlFor="cat-collectibles" className="ml-2 text-sm text-gray-300">Collectibles</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="cat-games" 
                  checked={filters.category === 'games'}
                  onCheckedChange={() => handleCategoryChange('games')}
                  className="border-[#374151]"
                />
                <Label htmlFor="cat-games" className="ml-2 text-sm text-gray-300">Games & Virtual Items</Label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-2">Price Range</h3>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                placeholder="Min" 
                className="bg-[#1f2937] border-[#374151] text-white"
              />
              <span className="text-gray-400">to</span>
              <Input 
                type="number" 
                placeholder="Max" 
                className="bg-[#1f2937] border-[#374151] text-white"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2 bg-[#1f2937] hover:bg-[#374151] text-white border-[#374151]"
            >
              Apply
            </Button>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-2">Auction Status</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox 
                  id="status-active" 
                  defaultChecked
                  className="border-[#374151]"
                />
                <Label htmlFor="status-active" className="ml-2 text-sm text-gray-300">Active Auctions</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="status-ending-soon" 
                  className="border-[#374151]"
                />
                <Label htmlFor="status-ending-soon" className="ml-2 text-sm text-gray-300">Ending Soon (under 10min)</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="status-completed" 
                  className="border-[#374151]"
                />
                <Label htmlFor="status-completed" className="ml-2 text-sm text-gray-300">Completed Auctions</Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
