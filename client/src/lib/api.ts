import axios from "axios";
import { Auction, NFT, BidPack, Activity, BlockchainStats } from "@shared/schema";

// Base API URL
const API_URL = "/api";

// BitCrunch API integration
const BITCRUNCH_API_URL = "https://api.unleashnfts.com";
const BITCRUNCH_API_KEY = import.meta.env.VITE_BITCRUNCH_API_KEY || "";

// BitCrunch API client
const bitCrunchClient = axios.create({
  baseURL: BITCRUNCH_API_URL,
  headers: {
    "X-API-KEY": BITCRUNCH_API_KEY,
    "Content-Type": "application/json"
  }
});

// Get supported blockchains from BitCrunch API
export async function getSupportedBlockchains() {
  try {
    const response = await bitCrunchClient.get("/blockchains");
    return response.data;
  } catch (error) {
    console.error("Error fetching supported blockchains:", error);
    throw error;
  }
}

// Get NFT collections by blockchain from BitCrunch API
export async function getNFTCollections(blockchain: string) {
  try {
    const response = await bitCrunchClient.get(`/nft-collections?blockchain=${blockchain}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching NFT collections:", error);
    throw error;
  }
}

// Get blockchain stats from BitCrunch API
export async function getBlockchainStats(): Promise<BlockchainStats> {
  try {
    // In a real implementation, this would use the BitCrunch API
    // For now, we'll return mock data since we're using the backend
    const response = await axios.get(`${API_URL}/blockchain/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching blockchain stats:", error);
    throw error;
  }
}

// Get all auctions
export async function getAuctions() {
  try {
    const response = await axios.get<Auction[]>(`${API_URL}/auctions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching auctions:", error);
    throw error;
  }
}

// Get single auction by ID
export async function getAuction(id: number) {
  try {
    const response = await axios.get<Auction>(`${API_URL}/auctions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching auction ${id}:`, error);
    throw error;
  }
}

// Get featured auctions
export async function getFeaturedAuctions() {
  try {
    const response = await axios.get<Auction[]>(`${API_URL}/auctions/featured`);
    return response.data;
  } catch (error) {
    console.error("Error fetching featured auctions:", error);
    throw error;
  }
}

// Get all NFTs
export async function getNFTs() {
  try {
    const response = await axios.get<NFT[]>(`${API_URL}/nfts`);
    return response.data;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw error;
  }
}

// Get single NFT by ID
export async function getNFT(id: number) {
  try {
    const response = await axios.get<NFT>(`${API_URL}/nfts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching NFT ${id}:`, error);
    throw error;
  }
}

// Get all bid packs
export async function getBidPacks() {
  try {
    const response = await axios.get<BidPack[]>(`${API_URL}/bidpacks`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bid packs:", error);
    throw error;
  }
}

// Get all activity
export async function getActivity() {
  try {
    const response = await axios.get<Activity[]>(`${API_URL}/activity`);
    return response.data;
  } catch (error) {
    console.error("Error fetching activity:", error);
    throw error;
  }
}

// Place a bid on an auction
export async function placeBid(auctionId: number, amount: string, walletAddress: string) {
  try {
    const response = await axios.post(`${API_URL}/bids`, {
      auctionId,
      amount,
      walletAddress
    });
    return response.data;
  } catch (error) {
    console.error(`Error placing bid on auction ${auctionId}:`, error);
    throw error;
  }
}

// Purchase a bid pack
export async function purchaseBidPack(packId: number, walletAddress: string) {
  try {
    const response = await axios.post(`${API_URL}/bidpacks/purchase`, {
      packId,
      walletAddress
    });
    return response.data;
  } catch (error) {
    console.error(`Error purchasing bid pack ${packId}:`, error);
    throw error;
  }
}

// Moralis API Integration

// Get NFTs from a wallet using Moralis
export async function getWalletNFTs(walletAddress: string, chain = 'ethereum') {
  try {
    const response = await axios.get(`${API_URL}/moralis/wallet/${walletAddress}/nfts`, {
      params: { chain }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching NFTs from wallet ${walletAddress}:`, error);
    throw error;
  }
}

// Get NFTs from a collection using Moralis
export async function getNFTsByCollection(collectionAddress: string, chain = 'ethereum') {
  try {
    const response = await axios.get(`${API_URL}/moralis/collection/${collectionAddress}/nfts`, {
      params: { chain }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching NFTs from collection ${collectionAddress}:`, error);
    throw error;
  }
}

// Get NFT metadata using Moralis
export async function getNFTMetadata(tokenAddress: string, tokenId: string, chain = 'ethereum') {
  try {
    const response = await axios.get(`${API_URL}/moralis/nft/${tokenAddress}/${tokenId}`, {
      params: { chain }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching NFT metadata for ${tokenAddress}/${tokenId}:`, error);
    throw error;
  }
}

// Import an NFT from Moralis
export async function importNFTFromMoralis(tokenAddress: string, tokenId: string, creatorId = 1, chain = 'ethereum') {
  try {
    const response = await axios.post(`${API_URL}/moralis/import`, {
      tokenAddress,
      tokenId,
      creatorId,
      chain
    });
    return response.data;
  } catch (error) {
    console.error(`Error importing NFT ${tokenAddress}/${tokenId}:`, error);
    throw error;
  }
}

// Import multiple NFTs from a wallet
export async function importWalletNFTs(walletAddress: string, limit = 5, creatorId = 1, chain = 'ethereum') {
  try {
    const response = await axios.post(`${API_URL}/moralis/import-wallet`, {
      walletAddress,
      limit,
      creatorId,
      chain
    });
    return response.data;
  } catch (error) {
    console.error(`Error importing NFTs from wallet ${walletAddress}:`, error);
    throw error;
  }
}
