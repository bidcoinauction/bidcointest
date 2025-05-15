// Import axios for direct API calls
import { fetchFromAPI as baseFetchFromAPI } from './api';
// We'll define our own fetch function for external APIs
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

// Chain names to ID mapping based on UnleashNFTs API documentation
export const chainNameToId: Record<string, number> = {
  'ethereum': 1,
  'ETH': 1,
  'polygon': 137,
  'MATIC': 137,
  'avalanche': 43114,
  'AVAX': 43114,
  'binance': 57,
  'bsc': 57,
  'BSC': 57, 
  'ordinals': 8086,
  'BTC': 8086,
  'linea': 59144,
  'LINEA': 59144,
  'solana': 900,
  'SOL': 900
};

// Modified fetch function with API key from our state - using axios directly for more reliable calls
async function fetchFromAPI<T>(endpoint: string, options?: RequestInit, apiVersion: 'v1' | 'v2' = 'v2'): Promise<T> {
  // Create new options object with our API key in headers
  const apiKey = apiStatus.apiKey;
  
  if (!apiKey) {
    throw new Error('UnleashNFTs API key is missing. Please update it in settings.');
  }

  // Check if endpoint includes a chain parameter and convert chain name to ID if needed
  if (endpoint.includes('chain=')) {
    // Extract chain name from endpoint
    const chainNameMatch = endpoint.match(/chain=([^&]+)/);
    if (chainNameMatch && chainNameMatch[1]) {
      const chainName = chainNameMatch[1];
      const chainId = chainNameToId[chainName];
      
      if (chainId) {
        // Replace chain name with chain ID in endpoint
        endpoint = endpoint.replace(`chain=${chainName}`, `chain_id=${chainId}`);
      }
    }
  }

  // Construct the direct API URL
  const baseUrl = `https://api.unleashnfts.com/api/${apiVersion}`;
  const url = `${baseUrl}/${endpoint}`;
  
  // Track API version for status reporting
  apiStatus.lastApiVersion = apiVersion;
  connectionAttempts[apiVersion].lastAttempt = Date.now();
  
  // Log the full URL we're calling with chain ID
  console.log(`[unleash-nfts] Fetching from ${url}`);
  
  try {
    // Use axios for improved error handling and debugging
    const response = await axios.get(url, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout 
    });
    
    // Update API status on successful call
    apiStatus.isConnected = true;
    apiStatus.lastError = null;
    connectionAttempts[apiVersion].successful = true;
    
    if (response.data) {
      return response.data as T;
    } else {
      throw new Error(`Empty response from ${url}`);
    }
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      let errorMessage = error.message;
      
      // Get detailed error message from response if available
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = typeof errorData === 'object' 
          ? (errorData.message || errorData.error || JSON.stringify(errorData))
          : String(errorData);
      }
      
      // Track specific API errors for better handling
      if (status === 401) {
        apiStatus.lastError = "Invalid API key";
      } else if (status === 429) {
        apiStatus.rateLimitHit = true;
        apiStatus.lastError = "Rate limit exceeded";
      }
      
      throw new Error(`API Error (${status}): ${errorMessage}`);
    }
    throw error;
  }
}

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
    // Convert ETH to standard ethereum name to match API expectations
    const normalizedChain = chain === 'ETH' ? 'ethereum' : chain;
    
    // Use chain_id directly instead of chain parameter for more reliable API calls
    const chainId = chainNameToId[normalizedChain] || 1; // Default to Ethereum (1) if not found
    
    const endpoint = `nft/${contractAddress}/${tokenId}?chain_id=${chainId}`;
    
    // First try v2 API
    try {
      console.log(`[unleash-nfts] Fetching from https://api.unleashnfts.com/api/v2/${endpoint}`);
      
      // Make direct axios call for more control
      const apiKey = localStorage.getItem('unleashNfts_apiKey') || import.meta.env.VITE_BITCRUNCH_API_KEY;
      const url = `https://api.unleashnfts.com/api/v2/${endpoint}`;
      
      const response = await axios.get(url, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.result) {
        return response.data.result;
      }
    } catch (v2Error) {
      console.log('Falling back to v1 API endpoint');
    }
    
    // Fall back to v1 API if v2 fails
    try {
      console.log(`[unleash-nfts] Fetching from https://api.unleashnfts.com/api/v1/${endpoint}`);
      
      // Make direct axios call for more control
      const apiKey = localStorage.getItem('unleashNfts_apiKey') || import.meta.env.VITE_BITCRUNCH_API_KEY;
      const url = `https://api.unleashnfts.com/api/v1/${endpoint}`;
      
      const response = await axios.get(url, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.result) {
        return response.data.result;
      }
    } catch (v1Error) {
      console.error(`[unleash-nfts] V1 API fallback also failed:`, v1Error);
    }
    
    console.log('No detailed metadata available from UnleashNFTs API');
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
  if (!contractAddress && !slugName) {
    throw new Error('Either contractAddress or slugName must be provided');
  }
  
  if (contractAddress) {
    return getNFTDetailedMetadata(contractAddress, tokenId, chain);
  }
  
  // If we only have slug name, we need to find the contract address first
  try {
    // This is a stub - in a real implementation, we would look up the collection by slug
    throw new Error('Collection lookup by slug is not yet implemented');
  } catch (error) {
    console.error(`[unleash-nfts] Failed to get NFT metadata by slug:`, error);
    return null;
  }
};

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
  apiKey: apiStatus.apiKey ? '***' + apiStatus.apiKey.substr(-4) : 'Not set',
  isConnected: apiStatus.isConnected,
  lastError: apiStatus.lastError,
  rateLimitHit: apiStatus.rateLimitHit,
  statusMessage: getStatusMessage(),
  useFallbackEndpoints: apiStatus.useFallbackEndpoints,
  v1Available: connectionAttempts.v1.successful,
  v2Available: connectionAttempts.v2.successful,
  lastApiVersion: apiStatus.lastApiVersion,
  lastUpdated: apiStatus.lastUpdated
});

/**
 * Generate a user-friendly status message based on current API state
 */
function getStatusMessage(): string {
  if (!apiStatus.apiKey) {
    return 'API key not set. Please update your API key in settings.';
  }
  
  if (apiStatus.rateLimitHit) {
    return 'API rate limit exceeded. Please try again later or upgrade your plan.';
  }
  
  if (apiStatus.lastError) {
    return `API Error: ${apiStatus.lastError}`;
  }
  
  if (apiStatus.isConnected) {
    if (connectionAttempts.v2.successful) {
      return 'Connected to UnleashNFTs API v2';
    } else if (connectionAttempts.v1.successful) {
      return 'Connected to UnleashNFTs API v1 (fallback)';
    }
  }
  
  return 'Not connected to UnleashNFTs API';
}

/**
 * Update the API key for UnleashNFTs API and save to local storage
 */
export const updateApiKey = (newApiKey: string): void => {
  apiStatus.apiKey = newApiKey;
  
  // Reset connection status
  apiStatus.isConnected = false;
  apiStatus.lastError = null;
  apiStatus.rateLimitHit = false;
  apiStatus.useFallbackEndpoints = false;
  connectionAttempts.v1.successful = false;
  connectionAttempts.v2.successful = false;
  
  // Save to localStorage for persistence
  try {
    localStorage.setItem('unleashNfts_apiKey', newApiKey);
  } catch (e) {
    console.error('Failed to save API key to localStorage:', e);
  }
  
  console.log(`[unleash-nfts] API key updated: ${newApiKey.substring(0, 4)}...${newApiKey.substring(newApiKey.length - 4)}`);
};

/**
 * Test the API connection by making a simple request to both v1 and v2 endpoints
 */
export const testApiConnection = async (): Promise<{success: boolean, message: string, details?: any}> => {
  if (!apiStatus.apiKey) {
    return {
      success: false,
      message: 'API key not set. Please update your API key in settings.'
    };
  }
  
  try {
    console.log('[unleash-nfts] Testing connection to UnleashNFTs API...');
    
    // Test V2 API first
    try {
      const blockchains = await fetchFromAPI<any>('blockchains?limit=10', undefined, 'v2');
      console.log(`[unleash-nfts] Got ${blockchains?.result?.length || 0} blockchains from UnleashNFTs`);
      
      connectionAttempts.v2.successful = true;
      apiStatus.isConnected = true;
      apiStatus.lastError = null;
      apiStatus.useFallbackEndpoints = false;
      
      if (blockchains?.result?.length > 0) {
        return {
          success: true,
          message: 'Successfully connected to UnleashNFTs API v2',
          details: {
            apiVersion: 'v2',
            blockchains: blockchains.result
          }
        };
      } else {
        console.log('[unleash-nfts] ⚠️ UnleashNFTs API connection test completed, but no blockchains were returned.');
        console.log('[unleash-nfts] This might indicate an issue with the API or insufficient permissions.');
      }
    } catch (v2Error) {
      console.log('[unleash-nfts] V2 API connection test failed, falling back to V1');
      apiStatus.useFallbackEndpoints = true;
      
      // Fall back to V1 API
      try {
        const blockchains = await fetchFromAPI<any>('blockchains?limit=10', undefined, 'v1');
        console.log(`[unleash-nfts] Got ${blockchains?.result?.length || 0} blockchains from UnleashNFTs V1`);
        
        connectionAttempts.v1.successful = true;
        apiStatus.isConnected = true;
        apiStatus.lastError = null;
        
        if (blockchains?.result?.length > 0) {
          return {
            success: true,
            message: 'Successfully connected to UnleashNFTs API v1 (fallback)',
            details: {
              apiVersion: 'v1',
              blockchains: blockchains.result
            }
          };
        }
      } catch (v1Error) {
        console.log('[unleash-nfts] V1 API fallback connection test also failed');
        apiStatus.isConnected = false;
        apiStatus.lastError = 'Failed to connect to both V1 and V2 APIs';
        
        return {
          success: false,
          message: 'Failed to connect to both V1 and V2 APIs. Please check your API key and try again.',
          details: {
            v2Error,
            v1Error
          }
        };
      }
    }
    
    return {
      success: apiStatus.isConnected,
      message: getStatusMessage()
    };
  } catch (error) {
    console.error('[unleash-nfts] API connection test failed:', error);
    apiStatus.isConnected = false;
    apiStatus.lastError = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      message: `Failed to connect to UnleashNFTs API: ${apiStatus.lastError}`,
      details: {
        error
      }
    };
  }
};

export const getCollectionsByChain = async (
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTCollection[]> => {
  try {
    // Add required parameters for collections API
    const endpoint = `collections?chain=${chain}&page=${page}&limit=${limit}&metrics=volume&sort_by=volume`;
    
    // First try V2 API
    try {
      const collectionsData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (collectionsData?.result?.length) {
        return collectionsData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 collections API');
      
      // Try V1 API as fallback
      const collectionsDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (collectionsDataV1?.result?.length) {
        return collectionsDataV1.result;
      }
    }
    
    // If we get here, both attempts failed or returned empty results
    return [];
  } catch (error) {
    console.error('[unleash-nfts] Failed to get collections:', error);
    throw error;
  }
};

export const getCollectionMetadata = async (
  address: string,
  chain: string = 'ethereum'
): Promise<NFTCollection | null> => {
  try {
    const endpoint = `collection/${address}?chain=${chain}`;
    
    // First try V2 API
    try {
      const collectionData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (collectionData?.result) {
        return collectionData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 collection API');
      
      // Try V1 API as fallback
      const collectionDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (collectionDataV1?.result) {
        return collectionDataV1.result;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[unleash-nfts] Failed to get collection metadata:', error);
    throw error;
  }
};

export const getCollectionMetrics = async (
  address: string,
  chain: string = 'ethereum'
): Promise<NFTCollectionMetrics | null> => {
  try {
    const endpoint = `collection/${address}/metrics?chain=${chain}`;
    
    // First try V2 API
    try {
      const metricsData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (metricsData?.result) {
        return metricsData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 collection metrics API');
      
      // Try V1 API as fallback
      const metricsDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (metricsDataV1?.result) {
        return metricsDataV1.result;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[unleash-nfts] Failed to get collection metrics:', error);
    throw error;
  }
};

export const getCollectionTraits = async (
  address: string,
  chain: string = 'ethereum'
): Promise<any | null> => {
  try {
    const endpoint = `collection/${address}/traits?chain=${chain}`;
    
    // First try V2 API
    try {
      const traitsData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (traitsData?.result) {
        return traitsData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 collection traits API');
      
      // Try V1 API as fallback
      const traitsDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (traitsDataV1?.result) {
        return traitsDataV1.result;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[unleash-nfts] Failed to get collection traits:', error);
    throw error;
  }
};

export const getCollectionNFTs = async (
  address: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTMetadata[]> => {
  try {
    const endpoint = `collection/${address}/nfts?chain=${chain}&page=${page}&limit=${limit}`;
    
    // First try V2 API
    try {
      const nftsData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (nftsData?.result?.length) {
        return nftsData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 collection NFTs API');
      
      // Try V1 API as fallback
      const nftsDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (nftsDataV1?.result?.length) {
        return nftsDataV1.result;
      }
    }
    
    return [];
  } catch (error) {
    console.error('[unleash-nfts] Failed to get collection NFTs:', error);
    throw error;
  }
};

export const getNFTsWithValuation = async (
  collection: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTValuation[]> => {
  try {
    const endpoint = `valuation/collection/${collection}/nfts?chain=${chain}&page=${page}&limit=${limit}`;
    
    // First try V2 API
    try {
      const valuationData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (valuationData?.result?.length) {
        return valuationData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 valuation API');
      
      // Try V1 API as fallback
      const valuationDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (valuationDataV1?.result?.length) {
        return valuationDataV1.result;
      }
    }
    
    return [];
  } catch (error) {
    console.error('[unleash-nfts] Failed to get NFTs with valuation:', error);
    throw error;
  }
};

export const getNFTValuation = async (
  collection: string,
  tokenId: string,
  chain: string = 'ethereum'
): Promise<NFTValuation | null> => {
  try {
    const endpoint = `valuation/nft/${collection}/${tokenId}?chain=${chain}`;
    
    // First try V2 API
    try {
      const valuationData = await fetchFromAPI<any>(endpoint, undefined, 'v2');
      
      if (valuationData?.result) {
        return valuationData.result;
      }
    } catch (v2Error) {
      console.log('Falling back to V1 NFT valuation API');
      
      // Try V1 API as fallback
      const valuationDataV1 = await fetchFromAPI<any>(endpoint, undefined, 'v1');
      
      if (valuationDataV1?.result) {
        return valuationDataV1.result;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[unleash-nfts] Failed to get NFT valuation:', error);
    throw error;
  }
};