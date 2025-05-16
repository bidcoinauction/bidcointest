// This is a wrapper service that routes all Moralis API calls to Alchemy
// This maintains backward compatibility while using Alchemy under the hood

import { EvmChain } from "@moralisweb3/common-evm-utils";
import { alchemyNftService } from './alchemyNftService';

export interface MoralisNFT {
  tokenId: string;
  tokenAddress: string;
  tokenUri?: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  name?: string;
  symbol?: string;
  amount?: string;
  contractType?: string;
  ownerOf?: string;
}

export class MoralisService {
  // Get NFTs for a specific owner address
  async getWalletNFTs(address: string, chain: string = 'eth'): Promise<MoralisNFT[]> {
    console.log('[moralis] Using Alchemy instead of Moralis for wallet NFTs');
    
    // Route to Alchemy service 
    const alchemyResponse = await alchemyNftService.getNFTsForOwner(address);
    
    // Transform to Moralis format
    return (alchemyResponse?.ownedNfts || []).map((nft: any) => ({
      tokenId: nft.tokenId,
      tokenAddress: nft.contract.address,
      tokenUri: nft.tokenUri?.raw || '',
      metadata: nft.metadata || {
        name: nft.title || nft.name || '',
        description: nft.description || '',
        image: nft.media?.[0]?.gateway || '',
        attributes: nft.metadata?.attributes || []
      },
      name: nft.title || nft.name || '',
      symbol: nft.contract.symbol || '',
      contractType: nft.tokenType || 'ERC721',
      ownerOf: address
    }));
  }
  
  // Get NFT metadata by contract address and token ID
  async getNFTMetadata(address: string, tokenId: string, chain: string = 'eth'): Promise<any> {
    console.log('[moralis] Using Alchemy instead of Moralis for NFT metadata');
    
    // Route to Alchemy service
    return alchemyNftService.getNFTMetadata(address, tokenId);
  }
  
  // Get owner of NFT
  async getNFTOwner(address: string, tokenId: string, chain: string = 'eth'): Promise<any> {
    console.log('[moralis] Using Alchemy instead of Moralis for NFT owner');
    
    // Not directly supported by Alchemy in the same way
    // Usually would need to make an RPC call to the contract
    return { owner: null };
  }
}

export const moralisService = new MoralisService();