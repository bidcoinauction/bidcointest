import { useState, useEffect } from 'react';
import { 
  NFTCollection, 
  getCollectionsByChain,
  getCollectionMetrics,
  getCollectionNFTs
} from '@/lib/unleashApi';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  formatPriceUSD, 
  formatNumber, 
  formatRarity, 
  getRarityColor, 
  getRarityLabel 
} from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Wallet, 
  Tag, 
  Users, 
  Package,
  ExternalLink,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function NFTCollectionsPage() {
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
  const [page, setPage] = useState(1);
  const limit = 8; // Collections per page
  const { toast } = useToast();

  // Fetch collections based on chain
  const { 
    data: collections, 
    isLoading: isLoadingCollections,
    refetch: refetchCollections
  } = useQuery({
    queryKey: ['/unleash/collections', selectedChain, page, limit],
    queryFn: () => getCollectionsByChain(selectedChain, page, limit)
  });

  // Fetch collection metrics when a collection is selected
  const {
    data: collectionMetrics,
    isLoading: isLoadingMetrics
  } = useQuery({
    queryKey: ['/unleash/collection/metrics', selectedCollection?.contract_address, selectedChain],
    queryFn: () => getCollectionMetrics(selectedCollection?.contract_address || '', selectedChain),
    enabled: !!selectedCollection
  });

  // Fetch collection NFTs when a collection is selected
  const {
    data: collectionNFTs,
    isLoading: isLoadingNFTs
  } = useQuery({
    queryKey: ['/unleash/collection/nfts', selectedCollection?.contract_address, selectedChain],
    queryFn: () => getCollectionNFTs(selectedCollection?.contract_address || '', selectedChain, 1, 4),
    enabled: !!selectedCollection
  });

  // When chain changes, reset page and selected collection
  useEffect(() => {
    setPage(1);
    setSelectedCollection(null);
  }, [selectedChain]);

  const handleSelectCollection = (collection: NFTCollection) => {
    setSelectedCollection(collection);
  };

  const handleChainChange = (value: string) => {
    setSelectedChain(value);
  };

  // Format metrics data for chart
  const getChartData = () => {
    if (!collectionMetrics) return [];
    
    return [
      { name: '24h', value: collectionMetrics.volume_24h || 0 },
      { name: '7d', value: collectionMetrics.volume_7d || 0 },
      { name: '30d', value: collectionMetrics.volume_30d || 0 }
    ];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">NFT Collections</h1>
          <p className="text-gray-400">Explore NFT collections and their valuations</p>
        </div>
        <div className="flex space-x-4 items-center">
          <Select value={selectedChain} onValueChange={handleChainChange}>
            <SelectTrigger className="w-[180px] bg-[#1f2937] border-[#374151]">
              <SelectValue placeholder="Select Blockchain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
              <SelectItem value="arbitrum">Arbitrum</SelectItem>
              <SelectItem value="optimism">Optimism</SelectItem>
              <SelectItem value="base">Base</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full md:w-60">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search collections" 
              className="pl-8 bg-[#1f2937] border-[#374151]" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Collections List */}
        <div className="md:col-span-1">
          <div className="bg-[#1f2937] rounded-xl border border-[#374151] overflow-hidden">
            <div className="p-4 border-b border-[#374151]">
              <h2 className="text-xl font-bold text-white">Collections</h2>
            </div>
            
            {isLoadingCollections ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#374151]">
                  {collections && collections.length > 0 ? (
                    collections.map((collection) => (
                      <div 
                        key={collection.contract_address}
                        className={`p-4 hover:bg-[#374151] cursor-pointer transition-colors duration-150 
                                  ${selectedCollection?.contract_address === collection.contract_address ? 'bg-[#374151]' : ''}`}
                        onClick={() => handleSelectCollection(collection)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#111827]">
                            {collection.image_url ? (
                              <img 
                                src={collection.image_url} 
                                alt={collection.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/100/111827/6b7280?text=NFT';
                                }} 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">NFT</div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{collection.name}</h3>
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Tag className="w-3 h-3 mr-1" />
                              <span>{collection.token_schema || 'ERC-721'}</span>
                              {collection.floor_price && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>Floor: {formatPriceUSD(collection.floor_price)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      No collections found for {selectedChain}
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                <div className="p-4 border-t border-[#374151] flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="bg-[#111827] border-[#374151] text-white hover:bg-[#374151]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!collections || collections.length < limit}
                    onClick={() => setPage(p => p + 1)}
                    className="bg-[#111827] border-[#374151] text-white hover:bg-[#374151]"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Collection Details */}
        <div className="md:col-span-2">
          {selectedCollection ? (
            <div className="bg-[#1f2937] rounded-xl border border-[#374151] overflow-hidden">
              <div className="p-6 border-b border-[#374151]">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#111827]">
                    {selectedCollection.image_url ? (
                      <img 
                        src={selectedCollection.image_url} 
                        alt={selectedCollection.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">NFT</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCollection.name}</h2>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-400 mr-2">{selectedCollection.contract_address.slice(0, 6)}...{selectedCollection.contract_address.slice(-4)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" asChild>
                        <a href={`https://${selectedChain === 'ethereum' ? '' : selectedChain + '.'}etherscan.io/address/${selectedCollection.contract_address}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
                {selectedCollection.description && (
                  <p className="mt-4 text-gray-400 text-sm">{selectedCollection.description}</p>
                )}
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="grid grid-cols-3 bg-[#111827]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="nfts">NFTs</TabsTrigger>
                    <TabsTrigger value="valuation">Valuation</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-6">
                  {isLoadingMetrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[#111827] rounded-lg p-4">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : collectionMetrics ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <Card className="bg-[#111827] border-[#374151]">
                          <CardHeader className="pb-2">
                            <CardDescription className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>Floor Price</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">{formatPriceUSD(collectionMetrics.floor_price)}</div>
                            <div className="text-sm text-gray-400 mt-1">
                              {collectionMetrics.price_change_24h > 0 ? (
                                <span className="text-green-500">+{collectionMetrics.price_change_24h.toFixed(2)}%</span>
                              ) : (
                                <span className="text-red-500">{collectionMetrics.price_change_24h.toFixed(2)}%</span>
                              )}
                              <span className="ml-1">(24h)</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#111827] border-[#374151]">
                          <CardHeader className="pb-2">
                            <CardDescription className="flex items-center space-x-1">
                              <Wallet className="w-4 h-4" />
                              <span>Market Cap</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">{formatPriceUSD(collectionMetrics.market_cap)}</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#111827] border-[#374151]">
                          <CardHeader className="pb-2">
                            <CardDescription className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>Holders</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">{formatNumber(collectionMetrics.holders_count)}</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#111827] border-[#374151]">
                          <CardHeader className="pb-2">
                            <CardDescription className="flex items-center space-x-1">
                              <Package className="w-4 h-4" />
                              <span>Items</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">{formatNumber(collectionMetrics.items_count)}</div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-xl font-bold text-white mb-4">Volume</h3>
                        <div className="bg-[#111827] p-4 rounded-lg border border-[#374151]">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={getChartData()}>
                              <XAxis dataKey="name" stroke="#6b7280" />
                              <YAxis 
                                stroke="#6b7280"
                                tickFormatter={(value) => {
                                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                                  return `$${value}`;
                                }}
                              />
                              <Tooltip 
                                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                labelStyle={{ color: '#f9fafb' }}
                              />
                              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      No metrics available for this collection
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="nfts" className="p-6">
                  {isLoadingNFTs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[#111827] rounded-lg overflow-hidden">
                          <Skeleton className="h-40 w-full" />
                          <div className="p-3">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : collectionNFTs && collectionNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {collectionNFTs.map((nft) => (
                        <div key={nft.token_id} className="bg-[#111827] rounded-lg overflow-hidden border border-[#374151] transition-transform hover:transform hover:scale-[1.02]">
                          <div className="aspect-square overflow-hidden bg-[#0d1117] relative">
                            {nft.image_url ? (
                              <img 
                                src={nft.image_url} 
                                alt={nft.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/400/111827/6b7280?text=NFT';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                            )}
                            
                            {/* Rarity badge if we have traits with rarity */}
                            {nft.traits && nft.traits.some(trait => trait.rarity !== undefined) && (
                              <div className="absolute top-2 right-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getRarityColor(
                                  // Average rarity of all traits with rarity value
                                  nft.traits
                                    .filter(trait => trait.rarity !== undefined)
                                    .reduce((sum, trait) => sum + (trait.rarity || 0), 0) / 
                                  nft.traits.filter(trait => trait.rarity !== undefined).length
                                )}`}>
                                  {getRarityLabel(
                                    nft.traits
                                      .filter(trait => trait.rarity !== undefined)
                                      .reduce((sum, trait) => sum + (trait.rarity || 0), 0) / 
                                    nft.traits.filter(trait => trait.rarity !== undefined).length
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-white truncate">{nft.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-xs text-gray-400">ID: {nft.token_id}</div>
                              {nft.estimated_price && (
                                <div className="text-sm font-medium text-primary">{formatPriceUSD(nft.estimated_price)}</div>
                              )}
                            </div>
                            
                            {/* Show traits with rarity if available */}
                            {nft.traits && nft.traits.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-[#374151]">
                                <div className="text-xs text-gray-400 mb-1">Traits:</div>
                                <div className="flex flex-wrap gap-1">
                                  {nft.traits.slice(0, 3).map((trait, index) => (
                                    <div 
                                      key={index} 
                                      className={`px-1.5 py-0.5 rounded text-xs ${trait.rarity ? 
                                        `${getRarityColor(trait.rarity)} text-white` : 
                                        'bg-[#1f2937] text-gray-300'}`}
                                      title={trait.rarity ? `Rarity: ${formatRarity(trait.rarity)}` : ''}
                                    >
                                      {trait.trait_type}: {trait.value}
                                    </div>
                                  ))}
                                  {nft.traits.length > 3 && (
                                    <div className="px-1.5 py-0.5 rounded text-xs bg-[#1f2937] text-gray-300">
                                      +{nft.traits.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      No NFTs available for this collection
                    </div>
                  )}

                  <div className="mt-4 flex justify-center">
                    <Button className="bg-primary hover:bg-primary-dark">
                      Load More
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="valuation" className="p-6">
                  <div className="bg-[#111827] rounded-lg p-6 border border-[#374151]">
                    <h3 className="text-xl font-bold text-white mb-4">NFT Valuation</h3>
                    <p className="text-gray-400 mb-6">
                      UnleashNFTs provides accurate valuations for NFTs in this collection based on historical data, 
                      market trends, and rarity analysis.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-white mb-2">Enter Token ID</h4>
                        <div className="flex space-x-2">
                          <Input className="bg-[#1f2937] border-[#374151]" placeholder="Token ID" />
                          <Button>
                            Get Valuation
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-[#1d2430] p-4 rounded-lg">
                        <h4 className="font-medium text-white mb-2">Benefits</h4>
                        <ul className="text-sm text-gray-400 space-y-2">
                          <li>• Accurate price estimations based on rarity</li>
                          <li>• Historical price trends and analysis</li>
                          <li>• Confidence scores for each valuation</li>
                          <li>• Market comparison with similar assets</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="bg-[#1f2937] rounded-xl border border-[#374151] p-8 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-[#111827] rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Select a Collection</h3>
              <p className="text-gray-400 max-w-md">
                Choose an NFT collection from the list to view detailed metrics, 
                NFTs, and valuation data powered by UnleashNFTs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}