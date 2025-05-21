import axios from 'axios';
import { NFTCollection } from '@shared/types';

const API_KEY = import.meta.env.VITE_UNLEASH_API_KEY;
const BASE_URL = 'https://api.unleashnfts.com/v1';

export const getCollectionsByBlockchain = async (
  blockchain: string,
  currency = 'usd',
  page = 1,
  limit = 20
): Promise<NFTCollection[]> => {
  const response = await axios.get(`${BASE_URL}/collections`, {
    headers: { 'x-api-key': API_KEY },
    params: { blockchain, currency, page, limit }
  });
  return response.data.collections;
};

export const getCollectionMetrics = async (collectionId: string, blockchain = 'ethereum') => {
  const response = await axios.get(`${BASE_URL}/collections/${collectionId}/metrics`, {
    headers: { 'x-api-key': API_KEY },
    params: { blockchain }
  });
  return response.data;
};

export const getCollectionNFTs = async (
  collectionId: string,
  blockchain = 'ethereum',
  page = 1,
  limit = 20
) => {
  const response = await axios.get(`${BASE_URL}/collections/${collectionId}/nfts`, {
    headers: { 'x-api-key': API_KEY },
    params: { blockchain, page, limit }
  });
  return response.data.nfts;
};

export const getNFTValuation = async (
  contractAddress: string,
  tokenId: string,
  blockchain = 'ethereum'
) => {
  const response = await axios.get(`${BASE_URL}/nfts/${contractAddress}/${tokenId}/valuation`, {
    headers: { 'x-api-key': API_KEY },
    params: { blockchain }
  });
  return response.data;
};

export const getNFTDetailedMetadata = async (
  contractAddress: string,
  tokenId: string,
  blockchain = 'ethereum'
) => {
  const response = await axios.get(`${BASE_URL}/nfts/${contractAddress}/${tokenId}/metadata`, {
    headers: { 'x-api-key': API_KEY },
    params: { blockchain }
  });
  return response.data;
};
