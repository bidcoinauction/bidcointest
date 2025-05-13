import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Flame, TrendingUp, DollarSign, Clock } from "lucide-react";
import { SiEthereum, SiBitcoin, SiPolygon, SiSolana } from "react-icons/si";

// Collection type definition
interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  bannerUrl: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  blockchain: string;
  floorPrice: number;
  volume24h: number;
  volumeTotal: number;
  items: number;
  owners: number;
  verified: boolean;
  trending: boolean;
  featured: boolean;
}

// Mock up collections data using local placeholder images
const mockCollections: Collection[] = [
  {
    id: "1",
    name: "Bored Ape Yacht Club",
    description: "A collection of 10,000 unique Bored Ape NFTs",
    imageUrl: "https://via.placeholder.com/500x300/171717/FFFFFF?text=Bored+Ape+Yacht+Club",
    bannerUrl: "https://via.placeholder.com/1200x300/171717/FFFFFF?text=BAYC+Banner",
    creator: {
      name: "Yuga Labs",
      avatar: "https://via.placeholder.com/100/334155/FFFFFF?text=YL",
      verified: true
    },
    blockchain: "ethereum",
    floorPrice: 30.5,
    volume24h: 157.2,
    volumeTotal: 32560,
    items: 10000,
    owners: 6452,
    verified: true,
    trending: true,
    featured: true
  },
  {
    id: "2",
    name: "Azuki",
    description: "A collection of 10,000 avatars that give you membership access to The Garden",
    imageUrl: "https://via.placeholder.com/500x300/171717/FF6B6B?text=Azuki",
    bannerUrl: "https://via.placeholder.com/1200x300/171717/FF6B6B?text=Azuki+Banner",
    creator: {
      name: "Chiru Labs",
      avatar: "https://via.placeholder.com/100/334155/FF6B6B?text=CL",
      verified: true
    },
    blockchain: "ethereum",
    floorPrice: 14.2,
    volume24h: 89.6,
    volumeTotal: 24150,
    items: 10000,
    owners: 5721,
    verified: true,
    trending: true,
    featured: true
  },
  {
    id: "3",
    name: "Doodles",
    description: "A community-driven collectibles project featuring art by Burnt Toast",
    imageUrl: "https://via.placeholder.com/500x300/171717/FFD166?text=Doodles",
    bannerUrl: "https://via.placeholder.com/1200x300/171717/FFD166?text=Doodles+Banner",
    creator: {
      name: "Doodles",
      avatar: "https://via.placeholder.com/100/334155/FFD166?text=D",
      verified: true
    },
    blockchain: "ethereum",
    floorPrice: 8.7,
    volume24h: 42.3,
    volumeTotal: 16780,
    items: 10000,
    owners: 4891,
    verified: true,
    trending: true,
    featured: false
  },
  {
    id: "4",
    name: "Bitcoin Punks",
    description: "Bitcoin Punks are the first BTC NFT collection on the BTC chain",
    imageUrl: "https://via.placeholder.com/500x300/171717/F7931A?text=Bitcoin+Punks",
    bannerUrl: "https://via.placeholder.com/1200x300/171717/F7931A?text=BTC+Punks+Banner",
    creator: {
      name: "Bitcoin Punks",
      avatar: "https://via.placeholder.com/100/334155/F7931A?text=BP",
      verified: true
    },
    blockchain: "bitcoin",
    floorPrice: 0.38,
    volume24h: 17.5,
    volumeTotal: 8460,
    items: 10000,
    owners: 3240,
    verified: true,
    trending: true,
    featured: true
  },
  {
    id: "5",
    name: "DeGods",
    description: "A deflationary collection of degenerates, punks, and misfits",
    imageUrl: "https://via.placeholder.com/500x300/171717/00FFBD?text=DeGods",
    bannerUrl: "https://via.placeholder.com/1200x300/171717/00FFBD?text=DeGods+Banner",
    creator: {
      name: "DeGods",
      avatar: "https://via.placeholder.com/100/334155/00FFBD?text=DG",
      verified: true
    },
    blockchain: "solana",
    floorPrice: 340.5,
    volume24h: 27820,
    volumeTotal: 412500,
    items: 10000,
    owners: 5623,
    verified: true,
    trending: true,
    featured: false
  },
  {
    id: "6",
    name: "Moonbirds",
    description: "A collection of 10,000 utility-enabled PFPs that feature a unique and diverse pool of traits",
    imageUrl: "https://via.placeholder.com/500x300/171717/8247E5?text=Moonbirds",
    bannerUrl: "https://via.placeholder.com/1200x300/171717/8247E5?text=Moonbirds+Banner",
    creator: {
      name: "PROOF",
      avatar: "https://via.placeholder.com/100/334155/8247E5?text=P",
      verified: true
    },
    blockchain: "ethereum",
    floorPrice: 6.8,
    volume24h: 34.2,
    volumeTotal: 15430,
    items: 10000,
    owners: 4628,
    verified: true,
    trending: false,
    featured: true
  }
];

// Blockchain icon mapping
const BlockchainIcon = ({ blockchain }: { blockchain: string }) => {
  switch (blockchain.toLowerCase()) {
    case 'ethereum':
      return <SiEthereum className="text-[#627eea]" />;
    case 'bitcoin':
      return <SiBitcoin className="text-[#f7931a]" />;
    case 'polygon':
      return <SiPolygon className="text-[#8247e5]" />;
    case 'solana':
      return <SiSolana className="text-[#00ffbd]" />;
    default:
      return <SiEthereum className="text-[#627eea]" />;
  }
};

// Function to get currency symbol
const getCurrencySymbol = (blockchain: string): string => {
  switch (blockchain.toLowerCase()) {
    case 'ethereum':
      return 'ETH';
    case 'bitcoin':
      return 'BTC';
    case 'polygon':
      return 'MATIC';
    case 'solana':
      return 'SOL';
    default:
      return 'ETH';
  }
};

// Collection card component
const CollectionCard = ({ collection }: { collection: Collection }) => {
  const currencySymbol = getCurrencySymbol(collection.blockchain);
  const [_, setLocation] = useLocation();
  
  // Generate random active auctions count between 3-15
  const activeAuctions = Math.floor(Math.random() * 12) + 3;
  
  // Random time remaining for most auctions (in minutes)
  const avgTimeRemaining = Math.floor(Math.random() * 480) + 30; // 30 min to 8 hours
  
  // Get countdown timer display
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const handleViewCollection = () => {
    // Here we would navigate to the collection detail page
    // For now, we'll simulate going to auctions page as if we're filtering by this collection
    setLocation(`/auctions?collection=${collection.id}`);
  };
  
  return (
    <Card className="bg-[#1f2937] border-[#374151] overflow-hidden hover:shadow-glow transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={collection.imageUrl}
          alt={collection.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent"></div>
        
        {collection.trending && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black">
            <Flame className="h-3.5 w-3.5 mr-1" />
            Trending
          </Badge>
        )}
        
        <div className="absolute bottom-3 left-3 flex items-center">
          <img 
            src={collection.creator.avatar}
            alt={collection.creator.name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div className="ml-2">
            <div className="text-white font-bold text-lg">{collection.name}</div>
            <div className="text-gray-300 text-xs flex items-center">
              by {collection.creator.name}
              {collection.creator.verified && (
                <span className="ml-1 text-blue-400 bg-blue-400/20 rounded-full p-0.5">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-4 pb-2">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Floor Price</p>
            <p className="text-white font-bold flex items-center">
              <span className="mr-1"><BlockchainIcon blockchain={collection.blockchain} /></span>
              {collection.floorPrice} {currencySymbol}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">24h Volume</p>
            <p className="text-white font-bold flex items-center">
              <span className="mr-1"><BlockchainIcon blockchain={collection.blockchain} /></span>
              {collection.volume24h} {currencySymbol}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Active Auctions</p>
            <div className="flex items-center">
              <p className="text-white font-bold">{activeAuctions}</p>
              <Badge className="ml-2 bg-primary/20 text-primary text-xs px-2 py-0.5">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(avgTimeRemaining)}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Total Items</p>
            <p className="text-white font-bold">{collection.items.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 pb-4 flex gap-2">
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={handleViewCollection}
        >
          View Auctions
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 bg-transparent border-primary text-primary hover:bg-primary/10"
        >
          Explore NFTs
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function NFTCollectionsPage() {
  const [blockchain, setBlockchain] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [activeTab, setActiveTab] = useState("all");
  
  // Mock blockchain data for filtering
  const blockchains = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "polygon", name: "Polygon", symbol: "MATIC" }
  ];
  
  const isLoadingBlockchains = false;

  // Filter collections by selected blockchain
  const filteredByBlockchain = blockchain === "all" 
    ? mockCollections 
    : mockCollections.filter(c => c.blockchain.toLowerCase() === blockchain.toLowerCase());
    
  // Set up collections with mock data
  const collections = filteredByBlockchain;
  const isLoadingCollections = false;
  const error = null;

  // Filter collections based on tab
  const filteredCollections = collections?.filter(collection => {
    if (activeTab === "all") return true;
    if (activeTab === "trending") return collection.trending;
    if (activeTab === "featured") return collection.featured;
    return true;
  });

  // Sort collections based on selected sort option
  const sortedCollections = [...(filteredCollections || [])].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      case "volume":
        return b.volume24h - a.volume24h;
      case "floor-asc":
        return a.floorPrice - b.floorPrice;
      case "floor-desc":
        return b.floorPrice - a.floorPrice;
      default:
        return 0;
    }
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">NFT Collections</h1>
          <p className="text-gray-400">Explore the latest and most popular NFT collections across multiple blockchains</p>
        </div>
        
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList className="bg-[#1f2937] border border-[#374151]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center">
                <Flame className="h-4 w-4 mr-1" /> Trending
              </TabsTrigger>
              <TabsTrigger value="featured" className="flex items-center">
                <Sparkles className="h-4 w-4 mr-1" /> Featured
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-wrap gap-3">
            <Select value={blockchain} onValueChange={setBlockchain}>
              <SelectTrigger className="w-[180px] bg-[#1f2937] text-white border-[#374151]">
                <SelectValue placeholder="All Blockchains" />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                <SelectItem value="all">All Blockchains</SelectItem>
                <SelectItem value="ethereum" className="flex items-center gap-2">
                  <SiEthereum className="text-[#627eea]" /> Ethereum
                </SelectItem>
                <SelectItem value="bitcoin" className="flex items-center gap-2">
                  <SiBitcoin className="text-[#f7931a]" /> Bitcoin
                </SelectItem>
                <SelectItem value="solana" className="flex items-center gap-2">
                  <SiSolana className="text-[#00ffbd]" /> Solana
                </SelectItem>
                <SelectItem value="polygon" className="flex items-center gap-2">
                  <SiPolygon className="text-[#8247e5]" /> Polygon
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-[#1f2937] text-white border-[#374151]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] text-white border-[#374151]">
                <SelectItem value="trending" className="flex items-center gap-2">
                  <Flame className="h-4 w-4" /> Trending
                </SelectItem>
                <SelectItem value="volume" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Volume (24h)
                </SelectItem>
                <SelectItem value="floor-asc" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Floor Price (Low to High)
                </SelectItem>
                <SelectItem value="floor-desc" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Floor Price (High to Low)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoadingCollections ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-[#1f2937] border-[#374151]">
                <div className="h-48 bg-[#374151]"></div>
                <CardContent className="pt-4 pb-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-10 w-10 rounded-full bg-[#374151]"></div>
                    <div>
                      <div className="h-4 w-32 bg-[#374151] rounded mb-2"></div>
                      <div className="h-3 w-24 bg-[#374151] rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="h-3 w-16 bg-[#374151] rounded mb-2"></div>
                      <div className="h-4 w-20 bg-[#374151] rounded"></div>
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-[#374151] rounded mb-2"></div>
                      <div className="h-4 w-20 bg-[#374151] rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 w-12 bg-[#374151] rounded mb-2"></div>
                      <div className="h-4 w-16 bg-[#374151] rounded"></div>
                    </div>
                    <div>
                      <div className="h-3 w-12 bg-[#374151] rounded mb-2"></div>
                      <div className="h-4 w-16 bg-[#374151] rounded"></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4">
                  <div className="h-9 w-full bg-[#374151] rounded"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-[#1f2937] rounded-xl p-8 text-center">
            <p className="text-white mb-2">Failed to load NFT collections</p>
            <p className="text-gray-400">Please try again later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCollections?.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
