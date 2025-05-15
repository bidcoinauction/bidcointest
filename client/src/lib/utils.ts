import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names using clsx and tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format address to shortened display format
export function formatAddress(address: string | null): string {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Format currency with appropriate ticker symbol
export function formatCurrency(amount: number | string | null, currency: string | null): string {
  const safeAmount = amount ?? 0;
  const safeCurrency = currency ?? 'ETH';
  
  // Format for crypto - make values smaller to match penny auction style
  if (typeof safeAmount === 'number') {
    // For penny auctions, we want to display smaller values (like 0.1221 ETH)
    const displayAmount = safeAmount * 0.15;
    return `${displayAmount.toFixed(4)} ${safeCurrency}`;
  }
  
  // For string inputs, parse and adjust similarly
  if (typeof safeAmount === 'string') {
    const numAmount = parseFloat(safeAmount);
    if (!isNaN(numAmount)) {
      const displayAmount = numAmount * 0.15;
      return `${displayAmount.toFixed(4)} ${safeCurrency}`;
    }
  }
  
  return `${safeAmount} ${safeCurrency}`;
}

// Format date to relative time (e.g., "2 mins ago")
export function formatRelativeTime(date: Date | string | number | null): string {
  if (date === null) {
    return "recently";
  }
  
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

// Format countdown time (e.g., "01:23:45")
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00:00";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [hours, minutes, seconds]
    .map(val => val.toString().padStart(2, "0"))
    .join(":");
}

// Calculate time remaining in seconds
export function getTimeRemaining(endTime: Date | string | number | null): number {
  if (endTime === null) {
    return 0;
  }
  
  try {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  } catch (error) {
    console.error("Error calculating time remaining:", error);
    return 0;
  }
}

// Get appropriate chain currency symbol
export function getCurrencySymbol(chainId: number | null): string {
  if (!chainId) return "ETH";
  
  // Common chain IDs
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return "ETH";
    case 56: // Binance Smart Chain
      return "BNB";
    case 137: // Polygon
      return "MATIC";
    case 43114: // Avalanche
      return "AVAX";
    case 42161: // Arbitrum
      return "ETH";
    case 10: // Optimism
      return "ETH";
    default:
      return "ETH";
  }
}

// Format price to USD for penny auctions - accepts any type safely
export function formatPriceUSD(price: unknown): string {
  // Handle different input types safely
  let numPrice = 0;
  
  try {
    if (price === null || price === undefined) {
      numPrice = 0;
    } else if (typeof price === "number") {
      numPrice = isNaN(price) ? 0 : price; 
    } else if (typeof price === "string") {
      numPrice = parseFloat(price) || 0;
    } else if (typeof price === "object") {
      // In case it's a wrapped number object
      numPrice = Number(price) || 0;
    } else {
      numPrice = 0;
    }
    
    // Format as a proper USD value with 2 decimal places
    return numPrice.toFixed(2);
  } catch (e) {
    console.error("Error formatting price:", e);
    return "0.00";
  }
}

// Format number with appropriate suffixes for readability
export function formatNumber(num: number | null | undefined, digits = 1): string {
  if (num === null || num === undefined) return '0';
  
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" }
  ];
  
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function(item) {
      return num >= item.value;
    });
    
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
}

/**
 * Get a color for rarity based on percentage
 * @param rarity Rarity percentage (0-100)
 * @returns CSS color value
 */
export function getRarityColor(rarity: number | null | undefined): string {
  if (rarity === null || rarity === undefined) return 'bg-gray-500';
  
  // Ensure the rarity is a number
  const rarityNum = typeof rarity === 'string' ? parseFloat(rarity) : rarity;
  
  // Handle NaN
  if (isNaN(rarityNum)) return 'bg-gray-500';
  
  // Convert percentage to a 0-100 scale if it's provided as decimal
  const percentage = rarityNum <= 1 ? rarityNum * 100 : rarityNum;
  
  if (percentage <= 1) return 'bg-red-600'; // Legendary: <1%
  if (percentage <= 5) return 'bg-orange-500'; // Epic: 1-5%
  if (percentage <= 15) return 'bg-purple-500'; // Rare: 5-15%
  if (percentage <= 35) return 'bg-blue-500'; // Uncommon: 15-35%
  return 'bg-green-500'; // Common: >35%
}

/**
 * Get a label for rarity based on percentage
 * @param rarity Rarity percentage (0-100)
 * @returns Rarity label
 */
export function getRarityLabel(rarity: number | null | undefined): string {
  if (rarity === null || rarity === undefined) return 'Unknown';
  
  // Ensure the rarity is a number
  const rarityNum = typeof rarity === 'string' ? parseFloat(rarity) : rarity;
  
  // Handle NaN
  if (isNaN(rarityNum)) return 'Unknown';
  
  // Convert percentage to a 0-100 scale if it's provided as decimal
  const percentage = rarityNum <= 1 ? rarityNum * 100 : rarityNum;
  
  if (percentage <= 1) return 'Legendary';
  if (percentage <= 5) return 'Epic';
  if (percentage <= 15) return 'Rare';
  if (percentage <= 35) return 'Uncommon';
  return 'Common';
}

/**
 * Format rarity as a percentage string
 * @param rarity Rarity as number
 * @returns Formatted percentage string
 */
export function formatRarity(rarity: number | null | undefined): string {
  if (rarity === null || rarity === undefined) return 'Unknown';
  
  // Ensure the rarity is a number
  const rarityNum = typeof rarity === 'string' ? parseFloat(rarity) : rarity;
  
  // Handle NaN
  if (isNaN(rarityNum)) return 'Unknown';
  
  // Convert percentage to a 0-100 scale if it's provided as decimal
  const percentage = rarityNum <= 1 ? rarityNum * 100 : rarityNum;
  
  return `${percentage.toFixed(2)}%`;
}

/**
 * Get a blockchain explorer URL for an NFT
 * @param contractAddress NFT contract address
 * @param tokenId NFT token ID
 * @param blockchain Blockchain name (ethereum, polygon, etc.)
 * @returns Explorer URL
 */
export function getBlockchainExplorerUrl(
  contractAddress: string, 
  tokenId: string, 
  blockchain: string = 'ethereum'
): string {
  switch (blockchain.toLowerCase()) {
    case 'ethereum':
      return `https://etherscan.io/token/${contractAddress}?a=${tokenId}`;
    case 'polygon':
      return `https://polygonscan.com/token/${contractAddress}?a=${tokenId}`;
    case 'binance':
    case 'bsc':
      return `https://bscscan.com/token/${contractAddress}?a=${tokenId}`;
    case 'avalanche':
      return `https://snowtrace.io/token/${contractAddress}?a=${tokenId}`;
    case 'arbitrum':
      return `https://arbiscan.io/token/${contractAddress}?a=${tokenId}`;
    case 'optimism':
      return `https://optimistic.etherscan.io/token/${contractAddress}?a=${tokenId}`;
    case 'fantom':
      return `https://ftmscan.com/token/${contractAddress}?a=${tokenId}`;
    default:
      return `https://etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }
}

/**
 * Get the optimal image source for an NFT with integrated fallback systems
 * Uses a multi-tiered approach: 
 * 1. Try direct local asset if available
 * 2. Try API-provided URL with sanitization
 * 3. Fall back to placeholder
 * 
 * @param nft The NFT object
 * @returns The optimal image URL
 */
export function getOptimalNFTImageSource(nft: any): string {
  // First priority: Check for local assets that match this NFT ID (most reliable)
  const nftId = nft.id;
  
  // Known local assets with their filenames
  const knownLocalAssets: Record<number, string> = {
    1: '7218.avif',    // Map auction ID to asset filename
    2: '8993.avif',    // These are the assets we have available
    7: '7218.avif',    // Some duplicates for testing
    8: '8993.avif'
  };
  
  // If we have a matching local asset, use it directly (most reliable)
  if (knownLocalAssets[nftId]) {
    console.log(`Using direct attached asset for NFT #${nftId}: ${knownLocalAssets[nftId]}`);
    return `/attached_assets/${knownLocalAssets[nftId]}`;
  }
  
  // Second priority: If token_image_url is available from UnleashNFTs API
  if (nft.token_image_url && nft.token_image_url !== 'NA') {
    console.log(`Using token_image_url from API for NFT #${nftId}`);
    return nft.token_image_url;
  }
  
  // Third priority: Use the API-provided URL with sanitization
  return sanitizeNFTImageUrl(nft.imageUrl);
}

/**
 * Sanitize NFT image URLs to use direct IPFS gateways or authenticated sources instead of
 * third-party marketplaces which may block access
 * 
 * @param imageUrl Original image URL
 * @returns Sanitized image URL using direct sources
 */
export function sanitizeNFTImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder-nft.png';
  
  try {
    let url = imageUrl.trim();
    console.log(`Sanitizing NFT image URL: ${url}`);
    
    // Check and replace HTTP with HTTPS first for security
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
      console.log(`Converted to HTTPS: ${url}`);
    }
    
    // Special case for data URLs - leave them as is
    if (url.startsWith('data:image/')) {
      console.log(`Data URL detected, keeping as is`);
      return url;
    }
    
    // Handle malformed URLs or relative paths
    if (!url.includes('://') && !url.startsWith('data:')) {
      if (url.startsWith('/')) {
        console.log(`Keeping relative path as is`);
        return url; // Leave server relative paths as is
      } else if (url.startsWith('ipfs://')) {
        // Continue processing with IPFS handler below
      } else {
        console.log(`Malformed URL without protocol, adding https://`);
        url = 'https://' + url;
      }
    }
    
    // OpenSea URLs - Use IPFS gateway or direct URL
    if (url.includes('opensea.io') || url.includes('openseauserdata.com')) {
      const ipfsMatch = url.match(/ipfs\/([a-zA-Z0-9]+)/);
      if (ipfsMatch && ipfsMatch[1]) {
        const newUrl = `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
        console.log(`Converted OpenSea URL to IPFS gateway: ${newUrl}`);
        return newUrl;
      } else {
        // Try to extract the direct image URL from OpenSea links
        const directMatch = url.match(/([^/]+\.(png|jpg|jpeg|gif|webp|svg))/i);
        if (directMatch) {
          // Use a direct CDN URL if possible
          const newUrl = `https://i.seadn.io/gae/${directMatch[1]}`;
          console.log(`Extracted direct image from OpenSea URL: ${newUrl}`);
          return newUrl;
        }
      }
    }
    
    // Magic Eden URLs - Convert to Arweave
    if (url.includes('magiceden.io') || url.includes('magiceden.com')) {
      const idMatch = url.match(/([a-zA-Z0-9_-]{43,})/);
      if (idMatch && idMatch[1]) {
        const newUrl = `https://arweave.net/${idMatch[1]}`;
        console.log(`Converted Magic Eden URL to Arweave: ${newUrl}`);
        return newUrl;
      } else {
        // Try to extract the filename and use a direct URL
        const filenameMatch = url.match(/([^/]+\.(png|jpg|jpeg|gif|webp|svg))/i);
        if (filenameMatch) {
          // Use a public storage URL if we have the filename
          console.log(`Extracted filename from Magic Eden URL: ${filenameMatch[1]}`);
          const newUrl = `https://user-content.magiceden.io/${filenameMatch[1]}`;
          return newUrl;
        }
      }
    }
    
    // IPFS URLs with IPFS protocol
    if (url.startsWith('ipfs://')) {
      const ipfsId = url.substring(7); // Remove ipfs:// prefix
      const newUrl = `https://ipfs.io/ipfs/${ipfsId}`;
      console.log(`Converted IPFS protocol URL to gateway: ${newUrl}`);
      return newUrl;
    }
    
    // IPFS URLs with wrong gateway or path format
    if (url.includes('ipfs') && !url.includes('ipfs.io')) {
      // More comprehensive regex to extract IPFS hash
      const ipfsMatch = url.match(/ipfs[:/ ]+([a-zA-Z0-9]{46}|[a-zA-Z0-9]{59}|Qm[a-zA-Z0-9]{44})/i);
      if (ipfsMatch && ipfsMatch[1]) {
        const newUrl = `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
        console.log(`Converted to IPFS gateway URL: ${newUrl}`);
        return newUrl;
      }
    }
    
    // Arweave URLs with wrong gateway
    if (url.includes('arweave') && !url.includes('arweave.net')) {
      const arweaveMatch = url.match(/([a-zA-Z0-9_-]{43})/);
      if (arweaveMatch && arweaveMatch[1]) {
        const newUrl = `https://arweave.net/${arweaveMatch[1]}`;
        console.log(`Converted to Arweave gateway URL: ${newUrl}`);
        return newUrl;
      }
    }
    
    // Ensure properly encoded URLs for special characters
    if (url.includes(' ') || url.includes('"') || url.includes("'")) {
      const encodedUrl = encodeURI(url);
      if (encodedUrl !== url) {
        console.log(`URL encoded to handle special characters: ${encodedUrl}`);
        url = encodedUrl;
      }
    }
    
    // Handle S3 and other cloud storage URLs
    const s3Match = url.match(/amazonaws\.com\/([^/]+\/[^/]+\/[^/]+\.(png|jpg|jpeg|gif|webp|svg))/i);
    if (s3Match) {
      // Ensure we're using HTTPS for S3 URLs
      const newUrl = `https://s3.amazonaws.com/${s3Match[1]}`;
      console.log(`Normalized S3 URL: ${newUrl}`);
      return newUrl;
    }
    
    // Special case for Solana NFTs - normalize to Arweave or Metaplex CDN
    if (url.includes('solana') || url.includes('metaplex')) {
      const arweavePattern = /[a-zA-Z0-9_-]{43}/;
      const matches = url.match(arweavePattern);
      if (matches && matches[0]) {
        const newUrl = `https://arweave.net/${matches[0]}`;
        console.log(`Normalized Solana/Metaplex URL to Arweave: ${newUrl}`);
        return newUrl;
      }
    }
    
    console.log(`No URL transformation needed, returning original`);
    return url;
  } catch (error) {
    console.error('Error sanitizing NFT image URL:', error);
    return imageUrl || '/placeholder-nft.png';
  }
}
