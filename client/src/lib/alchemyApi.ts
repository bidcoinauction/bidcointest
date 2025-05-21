// Create a new file for the Alchemy API
const API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

export const alchemyApi = {
  getNFTMetadata: async (contractAddress: string, tokenId: string) => {
    try {
      const baseUrl = `https://eth-mainnet.g.alchemy.com/nft/v2/${API_KEY}`;
      const url = `${baseUrl}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching NFT metadata from Alchemy:", error);
      throw error;
    }
  }
};