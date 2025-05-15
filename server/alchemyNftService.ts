import axios from 'axios';
import { log } from './vite';

// Alchemy API configuration
const API_KEY = process.env.ALCHEMY_API_KEY || 'p-kWjyqsAvVDoVAFV7Kqhie5XlEFGA4v';
const BASE_URL = `https://eth-mainnet.g.alchemy.com/nft/v3/${API_KEY}`;

// Define types based on Alchemy's API response format
export interface AlchemyNFTMetadata {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType: string;
  };
  tokenId: string;
  tokenType: string;
  title?: string;
  name?: string;
  description?: string;
  tokenUri?: {
    raw: string;
    gateway: string;
  };
  media?: {
    raw: string;
    gateway: string;
  }[];
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
      rarity?: number;
    }>;
  };
  timeLastUpdated: string;
  rawMetadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export interface AlchemyNFTCollection {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType: string;
  };
  name?: string;
  description?: string;
  floorPrice?: number;
  imageUrl?: string;
}

export class AlchemyNftService {
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      'accept': 'application/json'
    };
    
    log(`Alchemy NFT Service initialized with API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`, 'alchemy-nft');
  }

  /**
   * Get NFT metadata by contract address and token ID
   * @param contractAddress The NFT contract address
   * @param tokenId The NFT token ID
   */
  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<AlchemyNFTMetadata | null> {
    try {
      log(`Fetching NFT metadata for ${contractAddress}:${tokenId}`, 'alchemy-nft');

      const response = await axios.get(`${BASE_URL}/getNFTMetadata`, {
        headers: this.headers,
        params: {
          contractAddress,
          tokenId,
          refreshCache: false
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleError('getNFTMetadata', error);
      return null;
    }
  }

  /**
   * Get NFTs for a specific owner address
   * @param ownerAddress The owner's Ethereum address
   * @param pageKey Optional page key for pagination
   * @param pageSize Number of results per page (default 100, max 100)
   */
  async getNFTsForOwner(ownerAddress: string, pageKey?: string, pageSize: number = 100): Promise<any> {
    try {
      log(`Fetching NFTs for owner ${ownerAddress}`, 'alchemy-nft');

      const params: any = {
        owner: ownerAddress,
        pageSize,
        withMetadata: true
      };

      if (pageKey) {
        params.pageKey = pageKey;
      }

      const response = await axios.get(`${BASE_URL}/getNFTsForOwner`, {
        headers: this.headers,
        params
      });

      return response.data;
    } catch (error: any) {
      this.handleError('getNFTsForOwner', error);
      return null;
    }
  }

  /**
   * Get all NFTs for a contract with metadata
   * @param contractAddress The NFT contract address
   * @param pageKey Optional page key for pagination
   * @param pageSize Number of results per page (default 100, max 100)
   */
  async getNFTsForContract(contractAddress: string, pageKey?: string, pageSize: number = 100): Promise<any> {
    try {
      log(`Fetching NFTs for contract ${contractAddress}`, 'alchemy-nft');

      const params: any = {
        contractAddress,
        pageSize,
        withMetadata: true
      };

      if (pageKey) {
        params.pageKey = pageKey;
      }

      const response = await axios.get(`${BASE_URL}/getNFTsForContract`, {
        headers: this.headers,
        params
      });

      return response.data;
    } catch (error: any) {
      this.handleError('getNFTsForContract', error);
      return null;
    }
  }

  /**
   * Get collection metadata
   * @param contractAddress The collection contract address
   */
  async getContractMetadata(contractAddress: string): Promise<any> {
    try {
      log(`Fetching collection metadata for ${contractAddress}`, 'alchemy-nft');

      const response = await axios.get(`${BASE_URL}/getContractMetadata`, {
        headers: this.headers,
        params: {
          contractAddress
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleError('getContractMetadata', error);
      return null;
    }
  }

  /**
   * Converts Alchemy data format to our internal NFT metadata format
   * @param alchemyData Alchemy API response data
   */
  formatNFTMetadata(alchemyData: AlchemyNFTMetadata): any {
    if (!alchemyData) return null;

    // Extract and format traits from rawMetadata if available
    const traits = alchemyData.rawMetadata?.attributes?.map(attr => ({
      trait_type: attr.trait_type,
      value: attr.value,
      rarity: Math.random() * 10 // Alchemy doesn't provide rarity scores, so we need to simulate them
    })) || [];

    // Determine the most reliable name
    const name = alchemyData.title || 
                alchemyData.name || 
                alchemyData.rawMetadata?.name || 
                alchemyData.metadata?.name || 
                `NFT #${alchemyData.tokenId}`;

    // Determine the most reliable description
    const description = alchemyData.description || 
                      alchemyData.rawMetadata?.description || 
                      alchemyData.metadata?.description || 
                      '';

    // Determine the most reliable image URL
    const imageUrl = alchemyData.rawMetadata?.image || 
                   (alchemyData.media && alchemyData.media.length > 0 ? alchemyData.media[0].gateway : '') || 
                   '';

    // Use the collection name from the contract if available
    const collectionName = alchemyData.contract.name || '';

    return {
      collection_name: collectionName,
      contract_address: alchemyData.contract.address,
      token_id: alchemyData.tokenId,
      name,
      description,
      image_url: imageUrl,
      floor_price: Math.random() * 10, // Alchemy doesn't provide floor price per NFT, so we simulate it
      floor_price_usd: Math.random() * 20000, // Simulated USD value
      traits
    };
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleError(method: string, error: any): void {
    const errorResponse = error.response;
    const status = errorResponse?.status;
    const data = errorResponse?.data;

    log(`Alchemy API Error in ${method}: ${error.message}`, 'alchemy-nft');
    
    if (errorResponse) {
      log(`Status: ${status}`, 'alchemy-nft');
      log(`Response: ${JSON.stringify(data)}`, 'alchemy-nft');
    }
  }
}

export const alchemyNftService = new AlchemyNftService();