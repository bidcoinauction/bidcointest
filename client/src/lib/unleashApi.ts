import { apiRequest } from './api';

// Types exported from server/unleashNftsService.ts
export interface NFTCollection {
  contract_address: string;
  name: string;
  image_url: string;
  token_schema: string;
  chain: string;
  description?: string;
  floor_price?: number;
  volume_24h?: number;
  market_cap?: number;
  holders_count?: number;
  items_count?: number;
}

export interface NFTCollectionMetrics {
  total_volume: number;
  floor_price: number;
  market_cap: number;
  holders_count: number;
  items_count: number;
  sales_count: number;
  volume_24h: number;
  price_change_24h: number;
  volume_7d: number;
  price_change_7d: number;
  volume_30d: number;
  price_change_30d: number;
}

export interface NFTMetadata {
  token_id: string;
  name: string;
  description: string;
  image_url: string;
  traits: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  last_sale_price?: number;
  estimated_price?: number;
}

export interface NFTValuation {
  token_id: string;
  collection_address: string;
  estimated_price: number;
  confidence_score: number;
  last_sale_price?: number;
  last_sale_date?: string;
}

/**
 * Get NFT collections by blockchain
 * @param chain The blockchain name (ethereum, polygon, etc.)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionsByChain = async (
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTCollection[]> => {
  const response = await apiRequest(`/api/unleash/collections?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get collection metadata by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getCollectionMetadata = async (
  address: string,
  chain: string = 'ethereum'
): Promise<NFTCollection | null> => {
  const response = await apiRequest(`/api/unleash/collection/${address}?chain=${chain}`);
  return response || null;
};

/**
 * Get collection metrics by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum) 
 */
export const getCollectionMetrics = async (
  address: string,
  chain: string = 'ethereum'
): Promise<NFTCollectionMetrics | null> => {
  const response = await apiRequest(`/api/unleash/collection/${address}/metrics?chain=${chain}`);
  return response || null;
};

/**
 * Get collection trend data by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param period The time period (24h, 7d, 30d, all) (defaults to 30d)
 */
export const getCollectionTrend = async (
  address: string,
  chain: string = 'ethereum',
  period: string = '30d'
): Promise<any> => {
  const response = await apiRequest(`/api/unleash/collection/${address}/trend?chain=${chain}&period=${period}`);
  return response || null;
};

/**
 * Get collection traits by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getCollectionTraits = async (
  address: string,
  chain: string = 'ethereum'
): Promise<any> => {
  const response = await apiRequest(`/api/unleash/collection/${address}/traits?chain=${chain}`);
  return response || null;
};

/**
 * Get NFTs in a collection by contract address
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionNFTs = async (
  address: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTMetadata[]> => {
  const response = await apiRequest(`/api/unleash/collection/${address}/nfts?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get collection transactions
 * @param address The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionTransactions = async (
  address: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<any[]> => {
  const response = await apiRequest(`/api/unleash/collection/${address}/transactions?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get collections with NFT valuation support
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getCollectionsWithValuation = async (
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTCollection[]> => {
  const response = await apiRequest(`/api/unleash/collections-with-valuation?chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get NFTs with valuation
 * @param collection The collection contract address
 * @param chain The blockchain name (defaults to ethereum)
 * @param page Page number (defaults to 1)
 * @param limit Items per page (defaults to 10)
 */
export const getNFTsWithValuation = async (
  collection: string,
  chain: string = 'ethereum',
  page: number = 1,
  limit: number = 10
): Promise<NFTMetadata[]> => {
  const response = await apiRequest(`/api/unleash/nfts-with-valuation?collection=${collection}&chain=${chain}&page=${page}&limit=${limit}`);
  return response || [];
};

/**
 * Get NFT valuation by contract address and token ID
 * @param collection The collection contract address
 * @param tokenId The NFT token ID
 * @param chain The blockchain name (defaults to ethereum)
 */
export const getNFTValuation = async (
  collection: string,
  tokenId: string,
  chain: string = 'ethereum'
): Promise<NFTValuation | null> => {
  const response = await apiRequest(`/api/unleash/nft-valuation?collection=${collection}&token_id=${tokenId}&chain=${chain}`);
  return response || null;
};