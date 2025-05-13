import axios from 'axios';
import { NFT } from '@shared/schema';

// MagicEden API base URL
const MAGIC_EDEN_API_URL = 'https://api-mainnet.magiceden.dev/v2';

// MagicEden service for fetching NFT data
export class MagicEdenService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: MAGIC_EDEN_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // Get popular collections from MagicEden
  async getPopularCollections(limit = 5, timeRange = '1d') {
    try {
      const response = await this.client.get(`/collections/popular?timeRange=${timeRange}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular collections:', error);
      return [];
    }
  }

  // Get NFTs from a specific collection
  async getCollectionNFTs(collectionSymbol: string, limit = 5) {
    try {
      const response = await this.client.get(`/collections/${collectionSymbol}/listings?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching NFTs for collection ${collectionSymbol}:`, error);
      return [];
    }
  }

  // Get specific NFT details
  async getNFTDetails(collectionSymbol: string, tokenMint: string) {
    try {
      const response = await this.client.get(`/tokens/${tokenMint}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching NFT details for ${tokenMint}:`, error);
      return null;
    }
  }

  // Convert MagicEden NFT format to our app's NFT format
  convertToAppNFT(meNFT: any, creatorId: number): Omit<NFT, 'id'> {
    // Extract attributes from MagicEden format
    const attributes = meNFT.attributes?.map((attr: any) => ({
      trait_type: attr.trait_type,
      value: attr.value,
      rarity: `${Math.round(Math.random() * 30)}%` // MagicEden doesn't provide rarity percentages in the same format
    })) || [];

    return {
      name: meNFT.title || meNFT.name || `NFT #${meNFT.tokenMint?.slice(-4)}`,
      description: meNFT.description || 'No description available',
      imageUrl: meNFT.img || meNFT.image || 'https://via.placeholder.com/400',
      tokenId: meNFT.tokenMint || meNFT.mintAddress || '',
      contractAddress: meNFT.contractAddress || '',
      blockchain: meNFT.chain || 'SOL',
      tokenStandard: meNFT.tokenStandard || 'Metaplex',
      royalty: meNFT.sellerFeeBasisPoints ? (meNFT.sellerFeeBasisPoints / 100).toString() : "5.0",
      collection: meNFT.collection || '',
      floorPrice: meNFT.price || 0,
      currency: meNFT.currency || 'SOL',
      category: meNFT.category || 'art',
      creatorId,
      attributes,
      createdAt: new Date(),
      creator: { id: creatorId } as any, // Will be populated by the storage layer
    };
  }
}

// Export singleton instance
export const magicEdenService = new MagicEdenService();