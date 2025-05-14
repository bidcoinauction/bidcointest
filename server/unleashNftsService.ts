import axios from 'axios';
import { log } from './vite';

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
      const response = await axios.get(`${BASE_URL_V1}/blockchains`, {
        headers: this.headers,
        params: {
          sort_by: sortBy,
          offset: (page - 1) * limit,
          limit
        }
      });
      
      log(`Got ${response.data?.data?.length || 0} blockchains from UnleashNFTs`, 'unleash-nfts');
      return response.data.data || [];
    } catch (error) {
      this.handleError('getSupportedBlockchains', error);
      return [];
    }
  }

  /**
   * Get collections by blockchain
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionsByChain(chain: string, page: number = 1, limit: number = 10): Promise<NFTCollection[]> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collections`, {
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
        log(`V2 collections endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collections`, {
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
      const response = await axios.get(`${BASE_URL}/nft/collections/with-valuation`, {
        headers: this.headers,
        params: {
          blockchain: chain,
          offset: (page - 1) * limit,
          limit
        }
      });
      return response.data.data || [];
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
      const response = await axios.get(`${BASE_URL}/nft/tokens`, {
        headers: this.headers,
        params: {
          collection_address: contractAddress,
          blockchain: chain,
          offset: (page - 1) * limit,
          limit
        }
      });
      return response.data.data || [];
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
      const response = await axios.get(`${BASE_URL}/nft/valuation`, {
        headers: this.headers,
        params: {
          collection_address: contractAddress,
          token_id: tokenId,
          blockchain: chain
        }
      });
      return response.data.data || null;
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
      const response = await axios.get(`${BASE_URL}/nft/metadata`, {
        headers: this.headers,
        params: {
          blockchain: chain,
          collection_address: contractAddress,
          token_id: tokenId
        }
      });
      return response.data || null;
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
      
      const response = await axios.get(`${BASE_URL}/nft/metadata`, {
        headers: this.headers,
        params
      });
      return response.data || null;
    } catch (error) {
      this.handleError('getNFTMetadataFlex', error);
      return null;
    }
  }

  private handleError(method: string, error: any): void {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const status = error.response?.status;
    
    // Special handling for authentication errors
    if (status === 401 || errorMessage.includes('API key')) {
      log(`UnleashNfts API AUTHENTICATION ERROR in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`Please check that the VITE_BITCRUNCH_API_KEY environment variable contains a valid API key.`, 'unleash-nfts');
      log(`Current API key prefix: ${API_KEY ? API_KEY.substring(0, 4) + '...' : 'Not set'}`, 'unleash-nfts');
      
      // Log the request details for debugging
      const requestUrl = error.config?.url || 'unknown';
      const requestMethod = error.config?.method || 'unknown';
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else {
      log(`UnleashNfts API error in ${method}: ${errorMessage}`, 'unleash-nfts');
    }
    
    console.error(`UnleashNfts API error in ${method}:`, error);
  }
}

export const unleashNftsService = new UnleashNftsService();