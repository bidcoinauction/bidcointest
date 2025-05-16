import { fetchFromAPI } from './api';

/**
 * Consolidated API service for NFT data fetching
 * Integrates Alchemy and UnleashNFTs APIs in a clean unified interface
 */
export const nftApi = {
  /**
   * Get NFT metadata by contract address and token ID
   * @param contractAddress Contract address
   * @param tokenId Token ID
   */
  getNFTMetadata: async (contractAddress: string, tokenId: string) => {
    // Try Alchemy first as our primary data source
    return fetchFromAPI(`/alchemy/nft/${contractAddress}/${tokenId}`);
  },

  /**
   * Get trending collections with floor prices
   * @param limit Number of collections to retrieve
   */
  getTrendingCollections: async (limit: number = 10) => {
    return fetchFromAPI(`/alchemy/collections/trending?limit=${limit}`);
  },

  /**
   * Get collection metadata and details
   * @param address Collection contract address
   */
  getCollectionMetadata: async (address: string) => {
    return fetchFromAPI(`/alchemy/contract/${address}`);
  },

  /**
   * Get all NFTs for a contract with pagination
   * @param address Contract address
   * @param pageKey Optional pagination key
   * @param pageSize Number of results per page
   */
  getNFTsForContract: async (address: string, pageKey?: string, pageSize: number = 50) => {
    let url = `/alchemy/contract/${address}/nfts?pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }
    return fetchFromAPI(url);
  },

  /**
   * Get all NFTs owned by an address with pagination
   * @param address Owner address
   * @param pageKey Optional pagination key
   * @param pageSize Number of results per page
   */
  getNFTsForOwner: async (address: string, pageKey?: string, pageSize: number = 50) => {
    let url = `/alchemy/owner/${address}/nfts?pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }
    return fetchFromAPI(url);
  },

  /**
   * Get detailed metadata from UnleashNFTs API
   * @param contractAddress NFT contract address
   * @param tokenId Token ID
   * @param chainId Blockchain ID (1 = Ethereum)
   */
  getDetailedMetadata: async (contractAddress: string, tokenId: string, chainId: number = 1) => {
    return fetchFromAPI(`/unleash/nft/metadata?contract_address=${contractAddress}&token_id=${tokenId}&chain_id=${chainId}`);
  },
  
  /**
   * Get hosted image URL for NFT
   * Uses our reliable hosted image service
   * @param nftName NFT name used for mapping to hosted URL
   */
  getHostedImageUrl: (nftName: string): string | null => {
    const hostedImages: Record<string, string> = {
      "Doodles #1234": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ.avif",
      "Mutant Ape Yacht Club #3652": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/ebebf8da2543032f469b1a436d848822.png",
      "CryptoPunk #7804": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/0x56b0fda9566d9e9b35e37e2a29484b8ec28bb5f7833ac2f8a48ae157bad691b5.png",
      "BAYC #4269": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/4269.jpg",
      "Milady #7218": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/7218.avif",
      "DeGods #8747": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/8747-dead.png",
      "Mad Lads #8993": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/8993.avif"
    };
    
    return hostedImages[nftName] || null;
  }
};