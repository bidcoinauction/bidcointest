import axios from 'axios';

export interface NFTCollection {
  id: string;
  name: string;
  contractAddress: string;
  blockchain: string;
  imageUrl: string;
  totalSupply?: number;
}

export interface CollectionMetrics {
  floorPrice: number;
  volume24h: number;
  holders: number;
  marketCap?: number;
}

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description?: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
}

const API_KEY = import.meta.env.VITE_UNLEASH_API_KEY;
const BASE_URL = 'https://api.unleashnfts.com/v1';

export const getCollectionsByBlockchain = async (blockchain: string): Promise<NFTCollection[]> => {
  const response = await axios.get(`${BASE_URL}/collections`, {
    headers: { 'x-api-key': API_KEY },
    params: { blockchain }
  });
  return response.data.collections;
};

export const getCollectionMetrics = async (collectionId: string): Promise<CollectionMetrics> => {
  const response = await axios.get(`${BASE_URL}/collections/${collectionId}/metrics`, {
    headers: { 'x-api-key': API_KEY }
  });
  return response.data;
};

export const getCollectionNFTs = async (collectionId: string, limit = 20, offset = 0): Promise<NFTMetadata[]> => {
  const response = await axios.get(`${BASE_URL}/collections/${collectionId}/nfts`, {
    headers: { 'x-api-key': API_KEY },
    params: { limit, offset }
  });
  return response.data.nfts;
};