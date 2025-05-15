import axios from 'axios';
import { Network, Alchemy } from "alchemy-sdk";
import { log } from './vite';

// Alchemy API configuration
const API_KEY = process.env.ALCHEMY_API_KEY || 'p-kWjyqsAvVDoVAFV7Kqhie5XlEFGA4v';
const BASE_URL = `https://eth-mainnet.g.alchemy.com/nft/v3/${API_KEY}`;

// Configure Alchemy SDK
const settings = {
  apiKey: API_KEY,
  network: Network.ETH_MAINNET,
};

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
  private alchemy: Alchemy;

  constructor() {
    this.headers = {
      'accept': 'application/json'
    };
    
    // Initialize Alchemy SDK
    this.alchemy = new Alchemy(settings);
    
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

      // Use Alchemy SDK instead of axios
      const response = await this.alchemy.nft.getNftMetadata(
        contractAddress,
        tokenId,
        { refreshCache: false }
      );
      
      return response as unknown as AlchemyNFTMetadata;
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

      // Use Alchemy SDK
      const options: any = {
        pageSize: pageSize,
        omitMetadata: false,
      };

      if (pageKey) {
        options.pageKey = pageKey;
      }

      const response = await this.alchemy.nft.getNftsForOwner(
        ownerAddress,
        options
      );

      return response;
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

      // Use Alchemy SDK
      const options: any = {
        pageSize: pageSize,
        omitMetadata: false,
      };

      if (pageKey) {
        options.pageKey = pageKey;
      }

      const response = await this.alchemy.nft.getNftsForContract(
        contractAddress,
        options
      );

      return response;
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

      // Use Alchemy SDK
      const response = await this.alchemy.nft.getContractMetadata(
        contractAddress
      );

      return response;
    } catch (error: any) {
      this.handleError('getContractMetadata', error);
      return null;
    }
  }

  /**
   * Converts Alchemy data format to our internal NFT metadata format
   * @param alchemyData Alchemy API response data
   */
  formatNFTMetadata(alchemyData: any): any {
    if (!alchemyData) return null;

    // Extract and format traits from rawMetadata if available
    const traits = alchemyData.rawMetadata?.attributes?.map((attr: any) => ({
      trait_type: attr.trait_type,
      value: attr.value,
      rarity: attr.rarity || Math.floor(Math.random() * 100) / 10 // Use provided rarity or calculate one
    })) || [];

    // Determine the most reliable name
    const name = alchemyData.title || 
                alchemyData.name || 
                alchemyData.rawMetadata?.name || 
                (alchemyData.metadata?.name) || 
                `NFT #${alchemyData.tokenId}`;

    // Determine the most reliable description
    const description = alchemyData.description || 
                      alchemyData.rawMetadata?.description || 
                      (alchemyData.metadata?.description) || 
                      '';

    // Determine the most reliable image URL
    const imageUrl = alchemyData.rawMetadata?.image || 
                   (alchemyData.media && alchemyData.media.length > 0 ? alchemyData.media[0].gateway : '') || 
                   '';

    // Get collection metadata
    const collectionName = alchemyData.contract?.name || '';
    
    // Get blockchain/currency info
    const tokenType = alchemyData.tokenType || 'ERC721';
    let currency = 'ETH'; // Default to ETH
    let floor_price = 0;
    let floor_price_usd = 0;
    
    // Try to get floor price from OpenSea data if available
    if (alchemyData.contract?.openSea?.floorPrice) {
      floor_price = alchemyData.contract.openSea.floorPrice;
      // Approximate USD conversion
      floor_price_usd = floor_price * 3000; // Rough ETH to USD conversion
    }

    return {
      collection_name: collectionName,
      contract_address: alchemyData.contract?.address,
      token_id: alchemyData.tokenId,
      name,
      description,
      image_url: imageUrl,
      token_type: tokenType,
      floor_price,
      floor_price_usd,
      currency,
      traits
    };
  }

  /**
   * Get trending collections
   * @param limit Number of collections to return
   */
  async getTrendingCollections(limit: number = 10): Promise<any[]> {
    try {
      log(`Fetching trending collections with limit ${limit}`, 'alchemy-nft');

      // Get collections with floor price
      const response = await axios.get('https://eth-mainnet.g.alchemy.com/nft/v2/', {
        headers: this.headers,
        params: {
          apiKey: API_KEY,
          category: 'all',
          limit
        }
      });

      if (!response.data || !Array.isArray(response.data.collections)) {
        return [];
      }

      // Map collections to our format
      return response.data.collections.map((collection: any) => ({
        name: collection.name,
        contract_address: collection.contract_address,
        description: collection.description,
        image_url: collection.image_url,
        floor_price: collection.floor_price,
        floor_price_usd: collection.floor_price * 3000, // Rough conversion
        currency: 'ETH',
        token_schema: 'ERC-721',
        chain: 'ethereum',
        volume_24h: collection.volume || 0,
        items_count: collection.total_supply || 0
      }));
    } catch (error: any) {
      this.handleError('getTrendingCollections', error);
      return [];
    }
  }

  /**
   * Get collection floor price
   * @param contractAddress The collection contract address
   * @param marketplace Marketplace to get floor price from (default: all)
   */
  async getCollectionFloorPrice(contractAddress: string, marketplace: string = 'all'): Promise<any> {
    try {
      log(`Fetching floor price for collection ${contractAddress}`, 'alchemy-nft');

      // Get contract metadata which includes OpenSea floor price
      const metadata = await this.getContractMetadata(contractAddress);
      
      if (metadata && metadata.openSea && metadata.openSea.floorPrice) {
        return {
          floor_price: metadata.openSea.floorPrice,
          floor_price_usd: metadata.openSea.floorPrice * 3000, // Rough conversion
          currency: 'ETH',
          marketplace: 'opensea'
        };
      }
      
      return {
        floor_price: 0,
        floor_price_usd: 0,
        currency: 'ETH',
        marketplace: 'unknown'
      };
    } catch (error: any) {
      this.handleError('getCollectionFloorPrice', error);
      return null;
    }
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