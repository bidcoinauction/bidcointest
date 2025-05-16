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
  if (safeCurrency !== 'USD') {
    const numAmount = typeof safeAmount === 'string' ? parseFloat(safeAmount) : safeAmount;
    return `${numAmount.toFixed(4)} ${safeCurrency}`;
  }
  
  // Format for USD
  const numAmount = typeof safeAmount === 'string' ? parseFloat(safeAmount) : safeAmount;
  return `$${numAmount.toFixed(2)}`;
}

/**
 * Format a price in USD
 * @param price The price to format
 * @returns Formatted price string with $ symbol
 */
export function formatPriceUSD(price: string | number | undefined): string {
  if (price === undefined) return '$0.00';
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return `$${priceNum.toFixed(2)}`;
}

/**
 * Format a price in native blockchain currency
 * @param price The price to format
 * @param symbol The currency symbol (ETH, MATIC, etc.)
 * @returns Formatted price with currency symbol
 */
export function formatPriceNative(price: string | number | undefined, symbol = "ETH"): string {
  if (price === undefined) return '0.00 ETH';
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return `${priceNum.toFixed(4)} ${symbol}`;
}

/**
 * Format a timestamp to a relative time string (e.g. "2h 30m")
 * @param date Date or date string
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return "Ended";
  }
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  }
  if (diffMins > 0) {
    return `${diffMins}m ${diffSecs % 60}s`;
  }
  return `${diffSecs}s`;
}

/**
 * Calculate bid increment amount based on current bid
 * @param currentBid Current bid amount
 * @returns Increment amount (0.03 USD worth)
 */
export function calculateBidIncrement(currentBid: string | number): string {
  return "0.03"; // Fixed bid increment for penny auction style
}

/**
 * Calculate bid fee based on our platform rules
 * @returns Standard bid fee ($0.24)
 */
export function calculateBidFee(): string {
  return "0.24"; // Fixed bid fee
}

/**
 * Parse a query string parameter
 * @param value Query parameter value
 * @returns Parsed value (number or original value)
 */
export function parseQueryParam(value: string | null): number | string | null {
  if (value === null) return null;
  
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num)) return num;
  
  return value;
}

/**
 * Format a date to a readable string
 * @param date Date or date string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate savings percentage based on retail price and current bid
 * For penny auctions, this is typically a high percentage (70-90%)
 * @param currentBid Current bid amount
 * @param retailPrice Full retail price 
 * @returns Percentage saved as a string
 */
export function calculateSavings(currentBid: string | number, retailPrice: string | number): string {
  const bid = typeof currentBid === 'string' ? parseFloat(currentBid) : currentBid;
  const retail = typeof retailPrice === 'string' ? parseFloat(retailPrice) : retailPrice;
  
  if (!retail || retail <= 0) return '0%';
  
  const savings = ((retail - bid) / retail) * 100;
  return `${Math.round(savings)}%`;
}

/**
 * Generate a random color for UI elements based on a string input
 * @param input String to generate color from
 * @returns Hexadecimal color string
 */
export function stringToColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  
  return color;
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param length Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, length: number = 100): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Sanitize NFT image URL to ensure it's valid and accessible
 * @param url Original URL from API
 * @returns Sanitized URL
 */
export function sanitizeNFTImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholders/nft-placeholder.png';
  
  // Handle IPFS URLs
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Handle relative URLs
  if (url.startsWith('/')) {
    // This is a relative URL, likely from our own API
    return url;
  }
  
  // Return direct URLs as-is if they're valid
  return url;
}

/**
 * Get the optimal NFT image source based on available options
 * @param nft NFT object with possible image sources
 * @returns Best available image URL
 */
export function getOptimalNFTImageSource(nft: any): string {
  // First try direct URL from NFT object
  if (nft.imageUrl) return sanitizeNFTImageUrl(nft.imageUrl);
  
  // Try metadata image if available
  if (nft.metadata && nft.metadata.image) {
    return sanitizeNFTImageUrl(nft.metadata.image);
  }
  
  // Try media.gateway if available (Alchemy format)
  if (nft.media && nft.media[0] && nft.media[0].gateway) {
    return sanitizeNFTImageUrl(nft.media[0].gateway);
  }
  
  // Try hosted image by name match
  if (nft.name) {
    const hostedImages: Record<string, string> = {
      "Doodles #1234": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ.avif",
      "Mutant Ape Yacht Club #3652": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/ebebf8da2543032f469b1a436d848822.png",
      "CryptoPunk #7804": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/0x56b0fda9566d9e9b35e37e2a29484b8ec28bb5f7833ac2f8a48ae157bad691b5.png",
      "BAYC #4269": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/4269.jpg",
      "Milady #7218": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/7218.avif",
      "DeGods #8747": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/8747-dead.png",
      "Mad Lads #8993": "https://bidcoinlanding.standard.us-east-1.oortstorages.com/8993.avif"
    };
    
    if (hostedImages[nft.name]) {
      return hostedImages[nft.name];
    }
  }
  
  // Default fallback
  return '/placeholders/nft-placeholder.png';
}

/**
 * Get blockchain explorer URL for a contract or token
 * @param address Contract or wallet address
 * @param chainId Blockchain ID (default: 1 for Ethereum)
 * @param type Type of explorer page (address, token, tx)
 * @returns Explorer URL
 */
export function getBlockchainExplorerUrl(address: string, chainId: number = 1, type: 'address' | 'token' | 'tx' = 'address'): string {
  // Default to Ethereum
  let baseUrl = 'https://etherscan.io';
  
  // Handle different chains
  switch (chainId) {
    case 137: // Polygon
      baseUrl = 'https://polygonscan.com';
      break;
    case 56: // BSC
      baseUrl = 'https://bscscan.com';
      break;
    case 43114: // Avalanche
      baseUrl = 'https://snowtrace.io';
      break;
    case 10: // Optimism
      baseUrl = 'https://optimistic.etherscan.io';
      break;
    case 42161: // Arbitrum
      baseUrl = 'https://arbiscan.io';
      break;
    default:
      baseUrl = 'https://etherscan.io';
  }
  
  return `${baseUrl}/${type}/${address}`;
}

/**
 * Format rarity value for display
 * @param rarity Rarity value as decimal (0-1)
 * @returns Formatted rarity percentage
 */
export function formatRarity(rarity: number): string {
  if (rarity === undefined || rarity === null) return 'N/A';
  
  // Convert to percentage and round to 2 decimal places
  return `${(rarity * 100).toFixed(2)}%`;
}

/**
 * Get color for rarity value
 * @param rarity Rarity value as decimal (0-1)
 * @returns CSS color class
 */
export function getRarityColor(rarity: number): string {
  if (rarity === undefined || rarity === null) return 'text-gray-500';
  
  if (rarity < 0.01) return 'text-purple-600 font-bold'; // Mythic
  if (rarity < 0.05) return 'text-orange-500 font-bold'; // Legendary
  if (rarity < 0.15) return 'text-blue-500'; // Epic
  if (rarity < 0.35) return 'text-green-500'; // Rare
  return 'text-gray-500'; // Common
}

/**
 * Get label for rarity value
 * @param rarity Rarity value as decimal (0-1)
 * @returns Rarity label
 */
export function getRarityLabel(rarity: number): string {
  if (rarity === undefined || rarity === null) return 'Unknown';
  
  if (rarity < 0.01) return 'Mythic';
  if (rarity < 0.05) return 'Legendary';
  if (rarity < 0.15) return 'Epic';
  if (rarity < 0.35) return 'Rare';
  return 'Common';
}