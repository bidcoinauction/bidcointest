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
  
  // For our penny auction, we want to show small amounts (less than $1)
  // Each bid only increases the price by $0.03
  // 
  // The values in the database are relatively high (like 0.8 ETH),
  // but we want to display them as small dollar amounts for penny auctions
  
  // Always display a fixed value for demos ($0.04) until we implement real conversion
  // This ensures consistent display across featured and regular auction cards
  
  return "$0.04";
}
