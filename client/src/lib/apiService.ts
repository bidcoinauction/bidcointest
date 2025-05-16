/**
 * Central API service file
 * Consolidates all API interactions in one place
 */

import axios from 'axios';
import { Auction, NFT, BidPack, Activity, BlockchainStats } from "@shared/schema";

const api = axios.create({
  baseURL: '/api'
});

/**
 * NFT API functions - using Alchemy as the primary data source
 * with hosted images from our OortStorages CDN
 */
export const nftApi = {
  /**
   * Get NFT metadata by contract address and token ID
   */
  getNFTMetadata: (contractAddress: string, tokenId: string) => {
    return api.get(`/alchemy/nft/${contractAddress}/${tokenId}`).then(res => res.data);
  },

  /**
   * Get tokenURI data for an NFT
   */
  getTokenURI: (contractAddress: string, tokenId: string, chain: string = 'ethereum') => {
    return api.get(`/nft/token-uri/${contractAddress}/${tokenId}?chain=${chain}`).then(res => res.data);
  },

  /**
   * Get trending collections
   */
  getTrendingCollections: (limit: number = 10) => {
    return api.get(`/alchemy/collections/trending?limit=${limit}`).then(res => res.data);
  },

  /**
   * Get collection metadata
   */
  getCollectionMetadata: (address: string) => {
    return api.get(`/alchemy/contract/${address}`).then(res => res.data);
  },

  /**
   * Get NFTs owned by an address
   */
  getOwnedNFTs: (ownerAddress: string, pageKey?: string, pageSize: number = 50) => {
    let url = `/alchemy/owner/${ownerAddress}/nfts?pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }
    return api.get(url).then(res => res.data);
  }
};

/**
 * Auction API functions
 */
export const auctionService = {
  /**
   * Get all auctions
   */
  getAuctions: () => {
    return api.get<Auction[]>("/auctions").then(res => res.data);
  },

  /**
   * Get auction by ID
   */
  getAuction: async (id: number): Promise<Auction> => {
    const { data } = await api.get<Auction>(`/auctions/${id}`);

    if (data && data.nft && data.nft.id) {
      try {
        const { data: enrichedNFT } = await api.get(`/nft-details/${data.nft.id}`);
        if (enrichedNFT) {
          data.nft = enrichedNFT;
        }
      } catch (error) {
        console.error('Error fetching enriched NFT details:', error);
      }
    }

    return data;
  },

  /**
   * Get featured auctions
   */
  getFeaturedAuctions: () => {
    return api.get<Auction[]>("/auctions/featured").then(res => res.data);
  },

  /**
   * Place a bid on an auction
   */
  placeBid: (auctionId: number, amount: string, bidderAddress: string) => {
    return api.post<Auction>(`/bids`, {
      auctionId,
      amount,
      bidderAddress,
    }).then(res => res.data);
  }
};

/**
 * BidPack API functions
 */
export const bidPackService = {
  /**
   * Get all bid packs
   */
  getBidPacks: () => {
    return api.get<BidPack[]>("/bidpacks").then(res => res.data);
  },

  /**
   * Get bid pack by ID
   */
  getBidPack: (id: number) => {
    return api.get<BidPack>(`/bidpacks/${id}`).then(res => res.data);
  },

  /**
   * Purchase a bid pack
   */
  purchaseBidPack: (bidPackId: number, walletAddress: string) => {
    return api.post("/bidpacks/purchase", {
      bidPackId,
      walletAddress,
    }).then(res => res.data);
  },

  /**
   * Get user's bid packs
   */
  getUserBidPacks: (userId: number) => {
    return api.get<any[]>(`/users/${userId}/bidpacks`).then(res => res.data);
  }
};

/**
 * Activity API functions
 */
export const activityService = {
  /**
   * Get all activity
   */
  getActivity: () => {
    return api.get<Activity[]>("/activity").then(res => res.data);
  }
};

/**
 * Blockchain API functions
 */
export const blockchainService = {
  /**
   * Get blockchain stats
   */
  getBlockchainStats: () => {
    return api.get<BlockchainStats>("/blockchain/stats").then(res => res.data);
  }
};

/**
 * User API functions
 */
export const userService = {
  /**
   * Get user by wallet address
   */
  getUserByWalletAddress: (walletAddress: string) => {
    if (!walletAddress) return Promise.resolve(null);
    return api.get<any>(`/users/by-wallet/${walletAddress}`).then(res => res.data);
  }
};

/**
 * Achievement API functions
 */
export const achievementService = {
  /**
   * Get user achievements
   */
  getUserAchievements: (userId: number) => {
    return api.get<any[]>(`/users/${userId}/achievements`).then(res => res.data);
  },

  /**
   * Get user achievement stats
   */
  getUserAchievementStats: (userId: number) => {
    return api.get<any>(`/users/${userId}/achievement-stats`).then(res => res.data);
  }
};