import axios from 'axios';
import { log } from './vite';

// Updated API endpoints based on the latest UnleashNFTs documentation
const BASE_URL_V1 = 'https://api.unleashnfts.com/api/v1';
const BASE_URL_V2 = 'https://api.unleashnfts.com/api/v2';
// Access the API key directly from the environment variable
// In server-side code, we need to access process.env directly, not import.meta.env
// Using fallback to hardcoded value for consistent API access
const API_KEY = process.env.VITE_BITCRUNCH_API_KEY || '0c4b62cce16246d181310c3b57512529';

// Type definitions based on the UnleashNFTs API
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

export class UnleashNftsService {
  private headers: Record<string, string>;

  constructor() {
    // Provide more information for debugging
    const firstFour = API_KEY ? API_KEY.substring(0, 4) : '';
    const lastFour = API_KEY ? API_KEY.substring(API_KEY.length - 4) : '';
    log(`Initializing UnleashNftsService with API key: ${API_KEY ? `${firstFour}...${lastFour}` : 'Not found'}`, 'unleash-nfts');

    this.headers = {
      'accept': 'application/json',
      'x-api-key': API_KEY || ''
    };

    if (!API_KEY) {
      log('WARNING: VITE_BITCRUNCH_API_KEY is not set. UnleashNfts API will not work.', 'unleash-nfts');
    } else {
      log('UnleashNfts API key configured successfully', 'unleash-nfts');
      // Test the connection
      this.testConnection();
    }
  }

  /**
   * Test the API connection by making a simple request
   */
  private async testConnection(): Promise<void> {
    try {
      log(`Testing connection to UnleashNFTs API...`, 'unleash-nfts');
      
      // First test metadata endpoint which is critical for our application
      try {
        await this.testNFTMetadataEndpoint();
        
        // If metadata test succeeds, we can stop here since it's our most important endpoint
        return;
      } catch (metadataError: any) {
        const errorMsg = metadataError.response?.data?.message || metadataError.message || 'Unknown error';
        log(`⚠️ NFT metadata endpoint test failed: ${errorMsg}`, 'unleash-nfts');
        log(`Falling back to collections API test...`, 'unleash-nfts');
      }
      
      // Try to fetch collections if metadata test fails
      try {
        // Make a direct API call instead of using getCollectionsByChain to isolate test
        log(`Testing collections API with correct parameters...`, 'unleash-nfts');
        
        const response = await axios.get(`${BASE_URL_V1}/collections`, {
          headers: this.headers,
          params: {
            currency: 'usd',
            metrics: 'volume',   // Required parameter
            sort_by: 'volume',
            sort_order: 'desc',
            offset: 0,
            limit: 5,
            time_range: '24h'
          }
        });
        
        const collections = response.data?.data || [];
        
        if (collections && collections.length > 0) {
          log(`✅ UnleashNFTs API collections test SUCCESSFUL. Found ${collections.length} collections.`, 'unleash-nfts');
          log(`Top collection: ${collections[0]?.name || 'Unknown'}`, 'unleash-nfts');
          return; // Exit early on success
        } else {
          log(`⚠️ UnleashNFTs API collections test completed, but no collections were returned.`, 'unleash-nfts');
          log(`Falling back to blockchain test...`, 'unleash-nfts');
        }
      } catch (collectionError: any) {
        const errorMsg = collectionError.response?.data?.message || collectionError.message || 'Unknown error';
        log(`⚠️ UnleashNFTs API collections test failed: ${errorMsg}`, 'unleash-nfts');
        log(`Falling back to blockchain test...`, 'unleash-nfts');
      }
      
      // If collections test fails, fall back to blockchains test
      try {
        const blockchains = await this.getSupportedBlockchains(1, 1);
        log(`Got ${blockchains.length} blockchains from UnleashNFTs v2 API`, 'unleash-nfts');
        
        if (blockchains && blockchains.length > 0) {
          log(`✅ UnleashNFTs API blockchain test SUCCESSFUL. Found ${blockchains.length} blockchains.`, 'unleash-nfts');
          log(`Blockchain available: ${blockchains[0]?.metadata?.name || 'Unknown'}`, 'unleash-nfts');
        } else {
          log(`⚠️ UnleashNFTs API connection test completed, but no blockchains were returned.`, 'unleash-nfts');
          log(`This might indicate an issue with the API or insufficient permissions.`, 'unleash-nfts');
        }
      } catch (blockchainError: any) {
        const errorMsg = blockchainError.response?.data?.message || blockchainError.message || 'Unknown error';
        log(`❌ UnleashNFTs API blockchain test FAILED: ${errorMsg}`, 'unleash-nfts');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const status = error.response?.status;
      
      log(`❌ UnleashNFTs API connection test FAILED: ${errorMessage}`, 'unleash-nfts');
      
      if (status === 401 || errorMessage.includes('API key')) {
        // If API key is invalid, provide guidance on obtaining a new one
        log(`The API key appears to be invalid or expired.`, 'unleash-nfts'); 
        log(`To get a valid API key:`, 'unleash-nfts');
        log(`1. Create an account at unleashnfts.com`, 'unleash-nfts');
        log(`2. Navigate to your profile settings`, 'unleash-nfts');
        log(`3. Request an API key and follow verification steps`, 'unleash-nfts');
        log(`4. Add the new key to your environment as VITE_BITCRUNCH_API_KEY`, 'unleash-nfts');
      }
    }
  }
  
  /**
   * Test the NFT metadata endpoint with a known NFT
   * This is crucial for verifying our image loading functionality
   */
  private async testNFTMetadataEndpoint(): Promise<void> {
    // Use CryptoPunks collection which is well-known and should be available
    const testCollection = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb'; // CryptoPunks
    const testTokenId = '1000'; // A well-known CryptoPunk
    const testChain = '1'; // Ethereum (numeric chain ID)
    
    log(`Testing NFT metadata endpoint directly...`, 'unleash-nfts');
    log(`Parameters: Collection=${testCollection}, TokenID=${testTokenId}, Chain=${testChain}`, 'unleash-nfts');
    
    try {
      // Test v2 endpoint first (preferred according to documentation)
      const url = `${BASE_URL_V2}/nft/metadata`;
      const response = await axios.get(url, {
        headers: this.headers,
        params: {
          collection_address: testCollection,
          token_id: testTokenId,
          blockchain: testChain
        }
      });
      
      const nftData = response.data;
      
      if (nftData) {
        log(`✅ NFT metadata endpoint test SUCCESSFUL`, 'unleash-nfts');
        log(`Retrieved metadata for: ${nftData.name || 'Unknown NFT'}`, 'unleash-nfts');
        
        // Test image URL cleaning
        if (nftData.image_url) {
          const cleanedUrl = this.cleanImageUrl(nftData.image_url);
          log(`Original image URL: ${nftData.image_url}`, 'unleash-nfts');
          log(`Sanitized image URL: ${cleanedUrl}`, 'unleash-nfts');
        } else {
          log(`⚠️ NFT has no image URL in response`, 'unleash-nfts');
        }
        
        return; // Success
      } else {
        log(`⚠️ NFT metadata endpoint returned empty data`, 'unleash-nfts');
        throw new Error('Empty metadata response');
      }
    } catch (v2Error: any) {
      const errorMsg = v2Error.response?.data?.message || v2Error.message || 'Unknown error';
      log(`V2 metadata endpoint failed: ${errorMsg}. Trying v1...`, 'unleash-nfts');
      
      // Try v1 endpoint as fallback
      try {
        const url = `${BASE_URL_V1}/nft/metadata`;
        const response = await axios.get(url, {
          headers: this.headers,
          params: {
            collection_address: testCollection,
            token_id: testTokenId,
            blockchain: testChain
          }
        });
        
        const nftData = response.data;
        
        if (nftData) {
          log(`✅ V1 NFT metadata endpoint test SUCCESSFUL`, 'unleash-nfts');
          log(`Retrieved metadata for: ${nftData.name || 'Unknown NFT'}`, 'unleash-nfts');
          
          // Test image URL cleaning
          if (nftData.image_url) {
            const cleanedUrl = this.cleanImageUrl(nftData.image_url);
            log(`Original image URL: ${nftData.image_url}`, 'unleash-nfts');
            log(`Sanitized image URL: ${cleanedUrl}`, 'unleash-nfts');
          }
          
          return; // Success
        } else {
          log(`⚠️ V1 NFT metadata endpoint returned empty data`, 'unleash-nfts');
          throw new Error('Empty V1 metadata response');
        }
      } catch (v1Error: any) {
        const v1ErrorMsg = v1Error.response?.data?.message || v1Error.message || 'Unknown error';
        log(`❌ Both V2 and V1 metadata endpoints failed. V1 error: ${v1ErrorMsg}`, 'unleash-nfts');
        throw v1Error;
      }
    }
  }

  /**
   * Get supported blockchains
   * @param page Page number (defaults to 1)
   * @param limit Items per page (defaults to 30)
   * @param sortBy Sort field (defaults to blockchain_name)
   */
  async getSupportedBlockchains(page: number = 1, limit: number = 30, sortBy: string = 'blockchain_name'): Promise<any[]> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/blockchains`, {
          headers: this.headers,
          params: {
            sort_by: sortBy,
            offset: (page - 1) * limit,
            limit
          }
        });
        
        log(`Got ${response.data?.data?.length || 0} blockchains from UnleashNFTs v2 API`, 'unleash-nfts');
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 blockchains endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/blockchains`, {
          headers: this.headers,
          params: {
            sort_by: sortBy,
            offset: (page - 1) * limit,
            limit
          }
        });
        
        log(`Got ${response.data?.data?.length || 0} blockchains from UnleashNFTs v1 API`, 'unleash-nfts');
        return response.data.data || [];
      }
    } catch (error) {
      this.handleError('getSupportedBlockchains', error);
      
      // If API fails completely, return a hardcoded entry for Ethereum to prevent cascading failures
      log(`Providing fallback blockchain information for Ethereum`, 'unleash-nfts');
      return [{
        id: 1,
        metadata: {
          name: "Ethereum",
          symbol: "ETH",
          chain_id: "1"
        }
      }];
    }
  }

  /**
   * Get collections by blockchain
   * @param chain The blockchain chain_id (1 for Ethereum, 137 for Polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   * @param metrics Type of metrics to include (volume, floor_price, etc.)
   * @param sortBy Field to sort by (volume, market_cap, etc.)
   */
  async getCollectionsByChain(chain: string, page: number = 1, limit: number = 10, metricsParam: string = 'volume', sortBy: string = 'volume'): Promise<NFTCollection[]> {
    try {
      // Get error feedback informing us that metrics is required
      const chainId = this.normalizeChainId(chain);
      log(`Attempting to fetch collections with all required parameters`, 'unleash-nfts');
      
      // Let's try with all parameters including the required metrics
      try {
        const response = await axios.get(`${BASE_URL_V1}/collections`, {
          headers: this.headers,
          params: {
            currency: 'usd',
            metrics: ['volume', 'floor_price', 'market_cap'],  // API requires metrics array
            sort_by: 'holders',
            sort_order: 'desc',
            offset: (page - 1) * limit,
            limit,
            time_range: '24h',
            include_washtrade: true
          }
        });
        
        log(`Successfully retrieved ${response.data?.data?.length || 0} collections`, 'unleash-nfts');
        return response.data.data || [];
      } catch (error: any) {
        // If that fails, try the alternate form with metrics as a string
        const errorMsg = error?.message || 'Unknown error';
        log(`Collections endpoint failed: ${errorMsg}, trying alternate metrics format...`, 'unleash-nfts');
        
        try {
          const response = await axios.get(`${BASE_URL_V1}/collections`, {
            headers: this.headers,
            params: {
              currency: 'usd',
              metrics: 'volume',  // Try as string instead of array
              sort_by: 'volume',  // Match sort_by with metrics
              sort_order: 'desc',
              offset: (page - 1) * limit,
              limit,
              time_range: '24h'
            }
          });
          
          log(`Successfully retrieved ${response.data?.data?.length || 0} collections using string metrics`, 'unleash-nfts');
          return response.data.data || [];
        } catch (metricsError: any) {
          // Final attempt - try with blockchain parameter and all required fields
          log(`Metrics string endpoint failed: ${metricsError.message}, trying with blockchain parameter...`, 'unleash-nfts');
          
          const response = await axios.get(`${BASE_URL_V1}/collections`, {
            headers: this.headers,
            params: {
              blockchain: parseInt(chainId),  // Add blockchain filter
              currency: 'usd',
              metrics: 'volume',  // Required parameter
              sort_by: 'volume',
              sort_order: 'desc',
              offset: (page - 1) * limit,
              limit,
              time_range: '24h'
            }
          });
          
          log(`Successfully retrieved ${response.data?.data?.length || 0} collections with blockchain filter`, 'unleash-nfts');
          return response.data.data || [];
        }
      }
    } catch (error) {
      this.handleError('getCollectionsByChain', error);
      // Even if all API calls fail, return an empty array rather than null
      // to avoid cascading failures
      return [];
    }
  }
  
  /**
   * Normalize chain identifier to the format expected by UnleashNFTs API
   * @param chain Chain identifier (could be name, symbol, or chain_id)
   */
  private normalizeChainId(chain: string): string {
    // Already numeric chain ID
    if (/^\d+$/.test(chain)) {
      return chain;
    }
    
    // Convert common chain names to chain_id
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'eth': '1',
      'polygon': '137',
      'matic': '137',
      'solana': '501',
      'sol': '501',
      'binance': '56',
      'bsc': '56',
      'avalanche': '43114',
      'avax': '43114'
    };
    
    const normalizedChain = chain.toLowerCase();
    if (chainMap[normalizedChain]) {
      log(`Normalized chain "${chain}" to chain_id "${chainMap[normalizedChain]}"`, 'unleash-nfts');
      return chainMap[normalizedChain];
    }
    
    // Default to Ethereum if unknown
    log(`Unknown chain "${chain}", defaulting to Ethereum (chain_id=1)`, 'unleash-nfts');
    return '1';
  }

  /**
   * Get collection metadata by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetadata(contractAddress: string, chain: string): Promise<NFTCollection | null> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/info`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection info endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/info`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
      this.handleError('getCollectionMetadata', error);
      return null;
    }
  }

  /**
   * Get collection metrics by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetrics(contractAddress: string, chain: string): Promise<NFTCollectionMetrics | null> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/metrics`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection metrics endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/metrics`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
      this.handleError('getCollectionMetrics', error);
      return null;
    }
  }

  /**
   * Get collection trend data by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param period The time period (24h, 7d, 30d, all)
   */
  async getCollectionTrend(contractAddress: string, chain: string, period: string = '30d'): Promise<any> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/trend`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain,
            time_range: period
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection trend endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/trend`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain,
            time_range: period
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
      this.handleError('getCollectionTrend', error);
      return null;
    }
  }

  /**
   * Get collection traits by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionTraits(contractAddress: string, chain: string): Promise<any> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/traits`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection traits endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/traits`, {
          headers: this.headers,
          params: { 
            collection_address: contractAddress,
            blockchain: chain 
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
      this.handleError('getCollectionTraits', error);
      return null;
    }
  }

  /**
   * Get NFTs in a collection by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionNFTs(contractAddress: string, chain: string, page: number = 1, limit: number = 10): Promise<NFTMetadata[]> {
    try {
      // Format endpoint according to documentation:
      // https://api.unleashnfts.com/api/v1/collection/{blockchain}/{address}/nfts
      const chainId = this.normalizeChainId(chain);
      
      log(`Fetching NFTs for collection ${contractAddress} on chain ${chainId} using correct URL format`, 'unleash-nfts');
      
      try {
        // Direct format from API documentation
        const url = `${BASE_URL_V1}/collection/${chainId}/${contractAddress}/nfts`;
        
        const response = await axios.get(url, {
          headers: this.headers,
          params: {
            // Required parameters according to documentation
            metrics: ['volume', 'floor_price'], // API requires metrics array
            sort_by: 'holders',
            sort_order: 'desc',
            offset: (page - 1) * limit,
            limit: limit,
            time_range: '24h'
          }
        });
        
        const nfts = response.data?.data || [];
        log(`Successfully fetched ${nfts.length} NFTs using collection endpoint`, 'unleash-nfts');
        
        // Process and clean image URLs
        return nfts.map((nft: any) => {
          if (nft.image_url) {
            nft.image_url = this.cleanImageUrl(nft.image_url);
          }
          return nft;
        });
      } catch (formatError: any) {
        const errorMsg = formatError.response?.data?.message || formatError.message;
        log(`Collection NFTs endpoint failed: ${errorMsg}. Trying alternative...`, 'unleash-nfts');
        
        // Try the original endpoint format as fallback
        try {
          const response = await axios.get(`${BASE_URL_V1}/nft/tokens`, {
            headers: this.headers,
            params: {
              collection_address: contractAddress,
              blockchain: chainId,
              metrics: 'volume', // Add required parameter
              offset: (page - 1) * limit,
              limit: limit
            }
          });
          
          const nfts = response.data?.data || [];
          log(`Successfully fetched ${nfts.length} NFTs using tokens endpoint`, 'unleash-nfts');
          
          // Process and clean image URLs
          return nfts.map((nft: any) => {
            if (nft.image_url) {
              nft.image_url = this.cleanImageUrl(nft.image_url);
            }
            return nft;
          });
        } catch (fallbackError: any) {
          // If both attempts fail, try v2 endpoint
          log(`V1 NFT tokens endpoint failed, trying v2 endpoint...`, 'unleash-nfts');
          
          const response = await axios.get(`${BASE_URL_V2}/nft/tokens`, {
            headers: this.headers,
            params: {
              collection_address: contractAddress,
              blockchain: chainId,
              offset: (page - 1) * limit,
              limit: limit
            }
          });
          
          const nfts = response.data?.data || [];
          log(`Successfully fetched ${nfts.length} NFTs using v2 tokens endpoint`, 'unleash-nfts');
          
          // Process and clean image URLs
          return nfts.map((nft: any) => {
            if (nft.image_url) {
              nft.image_url = this.cleanImageUrl(nft.image_url);
            }
            return nft;
          });
        }
      }
    } catch (error) {
      this.handleError('getCollectionNFTs', error);
      return [];
    }
  }
  
  /**
   * Sanitize NFT image URLs to avoid marketplace restrictions
   * This is a critical function to ensure NFT images load properly from various sources
   * @param url The original image URL
   * @returns Sanitized image URL that uses direct sources
   */
  private cleanImageUrl(url: string): string {
    if (!url) return '/placeholder-nft.png';
    
    try {
      log(`Sanitizing image URL: ${url}`, 'unleash-nfts');
      
      // Check and replace HTTP with HTTPS first for security
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
        log(`Converted to HTTPS: ${url}`, 'unleash-nfts');
      }
      
      // Special case for data URLs - leave them as is
      if (url.startsWith('data:image/')) {
        log(`Data URL detected, keeping as is`, 'unleash-nfts');
        return url;
      }
      
      // Handle malformed URLs or relative paths
      if (!url.includes('://') && !url.startsWith('data:')) {
        if (url.startsWith('/')) {
          log(`Converting relative path to absolute`, 'unleash-nfts');
          return url; // Leave server relative paths as is
        } else if (url.startsWith('ipfs://')) {
          // Continue processing with IPFS handler below
        } else {
          log(`Malformed URL without protocol, adding https://`, 'unleash-nfts');
          url = 'https://' + url;
        }
      }
      
      // OpenSea URLs - Use IPFS gateway or direct URL
      if (url.includes('opensea.io') || url.includes('openseauserdata.com')) {
        const ipfsMatch = url.match(/ipfs\/([a-zA-Z0-9]+)/);
        if (ipfsMatch && ipfsMatch[1]) {
          const newUrl = `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
          log(`Converted OpenSea URL to IPFS gateway: ${newUrl}`, 'unleash-nfts');
          return newUrl;
        } else {
          // Try to extract the direct image URL from OpenSea links
          const directMatch = url.match(/([^/]+\.(png|jpg|jpeg|gif|webp|svg))/i);
          if (directMatch) {
            // Use a direct CDN URL if possible
            const newUrl = `https://i.seadn.io/gae/${directMatch[1]}`;
            log(`Extracted direct image from OpenSea URL: ${newUrl}`, 'unleash-nfts');
            return newUrl;
          }
        }
      }
      
      // Magic Eden URLs - Convert to Arweave
      if (url.includes('magiceden.io') || url.includes('magiceden.com')) {
        const idMatch = url.match(/([a-zA-Z0-9_-]{43,})/);
        if (idMatch && idMatch[1]) {
          const newUrl = `https://arweave.net/${idMatch[1]}`;
          log(`Converted Magic Eden URL to Arweave: ${newUrl}`, 'unleash-nfts');
          return newUrl;
        } else {
          // Try to extract the filename and use a direct URL
          const filenameMatch = url.match(/([^/]+\.(png|jpg|jpeg|gif|webp|svg))/i);
          if (filenameMatch) {
            // Use a public storage URL if we have the filename
            log(`Extracted filename from Magic Eden URL: ${filenameMatch[1]}`, 'unleash-nfts');
            url = `https://user-content.magiceden.io/${filenameMatch[1]}`;
          }
        }
      }
      
      // IPFS URLs with IPFS protocol
      if (url.startsWith('ipfs://')) {
        const ipfsId = url.substring(7); // Remove ipfs:// prefix
        const newUrl = `https://ipfs.io/ipfs/${ipfsId}`;
        log(`Converted IPFS protocol URL to gateway: ${newUrl}`, 'unleash-nfts');
        return newUrl;
      }
      
      // IPFS URLs with wrong gateway or path format
      if (url.includes('ipfs') && !url.includes('ipfs.io')) {
        // More comprehensive regex to extract IPFS hash
        const ipfsMatch = url.match(/ipfs[:/ ]+([a-zA-Z0-9]{46}|[a-zA-Z0-9]{59}|Qm[a-zA-Z0-9]{44})/i);
        if (ipfsMatch && ipfsMatch[1]) {
          const newUrl = `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
          log(`Converted to IPFS gateway URL: ${newUrl}`, 'unleash-nfts');
          return newUrl;
        }
      }
      
      // Arweave URLs with wrong gateway
      if (url.includes('arweave') && !url.includes('arweave.net')) {
        const arweaveMatch = url.match(/([a-zA-Z0-9_-]{43})/);
        if (arweaveMatch && arweaveMatch[1]) {
          const newUrl = `https://arweave.net/${arweaveMatch[1]}`;
          log(`Converted to Arweave gateway URL: ${newUrl}`, 'unleash-nfts');
          return newUrl;
        }
      }
      
      // Ensure properly encoded URLs for special characters
      if (url.includes(' ') || url.includes('"') || url.includes("'")) {
        const encodedUrl = encodeURI(url);
        if (encodedUrl !== url) {
          log(`URL encoded to handle special characters: ${encodedUrl}`, 'unleash-nfts');
          url = encodedUrl;
        }
      }
      
      // Handle S3 and other cloud storage URLs
      const s3Match = url.match(/amazonaws\.com\/([^/]+\/[^/]+\/[^/]+\.(png|jpg|jpeg|gif|webp|svg))/i);
      if (s3Match) {
        // Ensure we're using HTTPS for S3 URLs
        const newUrl = `https://s3.amazonaws.com/${s3Match[1]}`;
        log(`Normalized S3 URL: ${newUrl}`, 'unleash-nfts');
        return newUrl;
      }
      
      log(`No URL transformation needed, returning original`, 'unleash-nfts');
      return url;
    } catch (error) {
      console.error('Error cleaning image URL:', error);
      // If any error occurs during cleaning, return the original URL
      return url;
    }
  }

  /**
   * Get collection transactions
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionTransactions(contractAddress: string, chain: string, page: number = 1, limit: number = 10): Promise<any[]> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collection/transactions`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collection transactions endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collection/transactions`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
      this.handleError('getCollectionTransactions', error);
      return [];
    }
  }

  /**
   * Get collections with NFT valuation support
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionsWithValuation(chain: string, page: number = 1, limit: number = 10): Promise<NFTCollection[]> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/collections/with-valuation`, {
          headers: this.headers,
          params: {
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 collections with valuation endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/collections/with-valuation`, {
          headers: this.headers,
          params: {
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
      this.handleError('getCollectionsWithValuation', error);
      return [];
    }
  }

  /**
   * Get NFTs with valuation
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getNFTsWithValuation(contractAddress: string, chain: string, page: number = 1, limit: number = 10): Promise<NFTMetadata[]> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/tokens`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 tokens with valuation endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/tokens`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            blockchain: chain,
            offset: (page - 1) * limit,
            limit
          }
        });
        return response.data.data || [];
      }
    } catch (error) {
      this.handleError('getNFTsWithValuation', error);
      return [];
    }
  }

  /**
   * Get NFT valuation by contract address and token ID
   * @param contractAddress The collection contract address
   * @param tokenId The NFT token ID
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTValuation(contractAddress: string, tokenId: string, chain: string): Promise<any> {
    try {
      // Try v2 endpoint first
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/valuation`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            token_id: tokenId,
            blockchain: chain
          }
        });
        return response.data.data || null;
      } catch (v2Error) {
        // If v2 fails, try v1 endpoint
        log(`V2 NFT valuation endpoint failed, trying v1 endpoint...`, 'unleash-nfts');
        const response = await axios.get(`${BASE_URL_V1}/nft/valuation`, {
          headers: this.headers,
          params: {
            collection_address: contractAddress,
            token_id: tokenId,
            blockchain: chain
          }
        });
        return response.data.data || null;
      }
    } catch (error) {
      this.handleError('getNFTValuation', error);
      return null;
    }
  }
  
  /**
   * Get detailed NFT metadata by contract address and token ID
   * @param contractAddress The collection contract address
   * @param tokenId The NFT token ID
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTDetailedMetadata(contractAddress: string, tokenId: string, chain: string = 'ethereum'): Promise<any> {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching detailed NFT metadata for ${contractAddress}/${tokenId} on chain ${chainId}`, 'unleash-nfts');
      
      try {
        // Use v2 endpoint with direct path format
        // Direct format: /nft/{blockchain}/{contract_address}/{token_id}
        log(`[unleash-nfts] Trying format: ${BASE_URL_V2}/nft/${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
        
        const response = await axios.get(`${BASE_URL_V2}/nft/${chainId}/${contractAddress}/${tokenId}`, {
          headers: this.headers
        });
        
        const nftData = response.data;
        
        // Clean image URLs
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId}`, 'unleash-nfts');
        }
        
        // Also clean the collection image if present
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        
        log(`✅ Success with direct NFT path format: ${chainId}/${contractAddress}/${tokenId}`, 'unleash-nfts');
        return nftData;
      } catch (v2Error: any) {
        const errorMsg = v2Error.response?.data?.message || v2Error.message;
        log(`V2 NFT metadata endpoint failed: ${errorMsg}. Trying v1 endpoint...`, 'unleash-nfts');
        
        // If v2 fails, try v1 endpoint
        try {
          const response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
            headers: this.headers,
            params: {
              blockchain: chainId,
              collection_address: contractAddress,
              token_id: tokenId
            }
          });
          
          const nftData = response.data;
          
          // Clean image URLs
          if (nftData && nftData.image_url) {
            nftData.image_url = this.cleanImageUrl(nftData.image_url);
            log(`Cleaned image URL for NFT ${tokenId} from v1 endpoint`, 'unleash-nfts');
          }
          
          // Also clean the collection image if present
          if (nftData && nftData.collection && nftData.collection.image_url) {
            nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
          }
          
          return nftData;
        } catch (v1Error: any) {
          const v1ErrorMsg = v1Error.response?.data?.message || v1Error.message;
          log(`Both v2 and v1 NFT metadata endpoints failed: ${v1ErrorMsg}`, 'unleash-nfts');
          throw v1Error;
        }
      }
    } catch (error) {
      this.handleError('getNFTDetailedMetadata', error);
      return null;
    }
  }
  
  /**
   * Get NFT metadata by either contract address or slug name
   * @param options Configuration object
   * @param options.contractAddress The collection contract address
   * @param options.slugName The collection slug name
   * @param options.tokenId The NFT token ID
   * @param options.chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTMetadataFlex({ 
    contractAddress, 
    slugName, 
    tokenId, 
    chain = 'ethereum' 
  }: { 
    contractAddress?: string; 
    slugName?: string; 
    tokenId: string; 
    chain?: string;
  }): Promise<any> {
    try {
      if (!contractAddress && !slugName) {
        throw new Error("Either contractAddress or slugName must be provided for NFT metadata lookup");
      }
      
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFT metadata for token ${tokenId} on chain ${chainId}`, 'unleash-nfts');
      
      const params: Record<string, string> = {
        blockchain: chainId,
        token_id: tokenId
      };
      
      if (contractAddress) {
        params.collection_address = contractAddress;
        log(`Using collection address: ${contractAddress}`, 'unleash-nfts');
      }
      
      if (slugName) {
        params.collection_slug = slugName; // Using correct param name from docs
        log(`Using collection slug: ${slugName}`, 'unleash-nfts');
      }
      
      // Try v2 endpoint first (as per updated docs)
      try {
        const response = await axios.get(`${BASE_URL_V2}/nft/metadata`, {
          headers: this.headers,
          params
        });
        
        const nftData = response.data;
        
        // Clean any image URLs in the response
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId}`, 'unleash-nfts');
        }
        
        // Clean collection image URLs if present
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        
        return nftData;
      } catch (v2Error: any) {
        const errorMsg = v2Error.response?.data?.message || v2Error.message;
        log(`V2 NFT metadata endpoint failed: ${errorMsg}. Trying v1 endpoint...`, 'unleash-nfts');
        
        // If v2 fails, try v1 endpoint
        try {
          const response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
            headers: this.headers,
            params
          });
          
          const nftData = response.data;
          
          // Clean any image URLs in the response
          if (nftData && nftData.image_url) {
            nftData.image_url = this.cleanImageUrl(nftData.image_url);
            log(`Cleaned image URL for NFT ${tokenId} from v1 endpoint`, 'unleash-nfts');
          }
          
          // Clean collection image URLs if present
          if (nftData && nftData.collection && nftData.collection.image_url) {
            nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
          }
          
          return nftData;
        } catch (v1Error: any) {
          const v1ErrorMsg = v1Error.response?.data?.message || v1Error.message;
          log(`Both v2 and v1 NFT metadata endpoints failed: ${v1ErrorMsg}`, 'unleash-nfts');
          throw v1Error;
        }
      }
    } catch (error) {
      this.handleError('getNFTMetadataFlex', error);
      return null;
    }
  }

  /**
   * Normalize blockchain chain ID to format expected by UnleashNFTs API
   * @param chain - Chain name (ethereum, polygon, etc.)
   * @returns Normalized chain ID (1 for ethereum, etc.)
   */
  private normalizeChainId(chain: string): string {
    // Convert common chain names to their numeric IDs as required by the API
    const chainMap: {[key: string]: string} = {
      'ethereum': '1',
      'eth': '1',
      'polygon': '137',
      'matic': '137',
      'binance': '56',
      'bsc': '56',
      'avalanche': '43114',
      'avax': '43114',
      'arbitrum': '42161',
      'optimism': '10',
      'fantom': '250',
      'ftm': '250',
      'base': '8453',
      'solana': 'solana'
    };
    
    // Check if the chain is already a numeric ID
    if (/^\d+$/.test(chain)) {
      return chain;
    }
    
    // Look up the chain in our mapping
    const normalizedChain = chainMap[chain.toLowerCase()];
    
    if (normalizedChain) {
      log(`Normalized chain '${chain}' to '${normalizedChain}'`, 'unleash-nfts');
      return normalizedChain;
    }
    
    // If not found in the map, return the original (might be a numeric ID already)
    log(`Using original chain identifier: ${chain}`, 'unleash-nfts');
    return chain;
  }

  private handleError(method: string, error: any): void {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const status = error.response?.status;
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = error.config?.method || 'unknown';
    
    // Special handling for authentication errors
    if (status === 401 || errorMessage.includes('API key')) {
      log(`UnleashNfts API AUTHENTICATION ERROR in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`Please check that the VITE_BITCRUNCH_API_KEY environment variable contains a valid API key.`, 'unleash-nfts');
      
      // Show first and last 4 characters of API key for debugging
      if (API_KEY) {
        const firstFour = API_KEY.substring(0, 4);
        const lastFour = API_KEY.substring(API_KEY.length - 4);
        log(`Current API key: ${firstFour}...${lastFour}`, 'unleash-nfts');
      } else {
        log(`Current API key: Not set`, 'unleash-nfts');
      }
      
      // Registration instructions
      log(`To get a valid API key, register at unleashnfts.com and request a key from your profile`, 'unleash-nfts');
      
      // Log the request details for debugging
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else if (status === 429) {
      // Rate limiting errors
      log(`RATE LIMIT EXCEEDED in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`UnleashNFTs has rate limits on API calls. Consider:`, 'unleash-nfts');
      log(`1. Reducing request frequency`, 'unleash-nfts');
      log(`2. Adding caching mechanisms`, 'unleash-nfts');
      log(`3. Upgrading your API plan`, 'unleash-nfts');
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else if (status >= 500) {
      // Server errors
      log(`UnleashNFTs SERVER ERROR in ${method}: ${errorMessage}`, 'unleash-nfts');
      log(`This is likely a temporary issue with the UnleashNFTs API service.`, 'unleash-nfts');
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    } else {
      // Other errors
      log(`UnleashNfts API error in ${method}: ${errorMessage} (Status: ${status || 'unknown'})`, 'unleash-nfts');
      log(`Failed request: ${requestMethod.toUpperCase()} ${requestUrl}`, 'unleash-nfts');
    }
    
    console.error(`UnleashNfts API error in ${method}:`, error);
  }
}

export const unleashNftsService = new UnleashNftsService();