import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, Eye, ArrowRight } from "lucide-react";
import BidPacksSection from "@/components/bidpacks/BidPacksSection";

// Define type interfaces
interface Ordinal {
  id: string;
  name: string;
  imageUrl: string;
  blockchain: string;
  tokenStandard: string;
  tokenId: string;
  creator: {
    username: string;
  };
}

interface ApiResponse {
  nfts: Ordinal[];
}

export default function OrdinalsPage() {
  const [blockchain, setBlockchain] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  const { data: nfts, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["/api/nfts"],
    queryFn: () => fetch("/api/nfts").then(res => res.json()),
  });
  
  // Filter NFTs to only show Bitcoin Ordinals
  const ordinals = nfts?.nfts?.filter((nft: Ordinal) => 
    nft.blockchain === "BTC Ordinal" || 
    nft.blockchain === "BTC" || 
    nft.tokenStandard === "Ordinal"
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="md:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Bitcoin Ordinals</h1>
            <p className="text-gray-400 max-w-2xl">Discover unique digital artifacts inscribed on satoshis, the native NFTs of Bitcoin.</p>
          </div>
            
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <Select value={blockchain} onValueChange={setBlockchain}>
              <SelectTrigger className="w-[180px] bg-[#1f2937] text-white border-[#374151]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-[#1f2937] text-white border-[#374151]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
                <SelectItem value="inscription">Inscription Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-[#1f2937] border-b border-[#374151] mb-6 w-full justify-start rounded-none h-auto py-1 px-0">
            <TabsTrigger value="all" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              All Ordinals
            </TabsTrigger>
            <TabsTrigger value="collections" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Collections
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="creators" className="px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Creators
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-[#1f2937] rounded-xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-[#374151]"></div>
                    <div className="p-4">
                      <div className="h-5 bg-[#374151] rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-[#374151] rounded w-1/2 mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-8 w-20 bg-[#374151] rounded"></div>
                        <div className="h-8 w-20 bg-[#374151] rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                <p className="text-white mb-2">Failed to load ordinals</p>
                <p className="text-gray-400">Please try again later</p>
              </div>
            ) : ordinals && ordinals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ordinals.map((ordinal: Ordinal) => (
                  <div key={ordinal.id} className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151] hover:shadow-glow transition-shadow duration-300">
                    <div className="relative">
                      <img 
                        src={ordinal.imageUrl} 
                        alt={ordinal.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-primary/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                          #{ordinal.tokenId}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-bold text-white text-lg mb-1">{ordinal.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">By @{ordinal.creator.username}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                            <ThumbsUp className="h-4 w-4 mr-1" /> 24
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                            <Eye className="h-4 w-4 mr-1" /> 156
                          </Button>
                        </div>
                        <span className="text-primary text-sm font-medium flex items-center cursor-pointer hover:text-primary-light">
                          View <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1f2937] rounded-xl p-8 text-center">
                <p className="text-white mb-2">No ordinals found</p>
                <p className="text-gray-400">Try adjusting your filters</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="collections">
            <div className="bg-[#1f2937] p-6 rounded-xl text-center">
              <h3 className="text-xl font-display font-bold text-white mb-3">Ordinal Collections</h3>
              <p className="text-gray-400 mb-4">Browse curated collections of Bitcoin Ordinals.</p>
              <Button className="bg-primary hover:bg-primary-dark text-white">Explore Collections</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="marketplace">
            <div className="bg-[#1f2937] p-6 rounded-xl text-center">
              <h3 className="text-xl font-display font-bold text-white mb-3">Ordinal Marketplace</h3>
              <p className="text-gray-400 mb-4">Buy and sell Bitcoin Ordinals securely on our marketplace.</p>
              <Button className="bg-primary hover:bg-primary-dark text-white">Visit Marketplace</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="creators">
            <div className="bg-[#1f2937] p-6 rounded-xl text-center">
              <h3 className="text-xl font-display font-bold text-white mb-3">Ordinal Creators</h3>
              <p className="text-gray-400 mb-4">Discover the artists and creators behind popular Ordinals.</p>
              <Button className="bg-primary hover:bg-primary-dark text-white">View Creators</Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
      
      <section className="mb-12">
        <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
          <h2 className="text-2xl font-display font-bold text-white mb-4">What are Bitcoin Ordinals?</h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Bitcoin Ordinals are digital artifacts inscribed on satoshis, the smallest unit of Bitcoin. Unlike traditional NFTs that store metadata off-chain, Ordinals store all data directly on the Bitcoin blockchain.
            </p>
            <p>
              Each ordinal is unique and can contain various types of content, including images, text, audio, video, and more. They're secured by Bitcoin's robust network and have true digital scarcity.
            </p>
            <h3 className="text-lg font-display font-bold text-white mt-6 mb-2">Key Features:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>On-chain data storage</li>
              <li>Verifiable scarcity</li>
              <li>Permanent and immutable</li>
              <li>Direct Bitcoin integration</li>
              <li>No third-party dependencies</li>
            </ul>
          </div>
        </div>
      </section>
      
      <BidPacksSection />
    </div>
  );
}
