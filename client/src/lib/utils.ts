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
export function formatRelativeTime(date: Date | string | number): string {
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
export function getTimeRemaining(endTime: Date | string | number): number {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const diff = end - now;
  
  return diff > 0 ? Math.floor(diff / 1000) : 0;
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

// Format price to USD for penny auctions
export function formatPriceUSD(price: number | string): string {
  // For penny auctions, we're converting crypto price to USD
  // Each crypto unit is worth a different amount in USD
  
  // Convert the input price to a number
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  
  // For our penny auction, we want to show small amounts with exact cents
  // Each bid increases the price by exactly $0.03
  // Format as a proper USD value with 2 decimal places
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numPrice);
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
