/**
 * Central API service file
 * Consolidates all API interactions in one place
 */

import { Auction, NFT, BidPack, Activity, BlockchainStats } from "@shared/schema";
import { fetchFromAPI } from './api';

/**
 * NFT API functions - using Alchemy as the primary data source
 * with hosted images from our OortStorages CDN
 */
export const nftApi = {
  /**
   * Get NFT metadata by contract address and token ID
   * @param contractAddress Contract address
   * @param tokenId Token ID
   */
  getNFTMetadata: (contractAddress: string, tokenId: string) => {
    return fetchFromAPI(`/alchemy/nft/${contractAddress}/${tokenId}`);
  },

  /**
   * Get tokenURI data for an NFT
   * @param contractAddress Contract address of the NFT
   * @param tokenId Token ID of the NFT
   * @param chain Blockchain network (default: ethereum)
   */
  getTokenURI: (contractAddress: string, tokenId: string, chain: string = 'ethereum') => {
    return fetchFromAPI(`/nft/token-uri/${contractAddress}/${tokenId}?chain=${chain}`);
  },

  /**
   * Get trending collections
   * @param limit Number of collections to retrieve
   */
  getTrendingCollections: (limit: number = 10) => {
    return fetchFromAPI(`/alchemy/collections/trending?limit=${limit}`);
  },

  /**
   * Get collection metadata
   * @param address Collection contract address
   */
  getCollectionMetadata: (address: string) => {
    return fetchFromAPI(`/alchemy/contract/${address}`);
  },

  /**
   * Get NFTs owned by an address
   * @param ownerAddress Owner's wallet address
   * @param pageKey Pagination key
   * @param pageSize Results per page
   */
  getOwnedNFTs: (ownerAddress: string, pageKey?: string, pageSize: number = 50) => {
    let url = `/alchemy/owner/${ownerAddress}/nfts?pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }
    return fetchFromAPI(url);
  },

  /**
   * Get hosted image URL for NFT
   * @param nftName NFT name for mapping
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

/**
 * Auction API functions
 */
export const auctionService = {
  /**
   * Get all auctions
   */
  getAuctions: () => {
    return fetchFromAPI<Auction[]>("/auctions");
  },

  /**
   * Get auction by ID
   * @param id Auction ID
   */
  getAuction: async (id: number): Promise<Auction> => {
    const data = await fetchFromAPI<Auction>(`/auctions/${id}`);
    
    // If we have an NFT in the auction data, fetch detailed NFT metadata
    if (data && data.nft && data.nft.id) {
      try {
        // Fetch enriched NFT data with consistent metadata
        const enrichedNFT = await fetchFromAPI<typeof data.nft>(`/nft-details/${data.nft.id}`);
        if (enrichedNFT) {
          data.nft = enrichedNFT;
        }
      } catch (error) {
        console.error('Error fetching enriched NFT details:', error);
        // Continue with original NFT data if enrichment fails
      }
    }
    
    return data;
  },

  /**
   * Get featured auctions
   */
  getFeaturedAuctions: () => {
    return fetchFromAPI<Auction[]>("/auctions/featured");
  },

  /**
   * Place a bid on an auction
   * @param auctionId Auction ID
   * @param amount Bid amount
   * @param bidderAddress Bidder's wallet address
   */
  placeBid: (auctionId: number, amount: string, bidderAddress: string) => {
    return fetchFromAPI<Auction>(`/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auctionId,
        amount,
        bidderAddress,
      }),
    });
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
    return fetchFromAPI<BidPack[]>("/bidpacks");
  },

  /**
   * Get bid pack by ID
   * @param id BidPack ID
   */
  getBidPack: (id: number) => {
    return fetchFromAPI<BidPack>(`/bidpacks/${id}`);
  },

  /**
   * Purchase a bid pack
   * @param bidPackId BidPack ID
   * @param walletAddress Buyer's wallet address
   */
  purchaseBidPack: (bidPackId: number, walletAddress: string) => {
    return fetchFromAPI<any>("/bidpacks/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bidPackId,
        walletAddress,
      }),
    });
  },

  /**
   * Get user's bid packs
   * @param userId User ID
   */
  getUserBidPacks: (userId: number) => {
    return fetchFromAPI<any[]>(`/users/${userId}/bidpacks`);
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
    return fetchFromAPI<Activity[]>("/activity");
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
    return fetchFromAPI<BlockchainStats>("/blockchain/stats");
  }
};

/**
 * User API functions
 */
export const userService = {
  /**
   * Get user by wallet address
   * @param walletAddress Wallet address
   */
  getUserByWalletAddress: (walletAddress: string) => {
    if (!walletAddress) return Promise.resolve(null);
    return fetchFromAPI<any>(`/users/by-wallet/${walletAddress}`);
  }
};

/**
 * Achievement API functions
 */
export const achievementService = {
  /**
   * Get user achievements
   * @param userId User ID
   */
  getUserAchievements: (userId: number) => {
    return fetchFromAPI<any[]>(`/users/${userId}/achievements`);
  },

  /**
   * Get user achievement stats
   * @param userId User ID
   */
  getUserAchievementStats: (userId: number) => {
    return fetchFromAPI<any>(`/users/${userId}/achievement-stats`);
  }
};