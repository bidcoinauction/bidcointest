import axios from 'axios';
import { log } from './vite';

// Updated API endpoints based on the latest UnleashNFTs documentation
const BASE_URL_V1 = 'https://api.unleashnfts.com/api/v1';
const BASE_URL_V2 = 'https://api.unleashnfts.com/api/v2';
// Access the API key directly from the environment variable
// In server-side code, we need to access process.env directly, not import.meta.env
const API_KEY = process.env.VITE_BITCRUNCH_API_KEY;

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
  private headers: Record<string, string>;

  constructor() {
    // Provide more information for debugging
    const firstFour = API_KEY ? API_KEY.substring(0, 4) : '';
    const lastFour = API_KEY ? API_KEY.substring(API_KEY.length - 4) : '';
    log(`Initializing UnleashNftsService with API key: ${API_KEY ? `${firstFour}...${lastFour}` : 'Not found'}`, 'unleash-nfts');

    this.headers = {
      'accept': 'application/json',
      'x-api-key': API_KEY || ''
    };

    if (!API_KEY) {
      log('WARNING: VITE_BITCRUNCH_API_KEY is not set. UnleashNfts API will not work.', 'unleash-nfts');
    } else {
      log('UnleashNfts API key configured successfully', 'unleash-nfts');
      // Test the connection
      this.testConnection();
    }
  }

  /**
   * Test the API connection by making a simple request
   */
  private async testConnection(): Promise<void> {
    try {
      log(`Testing connection to UnleashNFTs API...`, 'unleash-nfts');
      
      // Try to fetch collections with our refined approach
      try {
        // Make a direct API call instead of using getCollectionsByChain to isolate test
        log(`Testing collections API with correct parameters...`, 'unleash-nfts');
        
        const response = await axios.get(`${BASE_URL_V1}/collections`, {
          headers: this.headers,
          params: {
            currency: 'usd',
            metrics: 'volume',   // Required parameter
            sort_by: 'volume',
            sort_order: 'desc',
            offset: 0,
            limit: 5,
            time_range: '24h'
          }
        });
        
        const collections = response.data?.data || [];
        
        if (collections && collections.length > 0) {
          log(`✅ UnleashNFTs API collections test SUCCESSFUL. Found ${collections.length} collections.`, 'unleash-nfts');
          log(`Top collection: ${collections[0]?.name || 'Unknown'}`, 'unleash-nfts');
          return; // Exit early on success
        } else {
          log(`⚠️ UnleashNFTs API collections test completed, but no collections were returned.`, 'unleash-nfts');
          log(`Falling back to blockchain test...`, 'unleash-nfts');
        }
      } catch (collectionError: any) {
        const errorMsg = collectionError.response?.data?.message || collectionError.message || 'Unknown error';
        log(`⚠️ UnleashNFTs API collections test failed: ${errorMsg}`, 'unleash-nfts');
        log(`Falling back to blockchain test...`, 'unleash-nfts');
      }
      
      // If collections test fails, fall back to blockchains test
      try {
        const blockchains = await this.getSupportedBlockchains(1, 1);
        log(`Got ${blockchains.length} blockchains from UnleashNFTs v2 API`, 'unleash-nfts');
        
        if (blockchains && blockchains.length > 0) {
          log(`✅ UnleashNFTs API blockchain test SUCCESSFUL. Found ${blockchains.length} blockchains.`, 'unleash-nfts');
          log(`Blockchain available: ${blockchains[0]?.metadata?.name || 'Unknown'}`, 'unleash-nfts');
        } else {
          log(`⚠️ UnleashNFTs API connection test completed, but no blockchains were returned.`, 'unleash-nfts');
          log(`This might indicate an issue with the API or insufficient permissions.`, 'unleash-nfts');
        }
      } catch (blockchainError: any) {
        const errorMsg = blockchainError.response?.data?.message || blockchainError.message || 'Unknown error';
        log(`❌ UnleashNFTs API blockchain test FAILED: ${errorMsg}`, 'unleash-nfts');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const status = error.response?.status;
      
      log(`❌ UnleashNFTs API connection test FAILED: ${errorMessage}`, 'unleash-nfts');
      
      if (status === 401 || errorMessage.includes('API key')) {
        // If API key is invalid, provide guidance on obtaining a new one
        log(`The API key appears to be invalid or expired.`, 'unleash-nfts'); 
        log(`To get a valid API key:`, 'unleash-nfts');
        log(`1. Create an account at unleashnfts.com`, 'unleash-nfts');
        log(`2. Navigate to your profile settings`, 'unleash-nfts');
        log(`3. Request an API key and follow verification steps`, 'unleash-nfts');
        log(`4. Add the new key to your environment as VITE_BITCRUNCH_API_KEY`, 'unleash-nfts');
      }
    }
  }

  /**
   * Get supported blockchains
   * @param page Page number (defaults to 1)
   * @param limit Items per page (defaults to 30)
   * @param sortBy Sort field (defaults to blockchain_name)
   */
  async getSupportedBlockchains(page: number = 1, limit: number = 30, sortBy: string = 'blockchain_name'): Promise<any[]> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/blockchains`, {
          headers: this.headers,
          params: {
            sort_by: sortBy,
            offset: (page - 1) * limit,
            limit
          }
        });
        
        log(`Got ${response.data?.data?.length || 0} blockchains from UnleashNFTs v2 API`, 'unleash-nfts');
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 blockchains endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/blockchains`, {
          headers: this.headers,
          params: {
            sort_by: sortBy,
            offset: (page - 1) * limit,
            limit
          }
        });
        
        log(`Got ${response.data?.data?.length || 0} blockchains from UnleashNFTs v1 API`, 'unleash-nfts');
        return response.data.data || [];
      }
    } catch (error) {
      this.handleError('getSupportedBlockchains', error);
      
      // If API fails completely, return a hardcoded entry for Ethereum to prevent cascading failures
      log(`Providing fallback blockchain information for Ethereum`, 'unleash-nfts');
      return [{
        id: 1,
        metadata: {
          name: "Ethereum",
          symbol: "ETH",
          chain_id: "1"
        }
      }];
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
  async getCollectionsByChain(chain: string, page: number = 1, limit: number = 10, metricsParam: string = 'volume', sortBy: string = 'volume'): Promise<NFTCollection[]> {
    try {
      // Get error feedback informing us that metrics is required
      const chainId = this.normalizeChainId(chain);
      log(`Attempting to fetch collections with all required parameters`, 'unleash-nfts');
      
      // Let's try with all parameters including the required metrics
      try {
        const response = await axios.get(`${BASE_URL_V1}/collections`, {
          headers: this.headers,
          params: {
            currency: 'usd',
            metrics: ['volume', 'floor_price', 'market_cap'],  // API requires metrics array
            sort_by: 'holders',
            sort_order: 'desc',
            offset: (page - 1) * limit,
            limit,
            time_range: '24h',
            include_washtrade: true
          }
        });
        
        log(`Successfully retrieved ${response.data?.data?.length || 0} collections`, 'unleash-nfts');
        return response.data.data || [];
      } catch (error: any) {
        // If that fails, try the alternate form with metrics as a string
        const errorMsg = error?.message || 'Unknown error';
        log(`Collections endpoint failed: ${errorMsg}, trying alternate metrics format...`, 'unleash-nfts');
        
        try {
          const response = await axios.get(`${BASE_URL_V1}/collections`, {
            headers: this.headers,
            params: {
              currency: 'usd',
              metrics: 'volume',  // Try as string instead of array
              sort_by: 'volume',  // Match sort_by with metrics
              sort_order: 'desc',
              offset: (page - 1) * limit,
              limit,
              time_range: '24h'
            }
          });
          
          log(`Successfully retrieved ${response.data?.data?.length || 0} collections using string metrics`, 'unleash-nfts');
          return response.data.data || [];
        } catch (metricsError: any) {
          // Final attempt - try with blockchain parameter and all required fields
          log(`Metrics string endpoint failed: ${metricsError.message}, trying with blockchain parameter...`, 'unleash-nfts');
          
          const response = await axios.get(`${BASE_URL_V1}/collections`, {
            headers: this.headers,
            params: {
              blockchain: parseInt(chainId),  // Add blockchain filter
              currency: 'usd',
              metrics: 'volume',  // Required parameter
              sort_by: 'volume',
              sort_order: 'desc',
              offset: (page - 1) * limit,
              limit,
              time_range: '24h'
            }
          });
          
          log(`Successfully retrieved ${response.data?.data?.length || 0} collections with blockchain filter`, 'unleash-nfts');
          return response.data.data || [];
        }
      }
    } catch (error) {
      this.handleError('getCollectionsByChain', error);
      // Even if all API calls fail, return an empty array rather than null
      // to avoid cascading failures
      return [];
    }
  }
  
  /**
   * Normalize chain identifier to the format expected by UnleashNFTs API
   * @param chain Chain identifier (could be name, symbol, or chain_id)
   */
  private normalizeChainId(chain: string): string {
    // Already numeric chain ID
    if (/^\d+$/.test(chain)) {
      return chain;
    }
    
    // Convert common chain names to chain_id
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'eth': '1',
      'polygon': '137',
      'matic': '137',
      'solana': '501',
      'sol': '501',
      'binance': '56',
      'bsc': '56',
      'avalanche': '43114',
      'avax': '43114'
    };
    
    const normalizedChain = chain.toLowerCase();
    if (chainMap[normalizedChain]) {
      log(`Normalized chain "${chain}" to chain_id "${chainMap[normalizedChain]}"`, 'unleash-nfts');
      return chainMap[normalizedChain];
    }
    
    // Default to Ethereum if unknown
    log(`Unknown chain "${chain}", defaulting to Ethereum (chain_id=1)`, 'unleash-nfts');
    return '1';
  }

  /**
   * Get collection metadata by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetadata(contractAddress: string, chain: string): Promise<NFTCollection | null> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/info`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection info endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/info`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/metrics`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection metrics endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/metrics`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/trend`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain,
            time_range: period
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection trend endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/trend`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain,
            time_range: period
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/traits`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection traits endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/traits`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
      this.handleError('getCollectionTraits', error);
      return null;
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/tokens`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 tokens endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/tokens`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
      this.handleError('getCollectionNFTs', error);
      return [];
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/transactions`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection transactions endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/transactions`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collections/with-valuation`, {
          headers: this.headers,
          params: {
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collections with valuation endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collections/with-valuation`, {
          headers: this.headers,
          params: {
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/tokens`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 tokens with valuation endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/tokens`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/valuation`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            token_id: tokenId,
            blockchain: chain
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 NFT valuation endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/valuation`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            token_id: tokenId,
            blockchain: chain
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
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
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/metadata`, {
          headers: this.headers,
          params: {
            blockchain: chain,
            collection_address: contractAddress,
            token_id: tokenId
          }
        });
        return response.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 NFT metadata endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
          headers: this.headers,
          params: {
            blockchain: chain,
            collection_address: contractAddress,
            token_id: tokenId
          }
        });
        return response.data || null;
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
      const params: Record<string, string> = {
        blockchain: chain,
        token_id: tokenId
      };
      
      if (contractAddress) {
        params.collection_address = contractAddress;
      }
      
      if (slugName) {
        params.slug = slugName;
      }
      
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/metadata`, {
          headers: this.headers,
          params
        });
        return response.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 NFT metadata flex endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
          headers: this.headers,
          params
        });
        return response.data || null;
      }
    } catch (error) {
      this.handleError('getNFTMetadataFlex', error);
      return null;
    }
  }

  private handleError(method: string, error: any): void {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const status = error.response?.status;
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = error.config?.method || 'unknown';
    
    // Special handling for authentication errors
    if (status === 401 || errorMessage.includes('API key')) {
      log(`UnleashNfts API AUTHENTICATION ERROR in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`Please check that the VITE_BITCRUNCH_API_KEY environment variable contains a valid API key.`, 'unleash-nfts');
      
      // Show first and last 4 characters of API key for debugging
      if (API_KEY) {
        const firstFour = API_KEY.substring(0, 4);
        const lastFour = API_KEY.substring(API_KEY.length - 4);
        log(`Current API key: ${firstFour}...${lastFour}`, 'unleash-nfts');
      } else {
        log(`Current API key: Not set`, 'unleash-nfts');
      }
      
      // Registration instructions
      log(`To get a valid API key, register at unleashnfts.com and request a key from your profile`, 'unleash-nfts');
      
      // Log the request details for debugging
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else if (status === 429) {
      // Rate limiting errors
      log(`RATE LIMIT EXCEEDED in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`UnleashNFTs has rate limits on API calls. Consider:`, 'unleash-nfts');
      log(`1. Reducing request frequency`, 'unleash-nfts');
      log(`2. Adding caching mechanisms`, 'unleash-nfts');
      log(`3. Upgrading your API plan`, 'unleash-nfts');
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else if (status >= 500) {
      // Server errors
      log(`UnleashNFTs SERVER ERROR in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`This is likely a temporary issue with the UnleashNFTs API service.`, 'unleash-nfts');
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else {
      // Other errors
      log(`UnleashNfts API error in ${method}: ${errorMessage} (Status: ${status || 'unknown'})`, 'unleash-nfts');
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    }
    
    console.error(`UnleashNfts API error in ${method}:`, error);
  }
}

export const unleashNftsService = new UnleashNftsService();