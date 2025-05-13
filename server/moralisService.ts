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

      return response.toJSON().result || [];
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

      return response.toJSON().result || [];
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

      return response.toJSON() || null;
    } catch (error) {
      console.error(`Failed to get metadata for NFT ${tokenAddress}:${tokenId}:`, error);
      return null;
    }
  }

  // Convert Moralis NFT data to our application's NFT schema
  mapToAppNFT(moralisNFT: any, creatorId: number): Omit<InsertNFT, "id"> {
    // Handle missing metadata by providing default values
    const metadata = moralisNFT.metadata ? 
      (typeof moralisNFT.metadata === 'string' ? 
        JSON.parse(moralisNFT.metadata) : 
        moralisNFT.metadata) 
      : {};
    
    const name = metadata.name || moralisNFT.name || `${moralisNFT.symbol} #${moralisNFT.token_id}`;
    const description = metadata.description || 'No description available';
    const imageUrl = metadata.image || 
                     metadata.image_url || 
                     `/assets/nft_images/default_nft.png`;
                     
    // Clean up image URL (remove ipfs:// prefix, etc.)
    const cleanImageUrl = this.cleanImageUrl(imageUrl);
    
    // Extract attributes if available
    const attributes = metadata.attributes || [];

    return {
      name,
      description,
      tokenId: moralisNFT.token_id,
      contractAddress: moralisNFT.token_address,
      tokenStandard: moralisNFT.contract_type || 'ERC721',
      blockchain: 'ethereum', // Default to ethereum for now
      royalty: '0', // Default royalty
      collection: moralisNFT.name,
      supply: '1', // Default to 1 for NFTs
      creatorId,
      imageUrl: cleanImageUrl,
      attributes: attributes,
      rarity: 'common', // Default rarity
      createdAt: new Date(),
      currency: 'ETH' // Default currency
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