
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const getFeaturedAuctions = () => api.get('/auctions/featured').then(res => res.data);
export const getActivity = () => api.get('/activity').then(res => res.data);
export const getBidPacks = () => api.get('/bidpacks').then(res => res.data);
export const getBlockchainStats = () => api.get('/blockchain/stats').then(res => res.data);
export const getTokenURI = (contractAddress: string, tokenId: string) => 
  api.get(`/alchemy/nft/${contractAddress}/${tokenId}`).then(res => res.data);

export const placeBid = (data: { auctionId: number; amount: string; bidderAddress: string }) =>
  api.post('/bids', data).then(res => res.data);

export const purchaseBidPack = (data: { packId: number; walletAddress: string }) =>
  api.post('/bidpacks/purchase', data).then(res => res.data);
