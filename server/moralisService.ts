import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { NFT, InsertNFT } from "@shared/schema";

export class MoralisService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (!process.env.MORALIS_API_KEY) {
      console.error("Missing MORALIS_API_KEY environment variable");
      return;
    }

    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      this.initialized = true;
      console.log("Moralis service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Moralis:", error);
    }
  }

  async getWalletNFTs(walletAddress: string, chain = EvmChain.ETHEREUM): Promise<any[]> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address: walletAddress,
        chain,
        limit: 10, // Adjusted for reasonable response size
      });

      return response?.toJSON().result || [];
    } catch (error) {
      console.error(`Failed to get NFTs for wallet ${walletAddress}:`, error);
      return [];
    }
  }

  async getNFTsByCollection(collectionAddress: string, chain = EvmChain.ETHEREUM): Promise<any[]> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const response = await Moralis.EvmApi.nft.getContractNFTs({
        address: collectionAddress,
        chain,
        limit: 10, // Adjusted for reasonable response size
      });

      return response?.toJSON().result || [];
    } catch (error) {
      console.error(`Failed to get NFTs for collection ${collectionAddress}:`, error);
      return [];
    }
  }

  async getNFTMetadata(tokenAddress: string, tokenId: string, chain = EvmChain.ETHEREUM): Promise<any> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const response = await Moralis.EvmApi.nft.getNFTMetadata({
        address: tokenAddress,
        tokenId,
        chain,
      });

      return response?.toJSON() || null;
    } catch (error) {
      console.error(`Failed to get metadata for NFT ${tokenAddress}:${tokenId}:`, error);
      return null;
    }
  }

  // Convert Moralis NFT data to our application's NFT schema
  mapToAppNFT(moralisNFT: any, creatorId: number): Omit<InsertNFT, "id"> {
    // Handle missing metadata by providing default values
    let metadata = {};
    
    try {
      if (moralisNFT.metadata) {
        metadata = typeof moralisNFT.metadata === 'string' 
          ? JSON.parse(moralisNFT.metadata) 
          : moralisNFT.metadata;
      }
    } catch (e) {
      console.error("Failed to parse NFT metadata:", e);
    }
    
    const name = metadata.name || moralisNFT.name || `NFT #${moralisNFT.token_id}`;
    const description = metadata.description || 'No description available';
    let imageUrl = '/assets/nft_images/default_nft.png';
    
    if (metadata.image) {
      imageUrl = metadata.image;
    } else if (metadata.image_url) {
      imageUrl = metadata.image_url;
    } else if (moralisNFT.token_uri) {
      // Some NFTs might have image URL in token_uri
      imageUrl = moralisNFT.token_uri;
    }
                     
    // Clean up image URL (remove ipfs:// prefix, etc.)
    const cleanImageUrl = this.cleanImageUrl(imageUrl);
    
    // Extract attributes if available
    const attributes = metadata.attributes || [];
    
    // Process attributes to ensure they match our expected format
    const processedAttributes = attributes.map((attr: any) => {
      return {
        trait_type: attr.trait_type || attr.key || "Property",
        value: attr.value || attr.trait_value || "",
        rarity: attr.rarity || "common"
      };
    });

    // Return NFT data that matches InsertNFT type from our schema
    return {
      name,
      description,
      tokenId: moralisNFT.token_id || "",
      contractAddress: moralisNFT.token_address || "",
      tokenStandard: moralisNFT.contract_type || 'ERC721',
      blockchain: 'ethereum', // Default to ethereum for now
      royalty: '0', // Default royalty
      collection: moralisNFT.name || "Unknown Collection",
      floorPrice: null, // Default floor price
      currency: 'ETH', // Default currency
      items: null, // Default items count
      category: 'art', // Default category
      creatorId, // User who imported the NFT
      imageUrl: cleanImageUrl,
      attributes: processedAttributes
    };
  }

  // Helper to clean up image URLs
  private cleanImageUrl(url: string): string {
    if (!url) return '/assets/nft_images/default_nft.png';
    
    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      return url;
    }
    
    return url;
  }
}

export const moralisService = new MoralisService();