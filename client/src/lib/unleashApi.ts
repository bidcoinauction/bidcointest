import { fetchFromAPI } from './api';

// Types exported from server/unleashNftsService.ts
export interface NFTCollection {
  contract_address: string;
  name: string;
  image_url: string;
  token_schema: string;
  chain: string;
  description?: string;
  floor_price?: number;
  volume_24h?: number;
  market_cap?: number;
  holders_count?: number;
  items_count?: number;
}

export interface NFTCollectionMetrics {
  total_volume: number;
  floor_price: number;
  market_cap: number;
  holders_count: number;
  items_count: number;
  sales_count: number;
  volume_24h: number;
  price_change_24h: number;
  volume_7d: number;
  price_change_7d: number;
  volume_30d: number;
  price_change_30d: number;
}

export interface NFTMetadata {
  token_id: string;
  name: string;
  description: string;
  image_url: string;
  traits: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  last_sale_price?: number;
  estimated_price?: number;
}

export interface NFTValuation {
  token_id: string;
  collection_address: string;
  estimated_price: number;
  confidence_score: number;
  last_sale_price?: number;
  last_sale_date?: string;
}

/**
 * Helper function for API status tracking and error handling
 */
let apiStatus = {
  isWorking: false,
  lastError: null as Error | null,
  lastSuccessfulCall: null as Date | null,
  connectionTested: false
};

/**
 * Check if the UnleashNFTs API is operational
 */
export const getApiStatus = () => apiStatus;

/**
 * Test the API connection by making a simple request
 */
export const testApiConnection = async (): Promise<{success: boolean, message: string, details?: any}> => {
  try {
    // Try to get a single blockchain to test connection
    const blockchains = await fetchFromAPI<any[]>('/unleash/blockchains?limit=1');
    
    if (blockchains && blockchains.length > 0) {
      apiStatus.isWorking = true;
      apiStatus.lastSuccessfulCall = new Date();
      apiStatus.connectionTested = true;
      apiStatus.lastError = null;
      return {
        success: true, 
        message: 'Connection successful', 
        details: {
          blockchains: blockchains.length,
          firstBlockchain: blockchains[0]?.metadata?.name || 'Unknown'
        }
      };
    } else {
      apiStatus.isWorking = false;
      apiStatus.lastError = new Error('No data returned from API');
      apiStatus.connectionTested = true;
      return {success: false, message: 'Connection successful but no data returned'};
    }
  } catch (error) {
    apiStatus.isWorking = false;
    apiStatus.lastError = error instanceof Error ? error : new Error(String(error));
    apiStatus.connectionTested = true;
    
    // Provide specific guidance based on error
    let message = 'Connection failed';
    let details = {};
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('api key') || errorMsg.includes('401')) {
        message = 'Authentication error: Invalid API key. Please update your API key.';
        details = {
          errorType: 'authentication',
          suggestion: 'Please obtain a valid API key from UnleashNFTs (formerly BitCrunch)'
        };
      } else if (errorMsg.includes('429')) {
        message = 'Rate limit exceeded. Please try again later.';
        details = {
          errorType: 'rateLimit',
          suggestion: 'Wait a few minutes before trying again or upgrade your API plan'
        };
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        message = 'Network error: Unable to connect to UnleashNFTs servers';
        details = {
          errorType: 'network',
          suggestion: 'Check your internet connection and try again'
        };
      }
    }
    
    return {success: false, message, details};
  }
};

/**
 * Get NFT collections by blockchain with improved error handling and status tracking
 * @param chain The blockchain name (ethereum, polygon, etc.)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionsByChain = async (
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTCollection[]> => {
  try {
    const response = await fetchFromAPI<NFTCollection[]>(`/unleash/collections?chain=${chain}&page=${page}&limit=${limit}`);
    
    // Update API status on success
    apiStatus.isWorking = true;
    apiStatus.lastSuccessfulCall = new Date();
    apiStatus.lastError = null;
    
    return response || [];
  } catch (error) {
    // Update API status on error
    apiStatus.isWorking = false;
    apiStatus.lastError = error instanceof Error ? error : new Error(String(error));
    
    console.error(`Error fetching collections for chain ${chain}:`, error);
    throw error;
  }
};

/**
 * Get collection metadata by contract address with improved error handling
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getCollectionMetadata = async (
  address: string,
  chain: string = 'ethereum'
): Promise<NFTCollection | null> => {
  try {
    const response = await fetchFromAPI<NFTCollection>(`/unleash/collection/${address}?chain=${chain}`);
    
    // Update API status on success
    apiStatus.isWorking = true;
    apiStatus.lastSuccessfulCall = new Date();
    apiStatus.lastError = null;
    
    return response || null;
  } catch (error) {
    // Update API status on error
    apiStatus.isWorking = false;
    apiStatus.lastError = error instanceof Error ? error : new Error(String(error));
    
    console.error(`Error fetching collection metadata for ${address} on ${chain}:`, error);
    throw error;
  }
};

/**
 * Get collection metrics by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum) 
 */
export const getCollectionMetrics = async (
  address: string,
  chain: string = 'ethereum'
): Promise<NFTCollectionMetrics | null> => {
  const response = await fetchFromAPI<NFTCollectionMetrics>(`/unleash/collection/${address}/metrics?chain=${chain}`);
  return response || null;
};

/**
 * Get collection trend data by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param period The time period (24h, 7d, 30d, all) (defaults to 30d)
 */
export const getCollectionTrend = async (
  address: string,
  chain: string = 'ethereum',
  period: string = '30d'
): Promise<any> => {
  const response = await fetchFromAPI<any>(`/unleash/collection/${address}/trend?chain=${chain}&period=${period}`);
  return response || null;
};

/**
 * Get collection traits by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getCollectionTraits = async (
  address: string,
  chain: string = 'ethereum'
): Promise<any> => {
  const response = await fetchFromAPI<any>(`/unleash/collection/${address}/traits?chain=${chain}`);
  return response || null;
};

/**
 * Get NFTs in a collection by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionNFTs = async (
  address: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTMetadata[]> => {
  const response = await fetchFromAPI<NFTMetadata[]>(`/unleash/collection/${address}/nfts?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get collection transactions
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionTransactions = async (
  address: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<any[]> => {
  const response = await fetchFromAPI<any[]>(`/unleash/collection/${address}/transactions?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get collections with NFT valuation support
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionsWithValuation = async (
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTCollection[]> => {
  const response = await fetchFromAPI<NFTCollection[]>(`/unleash/collections-with-valuation?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get NFTs with valuation
 * @param collection The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getNFTsWithValuation = async (
  collection: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTMetadata[]> => {
  const response = await fetchFromAPI<NFTMetadata[]>(`/unleash/nfts-with-valuation?collection=${collection}&chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get NFT valuation by contract address and token ID
 * @param collection The collection contract address
 * @param tokenId The NFT token ID
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getNFTValuation = async (
  collection: string,
  tokenId: string,
  chain: string = 'ethereum'
): Promise<NFTValuation | null> => {
  const response = await fetchFromAPI<NFTValuation>(`/unleash/nft-valuation?collection=${collection}&token_id=${tokenId}&chain=${chain}`);
  return response || null;
};

/**
 * Interface for detailed NFT metadata
 */
export interface NFTDetailedMetadata {
  collection_name?: string;
  contract_address?: string;
  token_id?: string;
  name?: string;
  description?: string;
  image_url?: string;
  animation_url?: string;
  external_url?: string;
  traits?: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
    display_type?: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Get detailed NFT metadata by contract address and token ID
 * @param contractAddress The collection contract address
 * @param tokenId The NFT token ID
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getNFTDetailedMetadata = async (
  contractAddress: string,
  tokenId: string,
  chain: string = 'ethereum'
): Promise<NFTDetailedMetadata | null> => {
  const response = await fetchFromAPI<NFTDetailedMetadata>(
    `/unleash/nft/metadata?contract_address=${contractAddress}&token_id=${tokenId}&blockchain=${chain}`
  );
  return response || null;
};

/**
 * Get NFT metadata using either contract address or slug name
 * @param params Configuration object
 * @param params.contractAddress The collection contract address
 * @param params.slugName The collection slug name
 * @param params.tokenId The NFT token ID
 * @param params.chain The blockchain name (defaults to ethereum)
 */
export const getNFTMetadataFlex = async ({
  contractAddress,
  slugName,
  tokenId,
  chain = 'ethereum'
}: {
  contractAddress?: string;
  slugName?: string;
  tokenId: string;
  chain?: string;
}): Promise<NFTDetailedMetadata | null> => {
  if (!tokenId) {
    throw new Error('tokenId is required');
  }
  
  if (!contractAddress && !slugName) {
    throw new Error('Either contractAddress or slugName is required');
  }
  
  let url = `/unleash/nft/metadata?token_id=${tokenId}&blockchain=${chain}`;
  
  if (contractAddress) {
    url += `&contract_address=${contractAddress}`;
  }
  
  if (slugName) {
    url += `&slug_name=${slugName}`;
  }
  
  const response = await fetchFromAPI<NFTDetailedMetadata>(url);
  return response || null;
};