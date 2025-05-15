import axios from 'axios';
import { log } from './vite';

// Updated API endpoints based on the latest UnleashNFTs documentation
const BASE_URL_V1 = 'https://api.unleashnfts.com/v1'; // Note: v1 uses /v1 in path
const BASE_URL_V2 = 'https://api.unleashnfts.com/api/v2'; // Note: v2 uses /api/v2 in path
// Access the API key directly from the environment variable
// In server-side code, we need to access process.env directly, not import.meta.env
// Using fallback to hardcoded value for consistent API access
const API_KEY = process.env.VITE_BITCRUNCH_API_KEY || '0c4b62cce16246d181310c3b57512529';

// Type definitions based on the UnleashNFTs API
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

export class UnleashNftsService {
  private headersV1: Record<string, string>;
  private headersV2: Record<string, string>;

  constructor() {
    // V1 uses Authorization: Bearer <API_KEY>
    this.headersV1 = {
      'accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };
    
    // V2 uses x-api-key: <API_KEY>
    this.headersV2 = {
      'accept': 'application/json',
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
        headers: this.headersV1V1,
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
  async getCollectionsByChain(chain: string, page: number = 1, limit: number = 10, metricsParam: string = 'volume,marketcap,price_floor,price_avg,price_ceiling,holders,sales,traders,holders_diamond_hands,holders_whales,volume_change,marketcap_change,holders_change,sales_change,traders_change', sortBy: string = 'volume'): Promise<NFTCollection[]> {
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
      
      // Try V2 endpoint with direct path format first
      try {
        log(`[unleash-nfts] Trying format: ${BASE_URL_V2}/collection/${chainId}/${contractAddress}`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V2}/collection/${chainId}/${contractAddress}`, {
          headers: this.headersV2
        });
        
        const collection = response.data;
        
        // Clean image URL
        if (collection && collection.image_url) {
          collection.image_url = this.cleanImageUrl(collection.image_url);
        }
        
        return collection;
      } catch (v2Error: any) {
        log(`[unleash-nfts] Failed with v2 API format collection/${chainId}/${contractAddress}: ${v2Error.message}`, 'unleash-nfts');
        
        // Fall back to V1 endpoint
        try {
          log(`[unleash-nfts] Trying v1 format: ${BASE_URL_V1}/collection/${chainId}/${contractAddress}`, 'unleash-nfts');
          const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}`, {
            headers: this.headersV1
          });
          
          const collection = response.data;
          
          // Clean image URL
          if (collection && collection.image_url) {
            collection.image_url = this.cleanImageUrl(collection.image_url);
          }
          
          return collection;
        } catch (v1Error: any) {
          log(`Both v2 and v1 collection metadata endpoints failed`, 'unleash-nfts');
          throw v1Error;
        }
      }
    } catch (error: any) {
      this.handleError('getCollectionMetadata', error);
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
    if (url.startsWith('data:image') || url.includes('ipfs.io')) {
      return url;
    }
    
    try {
      // Convert IPFS gateway URLs to use ipfs.io gateway which has better CORS support
      if (url.includes('ipfs')) {
        // Extract CID from various IPFS URL formats
        let cid = '';
        
        // Handle ipfs:// protocol
        if (url.startsWith('ipfs://')) {
          cid = url.replace('ipfs://', '');
          return `https://ipfs.io/ipfs/${cid}`;
        }
        
        // Handle URLs with /ipfs/ path
        if (url.includes('/ipfs/')) {
          cid = url.split('/ipfs/')[1];
          return `https://ipfs.io/ipfs/${cid}`;
        }
      }
      
      // Handle Magic Eden URLs - replace with direct source
      if (url.includes('magiceden') || url.includes('opensea')) {
        // Don't use these URLs as they have CORS restrictions
        // Instead return a placeholder or cached version
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
      
      const response = await axios.get(`${BASE_URL_V1}/nft/valuation`, {
        headers: this.headersV1,
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
        // Use v2 endpoint with direct path format
        // Direct format: /nft/{blockchain}/{contract_address}/{token_id}
        log(`[unleash-nfts] Trying format: ${BASE_URL_V2}/nft/${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
        
        const response = await axios.get(`${BASE_URL_V2}/nft/${chainId}/${contractAddress}/${tokenId}`, {
          headers: this.headersV2
        });
        
        const nftData = response.data;
        
        // Clean image URLs
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId}`, 'unleash-nfts');
        }
        
        // Also clean the collection image if present
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        
        log(`✅ Success with direct NFT path format: ${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
        return nftData;
      } catch (v2Error: any) {
        const errorMsg = v2Error.response?.data?.message || v2Error.message;
        log(`V2 NFT metadata endpoint failed: ${errorMsg}. Trying v1 endpoint...`, 'unleash-nfts');
        
        // If v2 fails, try v1 endpoint with direct path format
        try {
          log(`[unleash-nfts] Trying v1 format: ${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
          const response = await axios.get(`${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, {
            headers: this.headersV1
          });
          
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
          
          return nftData;
        } catch (v1Error: any) {
          const v1ErrorMsg = v1Error.response?.data?.message || v1Error.message;
          log(`Both v2 and v1 NFT metadata endpoints failed: ${v1ErrorMsg}`, 'unleash-nfts');
          throw v1Error;
        }
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
      
      // Try v2 endpoint first (as per updated docs)
      try {
        let response;
        let nftData;
        
        // If we have a contract address, use the direct path format
        if (contractAddress) {
          log(`[unleash-nfts] Trying direct path: ${BASE_URL_V2}/nft/${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
          response = await axios.get(`${BASE_URL_V2}/nft/${chainId}/${contractAddress}/${tokenId}`, {
            headers: this.headersV2
          });
          
          nftData = response.data;
        } else {
          // For slug-based lookup, we still need to use params
          log(`[unleash-nfts] Using params with slug: ${BASE_URL_V2}/nft/metadata`, 'unleash-nfts');
          response = await axios.get(`${BASE_URL_V2}/nft/metadata`, {
            headers: this.headersV2,
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
      } catch (v2Error: any) {
        const errorMsg = v2Error.response?.data?.message || v2Error.message;
        log(`V2 NFT metadata endpoint failed: ${errorMsg}. Trying v1 endpoint...`, 'unleash-nfts');
        
        // If v2 fails, try v1 endpoint
        try {
          let response;
          
          // If we have a contract address, use direct path format
          if (contractAddress) {
            log(`[unleash-nfts] Trying direct v1 path: ${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
            response = await axios.get(`${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, {
              headers: this.headersV1
            });
          } else {
            // For slug-based lookup, use query params
            log(`[unleash-nfts] Trying slug with v1 endpoint: ${BASE_URL_V1}/nft/metadata`, 'unleash-nfts');
            response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
              headers: this.headersV1,
              params
            });
          }
          
          const nftData = response.data;
          
          // Clean any image URLs in the response
          if (nftData && nftData.image_url) {
            nftData.image_url = this.cleanImageUrl(nftData.image_url);
            log(`Cleaned image URL for NFT ${tokenId} from v1 endpoint`, 'unleash-nfts');
          }
          
          // Clean collection image URLs if present
          if (nftData && nftData.collection && nftData.collection.image_url) {
            nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
          }
          
          return nftData;
        } catch (v1Error: any) {
          const v1ErrorMsg = v1Error.response?.data?.message || v1Error.message;
          log(`Both v2 and v1 NFT metadata endpoints failed: ${v1ErrorMsg}`, 'unleash-nfts');
          throw v1Error;
        }
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
      'solana': '900'
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
}

export const unleashNftsService = new UnleashNftsService();