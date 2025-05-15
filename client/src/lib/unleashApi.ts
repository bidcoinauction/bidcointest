// Import the base fetchFromAPI function but we'll create a specialized version
import { fetchFromAPI as baseFetchFromAPI } from './api';
import axios from 'axios';

/**
 * Helper function for API status tracking and error handling
 */
// Try to get API key from localStorage first, then environment variable
const getSavedApiKey = (): string => {
  try {
    const savedKey = typeof window !== 'undefined' ? localStorage.getItem('unleashNfts_apiKey') : null;
    return savedKey || import.meta.env.VITE_BITCRUNCH_API_KEY || "0c4b62cce16246d181310c3b57512529";
  } catch (e) {
    return import.meta.env.VITE_BITCRUNCH_API_KEY || "0c4b62cce16246d181310c3b57512529";
  }
};

// Define API status object with detailed state management
const apiStatus = {
  apiKey: getSavedApiKey(),
  isConnected: false,
  lastError: null as string | null,
  useFallbackEndpoints: false,
  rateLimitHit: false,
  lastApiVersion: 'v2', // Track which API version we're using
  lastUpdated: Date.now()
};

// API connection attempts tracking - helps with error handling
const connectionAttempts = {
  v2: {
    successful: false,
    lastAttempt: 0
  },
  v1: {
    successful: false,
    lastAttempt: 0
  }
};

// Modified fetch function with API key from our state
async function fetchFromAPI<T>(endpoint: string, options?: RequestInit, apiVersion: 'v1' | 'v2' = 'v2'): Promise<T> {
  // Create new options object with our API key in headers
  const apiKey = apiStatus.apiKey;
  
  if (!apiKey) {
    throw new Error('UnleashNFTs API key is missing. Please update it in settings.');
  }
  
  const headers = {
    'x-api-key': apiKey,
    'Accept': 'application/json',
    ...(options?.headers || {})
  };
  
  // Merge with existing options
  const mergedOptions = {
    ...options,
    headers
  };
  
  try {
    // Use the specified API version
    apiStatus.lastApiVersion = apiVersion;
    connectionAttempts[apiVersion].lastAttempt = Date.now();
    
    const response = await baseFetchFromAPI<T>(`https://api.unleashnfts.com/api/${apiVersion}/${endpoint}`, mergedOptions);
    
    // Mark this API version as successful
    connectionAttempts[apiVersion].successful = true;
    apiStatus.isConnected = true;
    apiStatus.lastError = null;
    apiStatus.rateLimitHit = false;
    apiStatus.lastUpdated = Date.now();
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    apiStatus.lastError = errorMessage;
    
    // Handle different error scenarios
    if (errorMessage.includes('401') || errorMessage.includes('Invalid API key')) {
      apiStatus.isConnected = false;
      throw new Error('Invalid API key. Please update your UnleashNFTs API key in settings.');
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      apiStatus.rateLimitHit = true;
      throw new Error('Rate limit exceeded. Please try again later or upgrade your API plan.');
    }
    
    // If using v2 and it failed, attempt fallback to v1
    if (apiVersion === 'v2' && !connectionAttempts.v1.successful) {
      try {
        console.log('Falling back to v1 API endpoint');
        apiStatus.useFallbackEndpoints = true;
        return await fetchFromAPI<T>(endpoint, options, 'v1');
      } catch (fallbackError) {
        // Both v2 and v1 failed
        apiStatus.isConnected = false;
        throw new Error(`API connection failed: ${errorMessage}. Fallback also failed.`);
      }
    }
    
    apiStatus.isConnected = false;
    throw error;
  }
}

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
 * Check if the UnleashNFTs API is operational and get current API status
 */
export const getApiStatus = () => ({
  ...apiStatus,
  // Add user-friendly status message based on current state
  statusMessage: getStatusMessage()
});

/**
 * Generate a user-friendly status message based on current API state
 */
function getStatusMessage(): string {
  if (apiStatus.isConnected) {
    return `Connected (API v${apiStatus.lastApiVersion})`;
  }
  
  if (apiStatus.rateLimitHit) {
    return "Rate limit exceeded";
  }
  
  if (apiStatus.lastError?.includes('401') || apiStatus.lastError?.includes('Invalid API key')) {
    return "Invalid API key";
  }
  
  if (!apiStatus.apiKey) {
    return "API key not set";
  }
  
  return apiStatus.lastError || "Not connected";
}

/**
 * Update the API key for UnleashNFTs API and save to local storage
 */
export const updateApiKey = (newApiKey: string): void => {
  if (!newApiKey || newApiKey.trim() === '') {
    throw new Error('API key cannot be empty');
  }
  
  // Reset connection status when changing the key
  apiStatus.isConnected = false;
  apiStatus.lastError = null;
  apiStatus.useFallbackEndpoints = false;
  apiStatus.rateLimitHit = false;
  
  // Update API key and save to localStorage for persistence
  apiStatus.apiKey = newApiKey.trim();
  localStorage.setItem('unleashNfts_apiKey', newApiKey.trim());
  
  // Reset connection tracking
  connectionAttempts.v1.successful = false;
  connectionAttempts.v2.successful = false;
  
  console.log('[unleash-nfts] API key updated');
};

/**
 * Test the API connection by making a simple request to both v1 and v2 endpoints
 */
export const testApiConnection = async (): Promise<{success: boolean, message: string, details?: any}> => {
  try {
    // First try the v2 API
    try {
      console.log('[unleash-nfts] Testing v2 API connection...');
      const v2Response = await fetchFromAPI<any>('blockchains?sort_by=blockchain_name&offset=0&limit=1', undefined, 'v2');
      
      if (v2Response && Array.isArray(v2Response.result)) {
        console.log('[unleash-nfts] 🟢 v2 API connection successful');
        return {
          success: true,
          message: 'Successfully connected to the UnleashNFTs API (v2)',
          details: v2Response
        };
      }
    } catch (v2Error) {
      console.log('[unleash-nfts] v2 API test failed, trying v1...');
      // If v2 fails, try v1
      try {
        const v1Response = await fetchFromAPI<any>('blockchains?sort_by=blockchain_name&offset=0&limit=1', undefined, 'v1');
        
        if (v1Response && Array.isArray(v1Response.result)) {
          console.log('[unleash-nfts] 🟢 v1 API connection successful');
          apiStatus.useFallbackEndpoints = true;
          return {
            success: true,
            message: 'Successfully connected to the UnleashNFTs API (v1)',
            details: v1Response
          };
        }
      } catch (v1Error) {
        // Both v1 and v2 failed
        console.error('[unleash-nfts] ❌ Both v1 and v2 API tests failed');
        
        // Determine the most specific error message
        const errorMsg = v1Error instanceof Error ? v1Error.message : String(v1Error);
        
        if (errorMsg.includes('401') || errorMsg.includes('Invalid API key')) {
          return {
            success: false,
            message: 'Invalid API key. Please check your API key and try again.',
            details: v1Error
          };
        }
        
        if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          return {
            success: false,
            message: 'Rate limit exceeded. Please try again in a few minutes or upgrade your API plan.',
            details: v1Error
          };
        }
        
        return {
          success: false,
          message: 'Failed to connect to UnleashNFTs API. Please check your internet connection and try again.',
          details: v1Error
        };
      }
    }
    
    // If execution reaches here, it means responses were received but in unexpected format
    console.log('[unleash-nfts] ⚠️ API connection test completed, but received unexpected response format');
    return {
      success: false,
      message: 'API connection successful but received unexpected response format',
      details: null
    };
  } catch (error) {
    console.error('[unleash-nfts] ❌ UnleashNFTs API connection test failed', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to the UnleashNFTs API',
      details: error
    };
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
    // Updated endpoint with required parameters
    const endpoint = `collections?chain=${chain}&page=${page}&limit=${limit}&metrics=true&sort_by=volume_24h`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    console.log(`[unleash-nfts] Collections response:`, response);
    
    if (response && (Array.isArray(response.result) || (response.collections && Array.isArray(response.collections)))) {
      // Handle different response formats
      const collections = Array.isArray(response.result) 
        ? response.result 
        : (response.collections || []);
      
      console.log(`[unleash-nfts] Found ${collections.length} collections for ${chain}`);
      return collections;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get collections for chain ${chain}:`, error);
    return [];
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
    const endpoint = `collection/${address}?chain=${chain}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && response.result) {
      return response.result;
    }
    
    return null;
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get collection metadata for ${address}:`, error);
    return null;
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
  try {
    const endpoint = `collection/${address}/metrics?chain=${chain}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && response.result) {
      return response.result;
    }
    
    return null;
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get collection metrics for ${address}:`, error);
    return null;
  }
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
  try {
    const endpoint = `collection/${address}/trend?chain=${chain}&period=${period}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && response.result) {
      return response.result;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get collection trend for ${address}:`, error);
    return [];
  }
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
  try {
    const endpoint = `collection/${address}/traits?chain=${chain}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && response.result) {
      return response.result;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get collection traits for ${address}:`, error);
    return [];
  }
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
  try {
    const endpoint = `collection/${address}/nfts?chain=${chain}&page=${page}&limit=${limit}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && Array.isArray(response.result)) {
      return response.result;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get NFTs for collection ${address}:`, error);
    return [];
  }
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
  try {
    const endpoint = `collection/${address}/transactions?chain=${chain}&page=${page}&limit=${limit}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && Array.isArray(response.result)) {
      return response.result;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get transactions for collection ${address}:`, error);
    return [];
  }
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
  try {
    const endpoint = `valuation/collections?chain=${chain}&page=${page}&limit=${limit}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && Array.isArray(response.result)) {
      return response.result;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get collections with valuation:`, error);
    return [];
  }
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
  try {
    const endpoint = `valuation/nfts?collection=${collection}&chain=${chain}&page=${page}&limit=${limit}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && Array.isArray(response.result)) {
      return response.result;
    }
    
    return [];
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get NFTs with valuation:`, error);
    return [];
  }
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
  try {
    const endpoint = `valuation/nft?collection=${collection}&token_id=${tokenId}&chain=${chain}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && response.result) {
      return response.result;
    }
    
    return null;
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get NFT valuation:`, error);
    return null;
  }
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
  try {
    const endpoint = `nft/${contractAddress}/${tokenId}?chain=${chain}`;
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    
    const response = await fetchFromAPI<any>(endpoint, undefined, apiVersion);
    
    if (response && response.result) {
      return response.result;
    }
    
    return null;
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get detailed NFT metadata:`, error);
    return null;
  }
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
  
  let url = `nft/metadata?token_id=${tokenId}&chain=${chain}`;
  
  if (contractAddress) {
    url += `&contract_address=${contractAddress}`;
  }
  
  if (slugName) {
    url += `&slug_name=${slugName}`;
  }
  
  try {
    const apiVersion = apiStatus.useFallbackEndpoints ? 'v1' : 'v2';
    const response = await fetchFromAPI<NFTDetailedMetadata>(url, undefined, apiVersion);
    return response || null;
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get NFT metadata:`, error);
    return null;
  }
};