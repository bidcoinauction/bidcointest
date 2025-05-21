import axios from 'axios';
import { log } from './vite';

// Updated API endpoints based on the latest UnleashNFTs documentation
const BASE_URL_V1 = 'https://api.unleashnfts.com/v1'; // Note: v1 uses /v1 in path
const BASE_URL_V2 = 'https://api.unleashnfts.com/v2'; // Changed from /api/v2 to match docs
// Access the API key directly from the environment variable
// In server-side code, we need to access process.env directly, not import.meta.env
const API_KEY = process.env.VITE_BITCRUNCH_API_KEY || '0c4b62cce16246d181310c3b57512529';
log(`Using UnleashNFTs API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`, 'unleash-nfts');

// Type definitions based on the UnleashNFTs API
export interface NFTCollection {
  contract_address: string;
  name: string;
  image_url: string;
  token_schema: string;
  chain: string;
  description?: string;
  floor_price?: number;
  floor_price_usd?: number;
  floor_price_native?: number;
  currency_symbol?: string;
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

export class UnleashNftsService {
  private headersV1: Record<string, string>;
  private headersV2: Record<string, string>;

  constructor() {
    // Set up headers according to API requirements with correct format
    this.headersV1 = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };
    
    // Same headers for V2 endpoint
    this.headersV2 = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };
    
    log(`UnleashNFTs Service initialized with API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`, 'unleash-nfts');
  }

  /**
   * Get supported blockchains
   * @param page Page number (defaults to 1)
   * @param limit Items per page (defaults to 30)
   * @param sortBy Sort field (defaults to blockchain_name)
   */
  async getSupportedBlockchains(page: number = 1, limit: number = 30, sortBy: string = 'blockchain_name'): Promise<any[]> {
    try {
      // This is a v1 API endpoint
      const response = await axios.get(`${BASE_URL_V1}/blockchains`, {
        headers: this.headersV1,
        params: {
          sort_by: sortBy,
          offset: (page - 1) * limit,
          limit
        }
      });
      
      return response.data?.blockchains || [];
    } catch (error: any) {
      this.handleError('getSupportedBlockchains', error);
      return [];
    }
  }

  /**
   * Get collections by blockchain
   * @param chain The blockchain chain_id (1 for Ethereum, 137 for Polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   * @param metrics Type of metrics to include (volume, floor_price, etc.)
   * @param sortBy Field to sort by (volume, market_cap, etc.)
   */
  async getCollectionsByChain(chain: string, page: number = 1, limit: number = 10, metricsParam: string = 'volume,market_cap,floor_price,holders,sales,traders,volume_change,market_cap_change,holders_change,sales_change,traders_change', sortBy: string = 'volume_24h'): Promise<NFTCollection[]> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching collections for chain ${chainId}...`, 'unleash-nfts');
      
      // Prepare metrics array (split if comma-separated)
      const metrics = metricsParam.includes(',') ? metricsParam.split(',') : [metricsParam];
      
      // Include comprehensive metrics based on the API documentation
      const response = await axios.get(`${BASE_URL_V1}/collections`, {
        headers: this.headersV1,
        params: {
          blockchain: chainId,
          currency: 'usd',
          metrics: metrics.join(','),
          sort_by: sortBy,
          sort_order: 'desc',
          offset: (page - 1) * limit,
          limit,
          time_range: '24h', // Default to 24h, but we could make this configurable
          include_washtrade: true
        }
      });
      
      const collections = response.data?.collections || [];
      
      // Clean image URLs 
      return collections.map((collection: any) => {
        if (collection.image_url) {
          collection.image_url = this.cleanImageUrl(collection.image_url);
        }
        return collection;
      });
    } catch (error: any) {
      this.handleError('getCollectionsByChain', error);
      return [];
    }
  }

  /**
   * Get collection metadata by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetadata(contractAddress: string, chain: string): Promise<NFTCollection | null> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching metadata for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      // Use V1 endpoint consistently
      log(`[unleash-nfts] Using v1 format: ${BASE_URL_V1}/collection/${chainId}/${contractAddress}`, 'unleash-nfts');
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}`, {
        headers: this.headersV1
      });
      
      const collection = response.data;
      
      // Clean image URL
      if (collection && collection.image_url) {
        collection.image_url = this.cleanImageUrl(collection.image_url);
      }
      
      return collection;
    } catch (error: any) {
      this.handleError('getCollectionMetadata', error);
      
      // Additional details for troubleshooting
      if (error.response) {
        log(`Request: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, 'unleash-nfts');
        if (error.response.status === 404) {
          log(`Not found (404): Collection not found for contract address ${contractAddress}`, 'unleash-nfts');
        } else if (error.response.status === 401) {
          log(`Unauthorized (401): API key may be invalid or missing.`, 'unleash-nfts');
        }
      }
      
      return null;
    }
  }

  /**
   * Get collection metrics by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetrics(contractAddress: string, chain: string): Promise<NFTCollectionMetrics | null> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching metrics for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/metrics`, {
        headers: this.headersV1,
        params: {
          currency: 'usd',
          time_range: '24h'
        }
      });
      
      return response.data.metrics || null;
    } catch (error: any) {
      this.handleError('getCollectionMetrics', error);
      return null;
    }
  }

  /**
   * Get collection trend data by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param period The time period (24h, 7d, 30d, all)
   */
  async getCollectionTrend(contractAddress: string, chain: string, period: string = '30d'): Promise<any> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching trend data for collection ${contractAddress} on chain ${chainId} over ${period}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/trend`, {
        headers: this.headersV1,
        params: {
          currency: 'usd',
          time_range: period,
          include_washtrade: true
        }
      });
      
      return response.data || null;
    } catch (error: any) {
      this.handleError('getCollectionTrend', error);
      return null;
    }
  }

  /**
   * Get collection traits by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionTraits(contractAddress: string, chain: string): Promise<any> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching traits for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/traits`, {
        headers: this.headersV1
      });
      
      return response.data.traits || [];
    } catch (error: any) {
      this.handleError('getCollectionTraits', error);
      return [];
    }
  }

  /**
   * Get NFTs in a collection by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionNFTs(contractAddress: string, chain: string, page: number = 1, limit: number = 10): Promise<NFTMetadata[]> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFTs for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/nfts`, {
        headers: this.headersV1,
        params: {
          offset: (page - 1) * limit,
          limit,
          sort_by: 'token_id',
          sort_order: 'asc'
        }
      });
      
      const nfts = response.data.nfts || [];
      
      // Clean image URLs
      return nfts.map((nft: any) => {
        if (nft.image_url) {
          nft.image_url = this.cleanImageUrl(nft.image_url);
        }
        return nft;
      });
    } catch (error: any) {
      this.handleError('getCollectionNFTs', error);
      return [];
    }
  }

  /**
   * Sanitize NFT image URLs to avoid marketplace restrictions
   * This is a critical function to ensure NFT images load properly from various sources
   * @param url The original image URL
   * @returns Sanitized image URL that uses direct sources
   */
  private cleanImageUrl(url: string): string {
    if (!url) return '';
    
    // Skip already cleaned URLs
    if (url.startsWith('data:image')) {
      return url;
    }
    
    try {
      // Convert IPFS gateway URLs to use recommended image proxy
      if (url.startsWith('ipfs://')) {
        const cid = url.replace('ipfs://', '');
        return `https://unleash.imgix.net/ipfs/${cid}`;
      }
      
      // Handle URLs with /ipfs/ path
      if (url.includes('/ipfs/')) {
        const cid = url.split('/ipfs/')[1];
        return `https://unleash.imgix.net/ipfs/${cid}`;
      }
      
      // Handle Magic Eden URLs - replace with direct source
      if (url.includes('magiceden') || url.includes('opensea')) {
        log(`Skipping restricted marketplace URL: ${url}`, 'unleash-nfts');
        return '/placeholder-nft.png';
      }
      
      // Return cleaned URL, or original if no cleaning was needed
      return url;
    } catch (e) {
      log(`Error cleaning image URL: ${e}`, 'unleash-nfts');
      return url; // Return original URL on error
    }
  }

  /**
   * Get collection transactions
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionTransactions(contractAddress: string, chain: string, page: number = 1, limit: number = 10): Promise<any[]> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching transactions for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/transactions`, {
        headers: this.headersV1,
        params: {
          offset: (page - 1) * limit,
          limit,
          sort_by: 'timestamp',
          sort_order: 'desc'
        }
      });
      
      return response.data.transactions || [];
    } catch (error: any) {
      this.handleError('getCollectionTransactions', error);
      return [];
    }
  }

  /**
   * Get collections with NFT valuation support
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionsWithValuation(chain: string, page: number = 1, limit: number = 10): Promise<NFTCollection[]> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching collections with valuation on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/nft/valuation/collections`, {
        headers: this.headersV1,
        params: {
          blockchain: chainId,
          offset: (page - 1) * limit,
          limit
        }
      });
      
      const collections = response.data.collections || [];
      
      // Clean image URLs
      return collections.map((collection: any) => {
        if (collection.image_url) {
          collection.image_url = this.cleanImageUrl(collection.image_url);
        }
        return collection;
      });
    } catch (error: any) {
      this.handleError('getCollectionsWithValuation', error);
      return [];
    }
  }

  /**
   * Get NFTs with valuation
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getNFTsWithValuation(contractAddress: string, chain: string, page: number = 1, limit: number = 10): Promise<NFTMetadata[]> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFTs with valuation for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V1}/nft/valuation/nfts`, {
        headers: this.headersV1,
        params: {
          blockchain: chainId,
          collection_address: contractAddress,
          offset: (page - 1) * limit,
          limit
        }
      });
      
      const nfts = response.data.nfts || [];
      
      // Clean image URLs
      return nfts.map((nft: any) => {
        if (nft.image_url) {
          nft.image_url = this.cleanImageUrl(nft.image_url);
        }
        return nft;
      });
    } catch (error: any) {
      this.handleError('getNFTsWithValuation', error);
      return [];
    }
  }

  /**
   * Get NFT valuation by contract address and token ID
   * @param contractAddress The collection contract address
   * @param tokenId The NFT token ID
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTValuation(contractAddress: string, tokenId: string, chain: string): Promise<any> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching valuation for NFT ${contractAddress}/${tokenId} on chain ${chainId}`, 'unleash-nfts');
      
      // Changed from V1 to V2 per documentation
      const response = await axios.get(`${BASE_URL_V2}/nft/valuation`, {
        headers: this.headersV2,
        params: {
          blockchain: chainId,
          collection_address: contractAddress,
          token_id: tokenId
        }
      });
      
      return response.data.valuation || null;
    } catch (error: any) {
      this.handleError('getNFTValuation', error);
      return null;
    }
  }
  
  /**
   * Get detailed NFT metadata by contract address and token ID
   * @param contractAddress The collection contract address
   * @param tokenId The NFT token ID
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTDetailedMetadata(contractAddress: string, tokenId: string, chain: string = 'ethereum'): Promise<any> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching detailed NFT metadata for ${contractAddress}/${tokenId} on chain ${chainId}`, 'unleash-nfts');
      
      try {
        // Only use v1 API endpoint format as this is what's required
        const v1Url = `${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`;
        log(`[unleash-nfts] Using direct v1 path: ${v1Url}`, 'unleash-nfts');
        
        const response = await axios.get(v1Url, { headers: this.headersV1 });
        
        const nftData = response.data;
        
        // Clean image URLs
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId} from v1 endpoint`, 'unleash-nfts');
        }
        
        // Also clean the collection image if present
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        
        log(`✅ Detailed metadata loaded from UnleashNFTs v1 API`, 'unleash-nfts');
        return nftData;
      } catch (error: any) {
        // Log detailed error information for debugging
        const errorMsg = error.response?.data?.message || error.message;
        log(`NFT metadata endpoint failed: ${errorMsg}`, 'unleash-nfts');
        log(`API Error in getNFTDetailedMetadata: ${error.message}`, 'unleash-nfts');
        log(`Request: GET ${error.config?.url}`, 'unleash-nfts');
        
        if (error.response) {
          const status = error.response.status;
          const statusText = error.response.statusText;
          log(`Status: ${status} - ${statusText}`, 'unleash-nfts');
          
          // Add specific error messaging based on status code
          if (status === 404) {
            log(`Not found (404): The requested resource was not found. Check the contract address and token ID.`, 'unleash-nfts');
          } else if (status === 401) {
            log(`Unauthorized (401): API key may be invalid or missing.`, 'unleash-nfts');
          } else if (status === 429) {
            log(`Rate limited (429): Too many requests. Please wait and try again.`, 'unleash-nfts');
          }
        }
        
        throw error;
      }
    } catch (error) {
      this.handleError('getNFTDetailedMetadata', error);
      return null;
    }
  }

  /**
   * Get NFT metadata by either contract address or slug name
   * @param options Configuration object
   * @param options.contractAddress The collection contract address
   * @param options.slugName The collection slug name
   * @param options.tokenId The NFT token ID
   * @param options.chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTMetadataFlex({ 
    contractAddress, 
    slugName, 
    tokenId, 
    chain = 'ethereum' 
  }: { 
    contractAddress?: string; 
    slugName?: string; 
    tokenId: string; 
    chain?: string;
  }): Promise<any> {
    try {
      if (!contractAddress && !slugName) {
        throw new Error("Either contractAddress or slugName must be provided for NFT metadata lookup");
      }
      
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFT metadata for token ${tokenId} on chain ${chainId}`, 'unleash-nfts');
      
      const params: Record<string, string> = {
        blockchain: chainId,
        token_id: tokenId
      };
      
      if (contractAddress) {
        params.collection_address = contractAddress;
        log(`Using collection address: ${contractAddress}`, 'unleash-nfts');
      }
      
      if (slugName) {
        params.collection_slug = slugName; // Using correct param name from docs
        log(`Using collection slug: ${slugName}`, 'unleash-nfts');
      }
      
      // Use v1 endpoint directly (based on API requirements)
      try {
        let response;
        let nftData;
        
        // If we have a contract address, use the direct path format
        if (contractAddress) {
          log(`[unleash-nfts] Using direct v1 path: ${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
          response = await axios.get(`${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, {
            headers: this.headersV1
          });
          
          nftData = response.data;
        } else {
          // For slug-based lookup, we still need to use params
          log(`[unleash-nfts] Using params with slug: ${BASE_URL_V1}/nft/metadata`, 'unleash-nfts');
          response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
            headers: this.headersV1,
            params
          });
          
          nftData = response.data;
        }
        
        // Clean any image URLs in the response
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId}`, 'unleash-nfts');
        }
        
        // Clean collection image URLs if present
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        
        return nftData;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        log(`API Error in getNFTMetadataFlex: ${errorMsg}`, 'unleash-nfts');
        
        // Additional details for troubleshooting
        if (error.response) {
          log(`Request: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, 'unleash-nfts');
          if (error.response.status === 404) {
            log(`Not found (404): The requested resource was not found. Check the contract address and token ID.`, 'unleash-nfts');
          } else if (error.response.status === 401) {
            log(`Unauthorized (401): API key may be invalid or missing.`, 'unleash-nfts');
          } else {
            log(`Error status: ${error.response.status} ${error.response.statusText}`, 'unleash-nfts');
            log(`Error details: ${JSON.stringify(error.response.data)}`, 'unleash-nfts');
          }
        }
        
        throw error;
      }
    } catch (error) {
      this.handleError('getNFTMetadataFlex', error);
      return null;
    }
  }

  /**
   * Normalize blockchain chain ID to format expected by UnleashNFTs API
   * @param chain - Chain name (ethereum, polygon, etc.)
   * @returns Normalized chain ID (1 for ethereum, etc.)
   */
  private normalizeChainId(chain: string): string {
    // Convert common chain names to their numeric IDs as required by the API
    const chainMap: {[key: string]: string} = {
      'ethereum': '1',
      'eth': '1',
      'polygon': '137',
      'matic': '137',
      'binance': '56',
      'bsc': '56',
      'avalanche': '43114',
      'avax': '43114',
      'arbitrum': '42161',
      'optimism': '10',
      'fantom': '250',
      'ftm': '250',
      'base': '8453',
      'solana': '900',
      // Added new chains from docs
      'gnosis': '100',
      'zksync': '324',
      'linea': '59144'
    };
    
    // Check if the chain is already a numeric ID
    if (/^\d+$/.test(chain)) {
      return chain;
    }
    
    // Look up the chain in our mapping
    const normalizedChain = chainMap[chain.toLowerCase()];
    
    if (normalizedChain) {
      log(`Normalized chain '${chain}' to '${normalizedChain}'`, 'unleash-nfts');
      return normalizedChain;
    }
    
    // If not found in the map, return the original (might be a numeric ID already)
    log(`Using original chain identifier: ${chain}`, 'unleash-nfts');
    return chain;
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleError(method: string, error: any): void {
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
    const status = error.response?.status;
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = error.config?.method || 'unknown';
    
    // Special handling for authentication errors
    if (status === 401 || errorMessage.includes('API key')) {
      log(`UnleashNfts API AUTHENTICATION ERROR in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`Please check that the VITE_BITCRUNCH_API_KEY environment variable contains a valid API key.`, 'unleash-nfts');
      
      // Show first and last 4 characters of API key for debugging
      if (API_KEY) {
        const keyPreview = `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`;
        log(`Current API key begins with: ${keyPreview}`, 'unleash-nfts');
      } else {
        log(`No API key found in environment variables.`, 'unleash-nfts');
      }
      return;
    }
    
    // Special handling for rate limit errors
    if (status === 429) {
      log(`UnleashNFTs API RATE LIMIT ERROR in ${method}: Too many requests. Please wait before trying again.`, 'unleash-nfts');
      return;
    }
    
    // Add handling for documented error codes
    if (status === 403) {
      log(`Forbidden (403): Upgrade plan required for this endpoint`, 'unleash-nfts');
      return;
    }
    
    if (status === 422) {
      log(`Validation Error (422): Check request parameters`, 'unleash-nfts');
      return;
    }
    
    // Detailed logging for other error types
    log(`API Error in ${method}: ${errorMessage}`, 'unleash-nfts');
    log(`Request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    
    // Log specific error details for different status codes
    if (status) {
      if (status === 400) {
        log(`Bad request (400): The request was improperly formatted or contained invalid parameters.`, 'unleash-nfts');
      } else if (status === 404) {
        log(`Not found (404): The requested resource was not found. Check the contract address and token ID.`, 'unleash-nfts');
      } else if (status >= 500) {
        log(`Server error (${status}): The UnleashNFTs API server is experiencing issues. Try again later.`, 'unleash-nfts');
      }
    }
  }
  
  /**
   * Get collections by blockchain with metrics and native currency
   * @param blockchain Blockchain ID (1 for Ethereum, 137 for Polygon, etc.)
   * @param metrics Array of metrics to include
   * @param sort_by Field to sort by
   * @param limit Number of collections to return
   */
  async getCollectionsByBlockchain(params: {
    blockchain?: number | string,
    currency?: string,
    metrics?: string[],
    sort_by?: string,
    limit?: number,
    offset?: number,
    time_range?: string,
    include_washtrade?: boolean,
    category?: string[],
    cursor?: string // Added cursor-based pagination support
  }): Promise<any> {
    try {
      // Use v1 API endpoint for collections
      const url = `${BASE_URL_V1}/collections`;
      
      // Get blockchain ID if provided
      const blockchainId = params.blockchain ? this.normalizeChainId(params.blockchain.toString()) : undefined;
      
      // Default parameters
      const defaultParams = {
        metrics: ['floor_price', 'volume', 'holders', 'sales'],
        sort_by: 'volume',
        sort_order: 'desc',
        limit: 20,
        offset: 0,
        time_range: '24h',
        include_washtrade: true
      };
      
      // Merge with user-provided parameters
      const queryParams: any = { ...defaultParams };
      
      // Add all valid params from the input
      if (blockchainId) queryParams.blockchain = blockchainId;
      if (params.currency) queryParams.currency = params.currency;
      if (params.metrics) queryParams.metrics = params.metrics;
      if (params.sort_by) queryParams.sort_by = params.sort_by;
      if (params.limit) queryParams.limit = params.limit;
      if (params.offset) queryParams.offset = params.offset;
      if (params.time_range) queryParams.time_range = params.time_range;
      if (params.include_washtrade !== undefined) queryParams.include_washtrade = params.include_washtrade;
      if (params.category) queryParams.category = params.category;
      if (params.cursor) queryParams.cursor = params.cursor;
      
      // Log the API call
      log(`Fetching collections with params: ${JSON.stringify(queryParams)}`, 'unleash-nfts');
      
      // Send the request
      const response = await axios.get(url, {
        headers: this.headersV1,
        params: queryParams
      });
      
      log(`Successfully fetched collections for blockchain: ${blockchainId || 'all blockchains'}`, 'unleash-nfts');
      
      // Map blockchain IDs to their currency symbols
      const currencySymbols: Record<string, string> = {
        '1': 'ETH',    // Ethereum
        '137': 'MATIC', // Polygon
        '42161': 'ETH', // Arbitrum
        '10': 'ETH',    // Optimism
        '56': 'BNB',    // Binance Smart Chain
        '43114': 'AVAX', // Avalanche
        '8453': 'ETH',   // Base
        // Add more chains as needed
      };
      
      // Get the currency symbol for this blockchain
      const currencySymbol = blockchainId ? (currencySymbols[blockchainId] || 'ETH') : 'ETH';
      
      // Clean image URLs and add currency information
      if (response.data?.collections) {
        response.data.collections = response.data.collections.map((collection: any) => {
          // Clean image URL
          if (collection.image_url) {
            collection.image_url = this.cleanImageUrl(collection.image_url);
          }
          
          // Add currency symbol
          collection.currency_symbol = currencySymbol;
          
          // Store floor price in both native and USD formats
          if (collection.floor_price !== undefined) {
            // Make sure floor_price is treated as a number
            const floorPrice = typeof collection.floor_price === 'string' 
              ? parseFloat(collection.floor_price) 
              : collection.floor_price;
            
            collection.floor_price_native = floorPrice;
            
            // If we have price info for the currency, calculate USD value
            if (response.data.price_info && response.data.price_info[currencySymbol.toLowerCase()]) {
              const exchangeRate = response.data.price_info[currencySymbol.toLowerCase()].usd;
              collection.floor_price_usd = floorPrice * exchangeRate;
            }
          }
          
          return collection;
        });
      }
      
      return response.data;
    } catch (error: any) {
      this.handleError('getCollectionsByBlockchain', error);
      return null;
    }
  }

  /**
   * Get collection mint feed (real-time data)
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMintFeed(contractAddress: string, chain: string = 'ethereum'): Promise<any> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching mint feed for collection ${contractAddress} on chain ${chainId}`, 'unleash-nfts');
      
      const response = await axios.get(`${BASE_URL_V2}/mint-feed/${chainId}/${contractAddress}`, {
        headers: this.headersV2
      });
      
      return response.data || null;
    } catch (error: any) {
      this.handleError('getCollectionMintFeed', error);
      return null;
    }
  }
}

export const unleashNftsService = new UnleashNftsService();
