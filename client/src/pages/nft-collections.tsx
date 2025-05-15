import { useState, useEffect } from 'react';
import { 
  NFTCollection, 
  getCollectionsByChain,
  getCollectionsByBlockchain,
  getCollectionMetrics,
  getCollectionNFTs,
  getNFTValuation,
  getNFTDetailedMetadata,
  testApiConnection,
  getApiStatus
} from '@/lib/unleashApi';
import { ApiKeyModal } from '@/components/modals/ApiKeyModal';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  formatNumber, 
  formatRarity, 
  getRarityColor, 
  getRarityLabel 
} from '@/lib/utils';
import {
  formatPriceUSD,
  formatPriceNative
} from '@/lib/api';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Wallet, 
  Tag, 
  Users, 
  Package,
  ExternalLink,
  Search,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function NFTCollectionsPage() {
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
  const [page, setPage] = useState(1);
  const [tokenIdInput, setTokenIdInput] = useState<string>('');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [apiTestInProgress, setApiTestInProgress] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{success: boolean, message: string, details?: any} | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const limit = 8; // Collections per page
  const { toast } = useToast();

  // State for currency display preference
  const [currencyDisplay, setCurrencyDisplay] = useState<'native' | 'usd'>('native');
  
  // Fetch collections based on chain with native currency support
  const { 
    data: collections, 
    isLoading: isLoadingCollections,
    refetch: refetchCollections,
    error: collectionsError,
    isError: isCollectionsError
  } = useQuery({
    queryKey: ['/unleash/collections-by-chain', selectedChain, currencyDisplay, page, limit],
    queryFn: () => getCollectionsByBlockchain(selectedChain, currencyDisplay, page, limit),
    retry: 1 // Only retry once before showing error state
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

  // Fetch NFT valuation if a specific token ID is selected
  const {
    data: nftValuation,
    isLoading: isLoadingValuation
  } = useQuery({
    queryKey: ['/unleash/nft/valuation', selectedCollection?.contract_address, selectedTokenId, selectedChain],
    queryFn: () => getNFTValuation(selectedCollection?.contract_address || '', selectedTokenId || '', selectedChain),
    enabled: !!selectedCollection && !!selectedTokenId,
  });

  // Fetch detailed NFT metadata when a token is selected for valuation
  const {
    data: nftDetailedMetadata,
    isLoading: isLoadingNftMetadata
  } = useQuery({
    queryKey: ['/unleash/nft/metadata', selectedCollection?.contract_address, selectedTokenId, selectedChain],
    queryFn: () => getNFTDetailedMetadata(selectedCollection?.contract_address || '', selectedTokenId || '', selectedChain),
    enabled: !!selectedCollection && !!selectedTokenId,
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
  
  const handleGetValuation = () => {
    if (!tokenIdInput || !selectedCollection) {
      toast({
        title: "Missing information",
        description: "Please enter a token ID to get valuation",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedTokenId(tokenIdInput);
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
          
          {/* API Status Indicator */}
          <div className="flex items-center mt-2">
            <span 
              className={`w-2 h-2 rounded-full mr-2 ${isCollectionsError ? 'bg-red-500' : (collections && collections.length > 0) ? 'bg-green-500' : 'bg-yellow-500'}`}
            ></span>
            <span className="text-xs text-gray-400">
              {isCollectionsError ? 'API Error' : (collections && collections.length > 0) ? 'API Connected' : 'Waiting for API connection'}
            </span>
            <Button
              onClick={() => {
                const testApiConnectionAsync = async () => {
                  try {
                    setApiTestInProgress(true);
                    toast({
                      title: "Testing API Connection",
                      description: "Connecting to UnleashNFTs API...",
                    });
                    const result = await testApiConnection();
                    setApiTestResult(result);
                    
                    if (result.success) {
                      toast({
                        title: "API Connection Successful",
                        description: "Successfully connected to the UnleashNFTs API.",
                      });
                      refetchCollections();
                    } else {
                      toast({
                        title: "API Connection Failed",
                        description: result.message,
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "API Test Error",
                      description: error instanceof Error ? error.message : "Unknown error",
                      variant: "destructive"
                    });
                  } finally {
                    setApiTestInProgress(false);
                  }
                };
                
                testApiConnectionAsync();
              }}
              size="sm"
              variant="ghost"
              disabled={apiTestInProgress}
              className="text-xs ml-2 h-6 px-2 text-gray-400 hover:text-white"
            >
              {apiTestInProgress ? 'Testing...' : 'Test API'}
            </Button>
          </div>
        </div>
        <div className="flex space-x-4 items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-gray-400 hover:text-white"
            onClick={() => setIsApiKeyModalOpen(true)}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">API Settings</span>
          </Button>
          
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
                  ) : isCollectionsError ? (
                    <div className="p-6 text-center">
                      <div className="bg-[#1d2430] p-4 rounded-md border border-[#374151] mx-auto max-w-md">
                        <div className="mb-3 bg-[#111827] rounded-full h-10 w-10 flex items-center justify-center mx-auto">
                          <Search className="h-5 w-5 text-red-400" />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-2">API Connection Issue</h3>
                        <p className="text-gray-400 mb-3 text-sm">
                          We're unable to connect to the UnleashNFTs API. This is likely due to an invalid or expired API key.
                        </p>
                        {collectionsError instanceof Error && (
                          <div className="bg-red-900/20 border border-red-900/50 rounded p-2 mb-3">
                            <p className="text-red-400 text-xs">
                              {collectionsError.message.includes('API key') 
                                ? 'Authentication error: Invalid API key' 
                                : collectionsError.message}
                            </p>
                          </div>
                        )}
                        <p className="text-gray-400 text-xs mb-2">
                          Please register at <a href="https://unleashnfts.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">unleashnfts.com</a> to 
                          obtain a valid API key, then ask your administrator to update the environment variable.
                        </p>
                        <div className="flex space-x-2 justify-center">
                          <Button 
                            onClick={() => refetchCollections()}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          >
                            Try Again
                          </Button>
                          <Button
                            onClick={() => {
                              const testApiConnectionAsync = async () => {
                                try {
                                  setApiTestInProgress(true);
                                  const result = await testApiConnection();
                                  setApiTestResult(result);
                                  
                                  if (result.success) {
                                    toast({
                                      title: "API Connection Successful",
                                      description: "Successfully connected to the UnleashNFTs API.",
                                    });
                                    refetchCollections();
                                  } else {
                                    toast({
                                      title: "API Connection Failed",
                                      description: result.message,
                                      variant: "destructive"
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "API Test Error",
                                    description: error instanceof Error ? error.message : "Unknown error",
                                    variant: "destructive"
                                  });
                                } finally {
                                  setApiTestInProgress(false);
                                }
                              };
                              
                              testApiConnectionAsync();
                            }}
                            size="sm"
                            disabled={apiTestInProgress}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                          >
                            {apiTestInProgress ? 'Testing...' : 'Test Connection'}
                          </Button>
                          <Button
                            onClick={() => window.open('https://unleashnfts.com', '_blank')}
                            size="sm"
                            className="bg-transparent border border-indigo-600 text-indigo-400 hover:bg-indigo-950 text-xs"
                          >
                            Get API Key
                          </Button>
                        </div>
                        
                        {apiTestResult && (
                          <div className={`mt-4 p-2 rounded text-xs ${apiTestResult.success ? 'bg-green-900/20 border border-green-900/50' : 'bg-red-900/20 border border-red-900/50'}`}>
                            <p className={apiTestResult.success ? 'text-green-400' : 'text-red-400'}>
                              {apiTestResult.message}
                            </p>
                            {apiTestResult.details?.suggestion && (
                              <p className="text-gray-400 mt-1">
                                Suggestion: {apiTestResult.details.suggestion}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="bg-[#1d2430] p-4 rounded-md border border-[#374151] mx-auto max-w-md">
                        <div className="mb-3 bg-[#111827] rounded-full h-10 w-10 flex items-center justify-center mx-auto">
                          <Search className="h-5 w-5 text-indigo-400" />
                        </div>
                        <h3 className="text-white text-lg font-medium mb-2">No Collections Found</h3>
                        <p className="text-gray-400 mb-3 text-sm">
                          No NFT collections were found for this blockchain. Try selecting a different blockchain or try again later.
                        </p>
                        <Button 
                          onClick={() => refetchCollections()}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                        >
                          Try Again
                        </Button>
                      </div>
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
                        <h3 className="text-lg font-medium text-white mb-4">Trading Volume</h3>
                        <div className="bg-[#111827] p-4 rounded-lg h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getChartData()}>
                              <XAxis dataKey="name" stroke="#6b7280" />
                              <YAxis 
                                stroke="#6b7280"
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                              />
                              <Tooltip 
                                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Volume']}
                                contentStyle={{ 
                                  backgroundColor: '#1f2937', 
                                  borderColor: '#374151',
                                  color: 'white'
                                }}
                              />
                              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#1d2430] p-6 rounded-lg border border-[#374151] text-center max-w-md mx-auto">
                      <div className="mb-4 bg-[#111827] rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                        <TrendingUp className="h-6 w-6 text-indigo-400" />
                      </div>
                      <h3 className="text-white text-lg font-medium mb-2">Collection Metrics Unavailable</h3>
                      <p className="text-gray-400 mb-4">
                        We're currently unable to retrieve metrics for this collection due to an API connection issue.
                      </p>
                      <Button 
                        onClick={() => refetchCollections()}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Refresh Data
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="nfts" className="p-6">
                  {isLoadingNFTs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[#111827] rounded-lg overflow-hidden">
                          <Skeleton className="h-40 w-full" />
                          <div className="p-3">
                            <Skeleton className="h-5 w-20 mb-2" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : collectionNFTs && collectionNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {collectionNFTs.map((nft, index) => (
                        <div key={index} className="bg-[#111827] rounded-lg overflow-hidden border border-[#374151]">
                          <div className="relative pt-[100%]">
                            <img 
                              src={nft.image_url} 
                              alt={nft.name} 
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400/111827/6b7280?text=NFT';
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-white text-sm truncate">{nft.name}</h3>
                                <p className="text-gray-400 text-xs mt-1">#{nft.token_id}</p>
                              </div>
                              {nft.last_sale_price && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-400">Last Sale</p>
                                  <p className="text-sm font-medium text-white">{formatPriceUSD(nft.last_sale_price)}</p>
                                </div>
                              )}
                            </div>
                            
                            {nft.traits && nft.traits.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2">Traits</p>
                                <div className="flex flex-wrap gap-1">
                                  {nft.traits.slice(0, 3).map((trait, i) => (
                                    <div 
                                      key={i} 
                                      className="px-2 py-1 rounded-md text-xs"
                                      style={{ backgroundColor: getRarityColor(trait.rarity || 0) }}
                                    >
                                      <span className="text-white">{trait.trait_type}: {trait.value}</span>
                                      {trait.rarity && (
                                        <span className="ml-1 text-white opacity-80">{formatRarity(trait.rarity)}</span>
                                      )}
                                    </div>
                                  ))}
                                  {nft.traits.length > 3 && (
                                    <div className="px-2 py-1 bg-[#1f2937] rounded-md text-xs text-gray-400">
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
                    <div className="text-center py-8 text-gray-400">
                      No NFTs available for this collection
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="valuation" className="p-6">
                  <div className="bg-[#111827] rounded-lg p-6 border border-[#374151]">
                    <h3 className="text-xl font-bold text-white mb-4">NFT Valuation</h3>
                    <p className="text-gray-400 mb-6">
                      UnleashNFTs provides accurate valuations for NFTs in this collection based on historical data, 
                      market trends, and rarity analysis.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-white mb-2">Enter Token ID</h4>
                        <div className="flex space-x-2 mb-4">
                          <Input
                            type="text"
                            placeholder="e.g. 1234"
                            value={tokenIdInput}
                            onChange={(e) => setTokenIdInput(e.target.value)}
                            className="bg-[#1f2937] border-[#374151]"
                          />
                          <Button 
                            onClick={handleGetValuation}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Get Valuation
                          </Button>
                        </div>
                        
                        {isLoadingValuation || isLoadingNftMetadata ? (
                          <div className="bg-[#1d2430] p-4 rounded-lg space-y-4">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : nftValuation ? (
                          <div className="bg-[#1d2430] p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium text-white">Valuation Result</h4>
                              <div className="text-xs px-2 py-1 rounded-md bg-indigo-900 text-indigo-100">
                                Token #{selectedTokenId}
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <p className="text-gray-400 text-sm">Estimated Value</p>
                                <p className="text-2xl font-bold text-white">{formatPriceUSD(nftValuation.estimated_value)}</p>
                              </div>
                              
                              <div className="flex space-x-4">
                                <div>
                                  <p className="text-gray-400 text-sm">Floor Price</p>
                                  <p className="text-md font-medium text-white">{formatPriceUSD(nftValuation.floor_price)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Premium</p>
                                  <p className={`text-md font-medium ${nftValuation.premium_percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {nftValuation.premium_percentage > 0 ? '+' : ''}{nftValuation.premium_percentage.toFixed(2)}%
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-gray-400 text-sm">Confidence Score</p>
                                <div className="w-full bg-[#111827] rounded-full h-2 mt-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{ width: `${nftValuation.confidence_score}%` }}
                                  ></div>
                                </div>
                                <p className="text-right text-xs text-gray-400 mt-1">
                                  {nftValuation.confidence_score}% confidence
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#1d2430] p-4 rounded-lg text-center">
                            <p className="text-white mb-2">No valuation data available for this NFT</p>
                            <p className="text-gray-400">Try a different token ID or collection</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-white mb-2">NFT Details</h4>
                        {isLoadingNftMetadata ? (
                          <div className="bg-[#1d2430] p-4 rounded-lg">
                            <Skeleton className="h-40 w-full mb-4" />
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : nftDetailedMetadata ? (
                          <div className="bg-[#1d2430] p-4 rounded-lg">
                            <img 
                              src={nftDetailedMetadata.image_url} 
                              alt={nftDetailedMetadata.name}
                              className="w-full h-40 object-cover rounded-md mb-4" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400/111827/6b7280?text=NFT';
                              }}
                            />
                            <h4 className="font-medium text-white">{nftDetailedMetadata.name}</h4>
                            <p className="text-sm text-gray-400 mt-1 mb-3">{nftDetailedMetadata.description}</p>
                            
                            {nftDetailedMetadata.traits && nftDetailedMetadata.traits.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-white mb-2">Traits</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {nftDetailedMetadata.traits.map((trait, i) => (
                                    <div key={i} className="bg-[#111827] p-2 rounded-md">
                                      <p className="text-xs text-gray-400">{trait.trait_type}</p>
                                      <p className="text-sm text-white">{trait.value}</p>
                                      {trait.rarity && (
                                        <div 
                                          className="mt-1 px-2 py-0.5 rounded text-xs inline-block" 
                                          style={{ backgroundColor: getRarityColor(trait.rarity) }}
                                        >
                                          {getRarityLabel(trait.rarity)} ({formatRarity(trait.rarity)})
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#1d2430] p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Benefits</h4>
                            <ul className="text-sm text-gray-400 space-y-2">
                              <li>• Accurate price estimations based on rarity</li>
                              <li>• Historical price trends and analysis</li>
                              <li>• Confidence scores for each valuation</li>
                              <li>• Market comparison with similar assets</li>
                            </ul>
                          </div>
                        )}
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
                Choose an NFT collection from the list to view detailed metrics, NFTs, and valuations.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* API Key Modal */}
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onSuccess={() => {
          setIsApiKeyModalOpen(false);
          refetchCollections();
        }} 
      />
    </div>
  );
}