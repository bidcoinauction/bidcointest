import axios from 'axios';
import { log } from './vite';

const BASE_URL = 'https://api.unleashnfts.com';
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
    this.headers = {
      'accept': 'application/json',
      'x-api-key': API_KEY || ''
    };

    if (!API_KEY) {
      log('WARNING: VITE_BITCRUNCH_API_KEY is not set. UnleashNfts API will not work.', 'unleash-nfts');
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
      const response = await axios.get(`${BASE_URL}/collections`, {
        headers: this.headers,
        params: {
          chain,
          page,
          limit
        }
      });
      return response.data.data || [];
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
      const response = await axios.get(`${BASE_URL}/collection/${contractAddress}`, {
        headers: this.headers,
        params: { chain }
      });
      return response.data.data || null;
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
      const response = await axios.get(`${BASE_URL}/collection/${contractAddress}/metrics`, {
        headers: this.headers,
        params: { chain }
      });
      return response.data.data || null;
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
      const response = await axios.get(`${BASE_URL}/collection/${contractAddress}/trend`, {
        headers: this.headers,
        params: { 
          chain,
          period
        }
      });
      return response.data.data || null;
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
      const response = await axios.get(`${BASE_URL}/collection/${contractAddress}/traits`, {
        headers: this.headers,
        params: { chain }
      });
      return response.data.data || null;
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
      const response = await axios.get(`${BASE_URL}/collection/${contractAddress}/nfts`, {
        headers: this.headers,
        params: {
          chain,
          page,
          limit
        }
      });
      return response.data.data || [];
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
      const response = await axios.get(`${BASE_URL}/collection/${contractAddress}/transactions`, {
        headers: this.headers,
        params: {
          chain,
          page,
          limit
        }
      });
      return response.data.data || [];
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
      const response = await axios.get(`${BASE_URL}/collections-with-valuation`, {
        headers: this.headers,
        params: {
          chain,
          page,
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
      const response = await axios.get(`${BASE_URL}/nfts-with-valuation`, {
        headers: this.headers,
        params: {
          collection: contractAddress,
          chain,
          page,
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
      const response = await axios.get(`${BASE_URL}/nft-valuation`, {
        headers: this.headers,
        params: {
          collection: contractAddress,
          token_id: tokenId,
          chain
        }
      });
      return response.data.data || null;
    } catch (error) {
      this.handleError('getNFTValuation', error);
      return null;
    }
  }

  private handleError(method: string, error: any): void {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    log(`UnleashNfts API error in ${method}: ${errorMessage}`, 'unleash-nfts');
    console.error(`UnleashNfts API error in ${method}:`, error);
  }
}

export const unleashNftsService = new UnleashNftsService();