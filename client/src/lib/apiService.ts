import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api'
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Success [${response.config.url}]:`, response.data);
    return response;
  },
  error => {
    console.error(`API Error [${error.config?.url}]:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Auction API functions
 */
export const auctionService = {
  getAuctions: () => {
    return api.get('/auctions').then(res => res.data);
  },

  getAuction: (id: number) => {
    return api.get(`/auctions/${id}`).then(res => res.data);
  },

  getFeaturedAuctions: () => {
    return api.get('/auctions/featured').then(res => res.data);
  }
};

/**
 * Bid Pack API functions
 */
export const bidPackService = {
  getBidPacks: () => {
    return api.get('/bidpacks').then(res => res.data);
  }
};

/**
 * Activity API functions
 */
export const activityService = {
  getActivity: () => {
    return api.get('/activity').then(res => res.data);
  }
};

/**
 * Blockchain API functions
 */
export const blockchainService = {
  getStats: () => {
    return api.get('/blockchain/stats').then(res => res.data);
  }
};

/**
 * NFT API functions
 */
export const nftApi = {
  getDetailedMetadata: (contractAddress: string, tokenId: string, chainId: number = 1) => {
    // This would normally call your backend API
    // For now, we'll return mock data
    return Promise.resolve({
      name: `NFT #${tokenId}`,
      description: 'A detailed NFT description',
      image: 'https://example.com/nft.png',
      traits: [
        { trait_type: 'Background', value: 'Blue' },
        { trait_type: 'Eyes', value: 'Green' },
        { trait_type: 'Mouth', value: 'Smile' }
      ]
    });
  }
};

/**
 * Alchemy API functions (via your backend)
 */
export const alchemyApi = {
  getNFTMetadata: (contractAddress: string, tokenId: string) => {
    return api.get(`/alchemy/nft/${contractAddress}/${tokenId}`).then(res => res.data);
  }
};
