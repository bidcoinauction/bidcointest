import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getWalletNFTs, 
  getNFTsByCollection, 
  importNFTFromMoralis,
  importWalletNFTs
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import useWallet from "@/hooks/useWallet";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Import, ExternalLink, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function NFTExplorerPage() {
  const { toast } = useToast();
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<string>("wallet");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [collectionAddress, setCollectionAddress] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [selectedNFT, setSelectedNFT] = useState<any | null>(null);

  // Query for wallet NFTs
  const { 
    data: walletNFTs = [], 
    isLoading: isLoadingWalletNFTs,
    refetch: refetchWalletNFTs
  } = useQuery({
    queryKey: ["wallet-nfts", walletAddress, selectedChain],
    queryFn: () => walletAddress ? getWalletNFTs(walletAddress, selectedChain) : Promise.resolve([]),
    enabled: false,
  });

  // Query for collection NFTs
  const { 
    data: collectionNFTs = [], 
    isLoading: isLoadingCollectionNFTs,
    refetch: refetchCollectionNFTs
  } = useQuery({
    queryKey: ["collection-nfts", collectionAddress, selectedChain],
    queryFn: () => collectionAddress ? getNFTsByCollection(collectionAddress, selectedChain) : Promise.resolve([]),
    enabled: false,
  });

  const handleSearch = () => {
    if (activeTab === "wallet") {
      if (!walletAddress) {
        toast({
          title: "Error",
          description: "Please enter a valid wallet address",
          variant: "destructive",
        });
        return;
      }
      refetchWalletNFTs();
    } else {
      if (!collectionAddress) {
        toast({
          title: "Error",
          description: "Please enter a valid collection address",
          variant: "destructive",
        });
        return;
      }
      refetchCollectionNFTs();
    }
  };

  const handleImportNFT = async (nft: any) => {
    try {
      setIsImporting(true);
      
      await importNFTFromMoralis(
        nft.token_address,
        nft.token_id,
        1, // creator ID
        selectedChain
      );
      
      toast({
        title: "Success!",
        description: `NFT ${nft.name || nft.token_id} has been imported.`,
      });
    } catch (error) {
      console.error("Error importing NFT:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportAllFromWallet = async () => {
    if (!walletAddress) {
      toast({
        title: "Error",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      
      const result = await importWalletNFTs(
        walletAddress,
        5, // limit
        1, // creator ID
        selectedChain
      );
      
      toast({
        title: "Success!",
        description: `${result.length} NFTs have been imported from wallet.`,
      });
    } catch (error) {
      console.error("Error importing wallet NFTs:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import NFTs from wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">NFT Explorer</h1>
      <p className="text-gray-500 mb-6">
        Search for NFTs by wallet or collection and import them into the platform
      </p>

      <Tabs defaultValue="wallet" onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="wallet">Search by Wallet</TabsTrigger>
          <TabsTrigger value="collection">Search by Collection</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallet" className="mt-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Enter wallet address (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1"
            />
            
            <Select
              value={selectedChain}
              onValueChange={setSelectedChain}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                <SelectItem value="avalanche">Avalanche</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} className="gap-2">
              {isLoadingWalletNFTs && <Loader2 className="h-4 w-4 animate-spin" />}
              <Search className="h-4 w-4" />
              Search
            </Button>

            {walletNFTs.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleImportAllFromWallet}
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Import className="h-4 w-4" />
                )}
                Import All
              </Button>
            )}
          </div>
          
          {address && walletAddress === "" && (
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => setWalletAddress(address)}
            >
              Use Connected Wallet
            </Button>
          )}
        </TabsContent>
        
        <TabsContent value="collection" className="mt-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Enter collection address (0x...)"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              className="flex-1"
            />
            
            <Select
              value={selectedChain}
              onValueChange={setSelectedChain}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                <SelectItem value="avalanche">Avalanche</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} className="gap-2">
              {isLoadingCollectionNFTs && <Loader2 className="h-4 w-4 animate-spin" />}
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Results section */}
      <div className="mb-8">
        {activeTab === "wallet" && (
          <>
            {isLoadingWalletNFTs ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading NFTs from wallet...</p>
              </div>
            ) : walletNFTs.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  Found {walletNFTs.length} NFTs in wallet
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {walletNFTs.map((nft: any) => (
                    <NFTCard 
                      key={`${nft.token_address}-${nft.token_id}`} 
                      nft={nft} 
                      onImport={handleImportNFT}
                      onViewDetails={() => setSelectedNFT(nft)}
                      isImporting={isImporting}
                    />
                  ))}
                </div>
              </>
            ) : walletAddress ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No NFTs found for this wallet address</p>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Enter a wallet address to search for NFTs</p>
              </div>
            )}
          </>
        )}

        {activeTab === "collection" && (
          <>
            {isLoadingCollectionNFTs ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading NFTs from collection...</p>
              </div>
            ) : collectionNFTs.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  Found {collectionNFTs.length} NFTs in collection
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {collectionNFTs.map((nft: any) => (
                    <NFTCard 
                      key={`${nft.token_address}-${nft.token_id}`} 
                      nft={nft} 
                      onImport={handleImportNFT}
                      onViewDetails={() => setSelectedNFT(nft)}
                      isImporting={isImporting}
                    />
                  ))}
                </div>
              </>
            ) : collectionAddress ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No NFTs found for this collection address</p>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Enter a collection address to search for NFTs</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* NFT Details Dialog */}
      {selectedNFT && (
        <Dialog open={!!selectedNFT} onOpenChange={(open) => !open && setSelectedNFT(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>NFT Details</DialogTitle>
              <DialogDescription>
                Complete information about this NFT
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="col-span-1">
                <img
                  src={getImageUrl(selectedNFT)}
                  alt={selectedNFT.name || `NFT #${selectedNFT.token_id}`}
                  className="w-full h-auto rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/nft_images/default_nft.png';
                  }}
                />
              </div>
              
              <div className="col-span-2">
                <h3 className="text-lg font-semibold">
                  {selectedNFT.name || `NFT #${selectedNFT.token_id}`}
                </h3>
                
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Token ID:</span>
                    <span className="text-sm font-medium">{selectedNFT.token_id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Contract:</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {selectedNFT.token_address}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Token Standard:</span>
                    <span className="text-sm font-medium">
                      {selectedNFT.contract_type || "ERC721"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Blockchain:</span>
                    <span className="text-sm font-medium capitalize">
                      {selectedChain}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600">
                    {getDescription(selectedNFT) || "No description available"}
                  </p>
                </div>
                
                {getAttributes(selectedNFT).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Attributes</h4>
                    <div className="flex flex-wrap gap-2">
                      {getAttributes(selectedNFT).map((attr: any, index: number) => (
                        <Badge key={index} variant="outline" className="py-1">
                          <span className="text-xs text-gray-500 mr-1">
                            {attr.trait_type || attr.key}:
                          </span>
                          <span className="text-xs font-medium">
                            {attr.value || attr.trait_value}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline"
                className="gap-2"
                onClick={() => window.open(
                  `https://${selectedChain === 'ethereum' ? 'opensea.io' : 
                    selectedChain === 'polygon' ? 'opensea.io/polygon' : 
                    'opensea.io'}/assets/${selectedNFT.token_address}/${selectedNFT.token_id}`,
                  '_blank'
                )}
              >
                <ExternalLink className="h-4 w-4" />
                View on OpenSea
              </Button>
              
              <Button 
                onClick={() => {
                  handleImportNFT(selectedNFT);
                  setSelectedNFT(null);
                }}
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Import className="h-4 w-4" />
                )}
                Import NFT
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Helper component for NFT cards
function NFTCard({ 
  nft, 
  onImport, 
  onViewDetails,
  isImporting
}: { 
  nft: any; 
  onImport: (nft: any) => void; 
  onViewDetails: () => void;
  isImporting: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative pb-[100%]">
          <img
            src={getImageUrl(nft)}
            alt={nft.name || `NFT #${nft.token_id}`}
            className="absolute w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/nft_images/default_nft.png';
            }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <CardTitle className="text-lg mb-1 truncate">
          {nft.name || `NFT #${nft.token_id}`}
        </CardTitle>
        <CardDescription className="truncate">
          Token ID: {nft.token_id}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          <Info className="h-4 w-4 mr-2" />
          Details
        </Button>
        
        <Button 
          size="sm" 
          onClick={() => onImport(nft)}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Import className="h-4 w-4 mr-2" />
          )}
          Import
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions to parse NFT data
function getImageUrl(nft: any): string {
  if (!nft) return '/assets/nft_images/default_nft.png';
  
  let metadata: any = {};
  try {
    if (nft.metadata) {
      metadata = typeof nft.metadata === 'string' 
        ? JSON.parse(nft.metadata) 
        : nft.metadata;
    }
  } catch (e) {
    console.error("Failed to parse NFT metadata:", e);
  }
  
  // Check various possible image fields
  if (metadata?.image) {
    let imageUrl = metadata.image;
    
    // Handle IPFS URLs
    if (imageUrl.startsWith('ipfs://')) {
      return imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return imageUrl;
  }
  
  if (metadata?.image_url) {
    return metadata.image_url;
  }
  
  // Check if NFT has a token URI that might be an image
  if (nft.token_uri && (
    nft.token_uri.endsWith('.png') || 
    nft.token_uri.endsWith('.jpg') || 
    nft.token_uri.endsWith('.jpeg') || 
    nft.token_uri.endsWith('.gif') ||
    nft.token_uri.endsWith('.svg')
  )) {
    return nft.token_uri;
  }
  
  return '/assets/nft_images/default_nft.png';
}

function getDescription(nft: any): string {
  if (!nft) return '';
  
  let metadata: any = {};
  try {
    if (nft.metadata) {
      metadata = typeof nft.metadata === 'string' 
        ? JSON.parse(nft.metadata) 
        : nft.metadata;
    }
  } catch (e) {
    console.error("Failed to parse NFT metadata:", e);
  }
  
  return metadata?.description || '';
}

function getAttributes(nft: any): any[] {
  if (!nft) return [];
  
  let metadata: any = {};
  try {
    if (nft.metadata) {
      metadata = typeof nft.metadata === 'string' 
        ? JSON.parse(nft.metadata) 
        : nft.metadata;
    }
  } catch (e) {
    console.error("Failed to parse NFT metadata:", e);
  }
  
  return metadata?.attributes || [];
}