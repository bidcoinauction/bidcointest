import { Auction, NFT, BidPack, Activity, BlockchainStats } from "@shared/schema";

// Base API URL
const API_BASE = "/api";

// Generic fetch function
async function fetchFromAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

// Auction API calls
export async function getAuctions(): Promise<Auction[]> {
  return fetchFromAPI<Auction[]>("/auctions");
}

export async function getAuction(id: number): Promise<Auction> {
  return fetchFromAPI<Auction>(`/auctions/${id}`);
}

export async function getFeaturedAuctions(): Promise<Auction[]> {
  return fetchFromAPI<Auction[]>("/auctions/featured");
}

export async function placeBid(auctionId: number, amount: string, bidderAddress: string): Promise<Auction> {
  return fetchFromAPI<Auction>(`/auctions/${auctionId}/bid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      bidderAddress,
    }),
  });
}

// NFT API calls
export async function getNFTs(): Promise<NFT[]> {
  return fetchFromAPI<NFT[]>("/nfts");
}

export async function getNFT(id: number): Promise<NFT> {
  return fetchFromAPI<NFT>(`/nfts/${id}`);
}

export async function getPopularCollections(): Promise<any[]> {
  return fetchFromAPI<any[]>("/collections/popular");
}

export async function getCollectionNFTs(collectionSymbol: string): Promise<NFT[]> {
  return fetchFromAPI<NFT[]>(`/collections/${collectionSymbol}/nfts`);
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

// Blockchain API calls
export async function getBlockchainStats(): Promise<BlockchainStats> {
  return fetchFromAPI<BlockchainStats>("/blockchain/stats");
}

// Format utilities for presenting data
export function formatPrice(price: string, currency = "USD"): string {
  if (currency === "USD") {
    return `$${parseFloat(price).toFixed(2)}`;
  }
  return `${price} ${currency}`;
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