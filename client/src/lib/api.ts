import { Auction, NFT, BidPack, Activity, BlockchainStats } from "@shared/schema";

// Base API URL
const API_BASE = "/api";

// Generic fetch function with improved error handling
export async function fetchFromAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
      let errorMessage = "";
      try {
        // Try to parse JSON error response
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
        // If not JSON, get plain text
        errorMessage = await response.text();
      }
      
      const error = new Error(`API Error (${response.status}): ${errorMessage}`);
      // Add response details to the error object for better debugging
      (error as any).status = response.status;
      (error as any).endpoint = endpoint;
      throw error;
    }
    
    return response.json();
  } catch (err) {
    // Handle network errors (like CORS, connection issues)
    if (!(err instanceof Error) || !err.message.includes('API Error')) {
      console.error(`Network error when fetching from ${endpoint}:`, err);
      throw new Error(`Network error when connecting to server. Please check your connection and try again.`);
    }
    throw err;
  }
}

// Auction API calls
export async function getAuctions(): Promise<Auction[]> {
  return fetchFromAPI<Auction[]>("/auctions");
}

export async function getAuction(id: number): Promise<Auction> {
  const data = await fetchFromAPI<Auction>(`/auctions/${id}`);
  
  // If we have an NFT in the auction data, fetch detailed NFT metadata
  if (data && data.nft && data.nft.id) {
    try {
      // Fetch enriched NFT data with consistent floor price/metadata from our new endpoint
      const enrichedNFT = await fetchFromAPI<typeof data.nft>(`/nft-details/${data.nft.id}`);
      if (enrichedNFT) {
        // Update the NFT data in the auction with enriched metadata
        console.log('Enriched NFT data received:', enrichedNFT);
        data.nft = enrichedNFT;
      }
    } catch (error) {
      console.error('Error fetching enriched NFT details:', error);
      // Continue with original NFT data if enrichment fails
    }
  }
  
  return data;
}

export async function getFeaturedAuctions(): Promise<Auction[]> {
  return fetchFromAPI<Auction[]>("/auctions/featured");
}

export async function placeBid(auctionId: number, amount: string, bidderAddress: string): Promise<Auction> {
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

// This is an alias used in some components
export async function apiPlaceBid(auctionId: number, amount: string, bidderAddress: string): Promise<Auction> {
  return placeBid(auctionId, amount, bidderAddress);
}

// NFT API calls
export async function getNFTs(): Promise<NFT[]> {
  return fetchFromAPI<NFT[]>("/nfts");
}

export async function getNFT(id: number): Promise<NFT> {
  return fetchFromAPI<NFT>(`/nfts/${id}`);
}

export async function getTokenURI(tokenAddress: string, tokenId: string, chain: string = 'ethereum'): Promise<any> {
  // Create a cache key for this NFT
  const cacheKey = `tokenURI:${tokenAddress}:${tokenId}:${chain}`;
  
  // Check if this request is cached - either as success or known failure
  const cachedResult = sessionStorage.getItem(cacheKey);
  if (cachedResult) {
    try {
      const parsed = JSON.parse(cachedResult);
      if (parsed.success) {
        return parsed.data;
      } else {
        // If it's a known failure, throw the cached error
        throw new Error(parsed.error || "Cached failure");
      }
    } catch (e) {
      // If parsing fails, continue with the request
    }
  }
  
  try {
    // Try to get from Moralis first
    const data = await fetchFromAPI<any>(`/moralis/nft/${tokenAddress}/${tokenId}?chain=${chain}`);
    // Cache the successful result
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ success: true, data }));
    } catch (e) {/* ignore storage errors */}
    return data;
  } catch (error) {
    // Only log once to avoid spam
    const moralisLogKey = `moralis_log:${tokenAddress}:${tokenId}`;
    if (!sessionStorage.getItem(moralisLogKey)) {
      console.warn(`Failed to fetch tokenURI from Moralis`);
      sessionStorage.setItem(moralisLogKey, 'true');
    }
    
    // If Moralis fails, try to get from UnleashNFTs as fallback
    try {
      const data = await fetchFromAPI<any>(`/unleash/nft/metadata?contract_address=${tokenAddress}&token_id=${tokenId}&chain_id=1`);
      // Cache the successful result
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ success: true, data }));
      } catch (e) {/* ignore storage errors */}
      return data;
    } catch (unleashError) {
      // Only log once to avoid spam
      const unleashLogKey = `unleash_log:${tokenAddress}:${tokenId}`;
      if (!sessionStorage.getItem(unleashLogKey)) {
        console.warn(`Also failed to fetch from UnleashNFTs`);
        sessionStorage.setItem(unleashLogKey, 'true');
      }
      
      // If UnleashNFTs fails, try to get from Alchemy as a last resort
      try {
        console.log(`Trying Alchemy API as final fallback for ${tokenAddress}/${tokenId}`);
        const data = await fetchFromAPI<any>(`/alchemy/nft/${tokenAddress}/${tokenId}`);
        // Cache the successful result
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ success: true, data }));
        } catch (e) {/* ignore storage errors */}
        return data;
      } catch (alchemyError) {
        // Only log once to avoid spam
        const alchemyLogKey = `alchemy_log:${tokenAddress}:${tokenId}`;
        if (!sessionStorage.getItem(alchemyLogKey)) {
          console.warn(`All API sources failed for this NFT`);
          sessionStorage.setItem(alchemyLogKey, 'true');
        }
        
        // Cache the failure so we don't keep trying
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }));
        } catch (e) {/* ignore storage errors */}
        
        // Re-throw the original error if all sources fail
        throw error;
      }
    }
  }
}

export async function getPopularCollections(): Promise<any[]> {
  return fetchFromAPI<any[]>("/collections/popular");
}

export async function getCollectionNFTs(collectionSymbol: string): Promise<NFT[]> {
  return fetchFromAPI<NFT[]>(`/collections/${collectionSymbol}/nfts`);
}

export async function getWalletNFTs(walletAddress: string): Promise<NFT[]> {
  return fetchFromAPI<NFT[]>(`/wallet/${walletAddress}/nfts`);
}

export async function getNFTsByCollection(collectionName: string): Promise<NFT[]> {
  return getCollectionNFTs(collectionName);
}

export async function importNFTFromMoralis(tokenAddress: string, tokenId: string): Promise<NFT> {
  return fetchFromAPI<NFT>(`/nfts/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tokenAddress,
      tokenId,
    }),
  });
}

export async function importWalletNFTs(walletAddress: string): Promise<NFT[]> {
  return fetchFromAPI<NFT[]>(`/wallet/${walletAddress}/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  });
}

// BidPack API calls
export async function getBidPacks(): Promise<BidPack[]> {
  return fetchFromAPI<BidPack[]>("/bidpacks");
}

export async function getBidPack(id: number): Promise<BidPack> {
  return fetchFromAPI<BidPack>(`/bidpacks/${id}`);
}

export async function purchaseBidPack(bidPackId: number, walletAddress: string): Promise<any> {
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
}

export async function getUserBidPacks(userId: number): Promise<any[]> {
  return fetchFromAPI<any[]>(`/users/${userId}/bidpacks`);
}

// Activity API calls
export async function getActivities(): Promise<Activity[]> {
  return fetchFromAPI<Activity[]>("/activity");
}

export async function getActivity(): Promise<Activity[]> {
  return getActivities();
}

// Blockchain API calls
export async function getBlockchainStats(): Promise<BlockchainStats> {
  return fetchFromAPI<BlockchainStats>("/blockchain/stats");
}

// User API calls
export async function getUserByWalletAddress(walletAddress: string): Promise<any> {
  if (!walletAddress) return null;
  return fetchFromAPI<any>(`/users/by-wallet/${walletAddress}`);
}

// Format utilities for presenting data
export function formatPrice(price: string | number, currency = "USD"): string {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  
  if (currency === "USD") {
    return `$${priceNum.toFixed(2)}`;
  }
  
  // Format for cryptocurrencies with appropriate decimals
  return `${priceNum.toFixed(4)} ${currency}`;
}

/**
 * Format a price in USD
 * @param price The price to format
 * @returns Formatted price string with $ symbol
 */
export function formatPriceUSD(price: string | number | undefined): string {
  if (price === undefined) return '$0.00';
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return `$${priceNum.toFixed(2)}`;
}

/**
 * Format a price in native blockchain currency
 * @param price The price to format
 * @param symbol The currency symbol (ETH, MATIC, etc.)
 * @returns Formatted price with currency symbol
 */
export function formatPriceNative(price: string | number | undefined, symbol = "ETH"): string {
  if (price === undefined) return '0.00 ETH';
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return `${priceNum.toFixed(4)} ${symbol}`;
}

export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return "Ended";
  }
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  }
  if (diffMins > 0) {
    return `${diffMins}m ${diffSecs % 60}s`;
  }
  return `${diffSecs}s`;
}