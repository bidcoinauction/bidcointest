import axios from 'axios';

const API_BASE = '/api';

export const getWalletNFTs = async (address: string, chain = 'ethereum') => {
  const response = await axios.get(`${API_BASE}/nfts/wallet/${address}`, {
    params: { chain }
  });
  return response.data;
};

export const getNFTsByCollection = async (collectionAddress: string, chain = 'ethereum') => {
  const response = await axios.get(`${API_BASE}/nfts/collection/${collectionAddress}`, {
    params: { chain }
  });
  return response.data;
};

export const importNFTFromMoralis = async (contractAddress: string, tokenId: string, chain = 'ethereum') => {
  const response = await axios.post(`${API_BASE}/nfts/import`, {
    contractAddress,
    tokenId,
    chain
  });
  return response.data;
};

export const importWalletNFTs = async (address: string, chain = 'ethereum') => {
  const response = await axios.post(`${API_BASE}/nfts/import-wallet`, {
    address,
    chain
  });
  return response.data;
};

export const getNFTs = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/nfts`, { params });
  return response.data;
};