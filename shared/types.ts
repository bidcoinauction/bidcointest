// Common types for the application
export interface Activity {
  id: string;
  type: 'bid' | 'purchase';
  amount: number;
  date: Date;
}

export interface NetworkStat {
  id: string;
  name: string;
  value: number;
}

export interface BidPack {
  id: string;
  bids: number;
  price: number;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTCollection {
  contract_address: string;
  name: string;
  image_url: string;
  floor_price?: number;
}

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase';
