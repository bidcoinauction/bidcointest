// Common types for the application
export interface Activity {
  id: string;
  type: 'bid' | 'purchase' | 'listing' | 'bid-increase';
  nftId: number;
  from: string;
  to: string;
  price: number;
  currency: string;
  timestamp: Date;
}

export interface Network {
  chainId: number;
  name: string;
}

export interface BidPack {
  id: string;
  bids: number;
  price: number;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
  rarity?: number;
}