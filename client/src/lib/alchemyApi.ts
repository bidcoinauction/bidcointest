import { apiRequest } from './queryClient';

/**
 * Client-side functions to interact with the Alchemy NFT API
 */
export const alchemyApi = {
  /**
   * Get NFT metadata by contract address and token ID
   * @param contractAddress Contract address
   * @param tokenId Token ID
   */
  getNFTMetadata: async (contractAddress: string, tokenId: string) => {
    return apiRequest(`/api/alchemy/nft/${contractAddress}/${tokenId}`, {
      method: 'GET',
    });
  },

  /**
   * Get trending collections with floor prices
   * @param limit Number of collections to retrieve
   */
  getTrendingCollections: async (limit: number = 10) => {
    return apiRequest(`/api/alchemy/collections/trending?limit=${limit}`, {
      method: 'GET',
    });
  },

  /**
   * Get collection metadata and details
   * @param address Collection contract address
   */
  getCollectionMetadata: async (address: string) => {
    return apiRequest(`/api/alchemy/contract/${address}`, {
      method: 'GET',
    });
  },

  /**
   * Get all NFTs for a contract with pagination
   * @param address Contract address
   * @param pageKey Optional pagination key
   * @param pageSize Number of results per page
   */
  getNFTsForContract: async (address: string, pageKey?: string, pageSize: number = 50) => {
    let url = `/api/alchemy/contract/${address}/nfts?pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }
    return apiRequest(url, {
      method: 'GET',
    });
  },

  /**
   * Get all NFTs owned by an address with pagination
   * @param address Owner address
   * @param pageKey Optional pagination key
   * @param pageSize Number of results per page
   */
  getNFTsForOwner: async (address: string, pageKey?: string, pageSize: number = 50) => {
    let url = `/api/alchemy/owner/${address}/nfts?pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }
    return apiRequest(url, {
      method: 'GET',
    });
  },

  /**
   * Get collection floor price
   * @param address Collection contract address
   * @param marketplace Optional marketplace filter
   */
  getFloorPrice: async (address: string, marketplace: string = 'all') => {
    return apiRequest(`/api/alchemy/contract/${address}/floor-price?marketplace=${marketplace}`, {
      method: 'GET',
    });
  }
};