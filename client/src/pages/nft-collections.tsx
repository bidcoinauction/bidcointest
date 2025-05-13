import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { getNFTs } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NFTCollectionsPage() {
  const { data: nfts, isLoading, error } = useQuery({
    queryKey: ["/api/nfts"],
    queryFn: getNFTs,
  });

  return (
    <>
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-3xl font-display font-bold text-white">NFT Collections</h1>
            
            <div className="flex flex-wrap gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] bg-[#1f2937] text-white border-[#374151]">
                  <SelectValue placeholder="All Blockchains" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                  <SelectItem value="all">All Blockchains</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="bitcoin">Bitcoin</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="trending">
                <SelectTrigger className="w-[180px] bg-[#1f2937] text-white border-[#374151]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="volume">Highest Volume</SelectItem>
                  <SelectItem value="floor">Floor Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#1f2937] rounded-xl overflow-hidden">
                  <div className="h-40 bg-[#374151]"></div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-full bg-[#374151]"></div>
                      <div className="h-6 w-24 bg-[#374151] rounded"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-[#374151] rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-[#374151] rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 bg-[#374151] rounded"></div>
                      <div className="h-12 bg-[#374151] rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-[#1f2937] rounded-xl p-8 text-center">
              <p className="text-white mb-2">Failed to load NFT collections</p>
              <p className="text-gray-400">Please try again later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts?.map((nft) => (
                <div key={nft.id} className="bg-[#1f2937] rounded-xl overflow-hidden border border-[#374151] hover:shadow-glow transition-shadow duration-300">
                  <div className="h-40 relative">
                    <img 
                      src={nft.imageUrl} 
                      alt={nft.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                      <div className="text-white font-bold">{nft.collection}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary">
                        <img 
                          src={nft.creator.avatar} 
                          alt={`${nft.creator.username} avatar`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="bg-[#111827] px-3 py-1 rounded-lg text-xs font-mono text-primary">
                        {nft.blockchain}
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-white text-lg mb-1">{nft.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">By @{nft.creator.username}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#111827] p-2 rounded-lg">
                        <p className="text-gray-400 text-xs mb-1">Floor Price</p>
                        <p className="text-white font-bold">{nft.floorPrice} {nft.currency}</p>
                      </div>
                      <div className="bg-[#111827] p-2 rounded-lg">
                        <p className="text-gray-400 text-xs mb-1">Items</p>
                        <p className="text-white font-bold">{nft.items}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </>
  );
}
