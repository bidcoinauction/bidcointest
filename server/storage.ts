import { db } from "./db";
import { 
  users, nfts, auctions, bids, bidPacks, 
  userBidPacks, activities, auctionHistories 
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Mock data for development
const mockBidPacks = [
  { id: 1, name: 'Starter Pack', bidCount: 10, bonusBids: 0, price: '0.01', currency: 'ETH', image: '/images/bidpack-starter.png' },
  { id: 2, name: 'Pro Pack', bidCount: 50, bonusBids: 5, price: '0.04', currency: 'ETH', image: '/images/bidpack-pro.png' },
  { id: 3, name: 'Elite Pack', bidCount: 100, bonusBids: 15, price: '0.07', currency: 'ETH', image: '/images/bidpack-elite.png' }
];

const mockAuctions = [
  { 
    id: 1, 
    title: 'DEGEN TOONZ #4269', 
    description: 'DEGEN TOONZ Collection is the debut PFP collection from Degen Toonz, featuring a wide set of rare traits that make each NFT unique.',
    currentBid: '0.09',
    bidCount: 3,
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() + 60000).toISOString(),
    leader: '0x2345...6789',
    nft: {
      id: 4269,
      name: 'DEGEN TOONZ #4269',
      image: 'https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5vojLlrVRiCbV5jPQugpR-4FZ9RA-gV6-FwQDXu5gj-rV?auto=format&dpr=1&w=1000',
      contractAddress: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
      tokenId: '4269',
      blockchain: 1,
      collection: 'DEGEN TOONZ',
      floor: '12435.67'
    }
  },
  { 
    id: 2, 
    title: 'Milady #7218', 
    description: 'Milady Maker is a collection of 10,000 generative pfpNFTs.',
    currentBid: '0.03',
    bidCount: 1,
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() + 57000).toISOString(),
    leader: '0x9a8E...7FFe',
    nft: {
      id: 7218,
      name: 'Milady #7218',
      image: 'https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKQHqMc1kcXtfkhgqsLlmEbDnVwgGECIA?auto=format&dpr=1&w=1000',
      contractAddress: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
      tokenId: '7218',
      blockchain: 1,
      collection: 'Milady',
      floor: '5129.75'
    }
  }
];

const mockActivity = [
  {
    id: 1,
    type: 'bid',
    auctionId: 1,
    bidAmount: '34.0',
    currency: 'SOL',
    bidderAddress: '0x3aF1...c5D8',
    bidderName: '@digitalsea',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    nft: {
      id: 7221,
      name: 'Claynosaurz #7221',
      image: 'https://i.seadn.io/gae/jsfhye5yrhOSusDCKXquKoMQbYs-B8Nm3V2B5fZB-Hee9g_-Lk-8ddsZNKr8vLaEet2HVZ1ZvYS-e4jXTOzXk4t1QiX6EHMqSYbH7PRm?auto=format&dpr=1&w=1000',
      ordinal: '7221'
    }
  },
  {
    id: 2,
    type: 'purchase',
    auctionId: 2,
    bidAmount: '0.34',
    currency: 'ETH',
    bidderAddress: '0x8cD5...a82B',
    sellerName: '@geometrymaster',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    nft: {
      id: 7218,
      name: 'Milady #7218',
      image: 'https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKQHqMc1kcXtfkhgqsLlmEbDnVwgGECIA?auto=format&dpr=1&w=1000',
      ordinal: '7218'
    }
  },
  {
    id: 3,
    type: 'listing',
    auctionId: 1,
    bidAmount: '0.875',
    currency: 'ETH',
    sellerAddress: '@CryptoMaestro',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    nft: {
      id: 4269,
      name: 'DEGEN TOONZ #4269',
      image: 'https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5vojLlrVRiCbV5jPQugpR-4FZ9RA-gV6-FwQDXu5gj-rV?auto=format&dpr=1&w=1000',
      ordinal: '4269'
    }
  }
];

const mockBlockchainStats = {
  totalTransactions: 1245,
  averageGasPrice: '25',
  blockHeight: 17500000,
  networkHashrate: '950 TH/s'
};

export const storage = {
  getBidPacks: async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        return mockBidPacks;
      }
      return await db.select().from(bidPacks);
    } catch (error) {
      console.error('Error fetching bid packs:', error);
      return [];
    }
  },
  
  getAuctions: async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        return mockAuctions;
      }
      return await db.select().from(auctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      return [];
    }
  },
  
  getFeaturedAuctions: async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        return mockAuctions.slice(0, 1);
      }
      return await db.select().from(auctions).limit(1);
    } catch (error) {
      console.error('Error fetching featured auctions:', error);
      return [];
    }
  },
  
  getAuction: async (id: number) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        return mockAuctions.find(a => a.id === id) || null;
      }
      return await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);
    } catch (error) {
      console.error(`Error fetching auction ${id}:`, error);
      return null;
    }
  },
  
  getActivity: async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        return mockActivity;
      }
      return await db.select().from(activities);
    } catch (error) {
      console.error('Error fetching activity:', error);
      return [];
    }
  },
  
  getBlockchainStats: async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        return mockBlockchainStats;
      }
      return mockBlockchainStats;
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      return mockBlockchainStats;
    }
  }
};
