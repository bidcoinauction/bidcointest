import {
  users, type User, type InsertUser,
  nfts, type NFT, type InsertNFT,
  auctions, type Auction, type InsertAuction,
  bids, type Bid, type InsertBid,
  bidPacks, type BidPack, type InsertBidPack,
  userBidPacks, type UserBidPack, type InsertUserBidPack,
  activities, type Activity, type InsertActivity,
  auctionHistories, type AuctionHistory, type InsertAuctionHistory,
  blockchainNetworks, type BlockchainNetwork,
  marketStats, type MarketStat,
  type BlockchainStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // NFT operations
  getNFT(id: number): Promise<NFT | undefined>;
  getNFTs(): Promise<NFT[]>;
  createNFT(nft: InsertNFT): Promise<NFT>;
  
  // Auction operations
  getAuction(id: number): Promise<Auction | undefined>;
  getAuctions(): Promise<Auction[]>;
  getFeaturedAuctions(): Promise<Auction[]>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuctionBid(id: number, currentBid: string, bidCount: number, newEndTime?: Date): Promise<Auction>;
  
  // Bid operations
  getBidsByAuction(auctionId: number): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  
  // Penny Auction Mechanics
  processAuctionBid(auctionId: number, bidderId: number): Promise<{
    success: boolean;
    auction?: Auction;
    bid?: Bid;
    userBidPack?: UserBidPack;
    error?: string;
  }>;
  extendAuctionTime(auctionId: number, extensionSeconds: number): Promise<Auction>;
  incrementAuctionPrice(auctionId: number, incrementAmount: number): Promise<Auction>;
  
  // BidPack operations
  getBidPack(id: number): Promise<BidPack | undefined>;
  getBidPacks(): Promise<BidPack[]>;
  createBidPack(bidPack: InsertBidPack): Promise<BidPack>;
  
  // UserBidPack operations
  getUserBidPacks(userId: number): Promise<UserBidPack[]>;
  createUserBidPack(userBidPack: InsertUserBidPack): Promise<UserBidPack>;
  updateUserBidPackCount(id: number, bidsRemaining: number): Promise<UserBidPack>;
  consumeBid(userId: number): Promise<{
    success: boolean;
    userBidPack?: UserBidPack;
    error?: string;
  }>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Auction History operations
  getAuctionHistory(auctionId: number): Promise<AuctionHistory[]>;
  createAuctionHistory(history: InsertAuctionHistory): Promise<AuctionHistory>;
  
  // Blockchain Integration
  recordBidOnBlockchain(bidId: number): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }>;
  verifyBidTransaction(transactionId: string): Promise<boolean>;
  
  // Settlement Process
  finalizeAuction(auctionId: number): Promise<{
    success: boolean;
    winner?: User;
    finalPrice?: string;
    error?: string;
  }>;
  
  // BitCrunch related operations
  getBlockchainStats(): Promise<BlockchainStats>;
}

// In-memory implementation of storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private nfts: Map<number, NFT>;
  private auctions: Map<number, Auction>;
  private bids: Map<number, Bid>;
  private bidPacks: Map<number, BidPack>;
  private userBidPacks: Map<number, UserBidPack>;
  private activities: Map<number, Activity>;
  private auctionHistories: Map<number, AuctionHistory>;
  private blockchainNetworks: Map<number, BlockchainNetwork>;
  private marketStats: Map<number, MarketStat>;
  
  private userId: number = 1;
  private nftId: number = 1;
  private auctionId: number = 1;
  private bidId: number = 1;
  private bidPackId: number = 1;
  private userBidPackId: number = 1;
  private activityId: number = 1;
  private auctionHistoryId: number = 1;
  private blockchainNetworkId: number = 1;
  private marketStatId: number = 1;

  constructor() {
    this.users = new Map();
    this.nfts = new Map();
    this.auctions = new Map();
    this.bids = new Map();
    this.bidPacks = new Map();
    this.userBidPacks = new Map();
    this.activities = new Map();
    this.auctionHistories = new Map();
    this.blockchainNetworks = new Map();
    this.marketStats = new Map();
    
    // Initialize with sample data
    this.initializeData();
  }

  // Initialize with sample data
  private async initializeData() {
    // Create users
    const user1 = await this.createUser({
      username: "CryptoMaestro",
      password: "password123",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      email: "crypto@example.com",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "Digital artist and crypto enthusiast"
    });

    const user2 = await this.createUser({
      username: "geometrymaster",
      password: "password123",
      walletAddress: "0x2345678901abcdef2345678901abcdef23456789",
      email: "geometry@example.com",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "Geometry and abstract art creator"
    });

    const user3 = await this.createUser({
      username: "pixelqueen",
      password: "password123",
      walletAddress: "0x3456789012abcdef3456789012abcdef34567890",
      email: "pixel@example.com",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "Pixel art creator and collector"
    });

    const user4 = await this.createUser({
      username: "3Dmaster",
      password: "password123",
      walletAddress: "0x4567890123abcdef4567890123abcdef45678901",
      email: "3d@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "3D artist and digital creator"
    });

    const user5 = await this.createUser({
      username: "cryptovision",
      password: "password123",
      walletAddress: "0x5678901234abcdef5678901234abcdef56789012",
      email: "vision@example.com",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "Blockchain artist and visionary"
    });

    const user6 = await this.createUser({
      username: "digitalsea",
      password: "password123",
      walletAddress: "0x6789012345abcdef6789012345abcdef67890123",
      email: "sea@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "Digital ocean art creator"
    });

    const user7 = await this.createUser({
      username: "futurescape",
      password: "password123",
      walletAddress: "0x7890123456abcdef7890123456abcdef78901234",
      email: "future@example.com",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
      bio: "Futuristic landscape artist"
    });

    // Create NFTs
    const nft1 = await this.createNFT({
      name: "DEGEN TOONZ #4269",
      description: "DEGEN TOONZ Collection is the debut PFP collection from Degen Toonz, featuring a wide set of rare traits that make each NFT unique.",
      imageUrl: "/assets/nft_images/degen_toonz.png",
      tokenId: "4269",
      contractAddress: "0xbba9187d5108e395d0681462523c4404de06a497",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "7.5",
      collection: "DEGEN TOONZ",
      floorPrice: "0",
      currency: "ETH",
      category: "pfp",
      items: 10000,
      creatorId: user1.id,
      attributes: [
        { trait_type: "Background", value: "Orange", rarity: "12%" },
        { trait_type: "Clothes", value: "Orange Hoodie", rarity: "8%" },
        { trait_type: "Eyes", value: "Laser", rarity: "15%" },
        { trait_type: "Mouth", value: "Bored", rarity: "5%" }
      ]
    });

    const nft2 = await this.createNFT({
      name: "Milady #7218",
      description: "Milady Maker is a collection of 10,000 randomly generated Milady NFTs on the Ethereum blockchain.",
      imageUrl: "/assets/nft_images/milady.png",
      tokenId: "7218",
      contractAddress: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "5.0",
      collection: "Milady Maker",
      floorPrice: "0",
      currency: "ETH",
      category: "pfp",
      items: 10000,
      creatorId: user2.id,
      attributes: [
        { trait_type: "Background", value: "Red", rarity: "8%" },
        { trait_type: "Face", value: "Ecstatic", rarity: "15%" },
        { trait_type: "Hair", value: "Red Buns", rarity: "4%" },
        { trait_type: "Outfit", value: "Blue Dress", rarity: "7%" }
      ]
    });

    const nft3 = await this.createNFT({
      name: "MadLads #8993",
      description: "Mad Lads is a collection of 10,000 NFTs on the Solana blockchain. Each Mad Lad represents a member of the community of creators, artists, and builders.",
      imageUrl: "/assets/nft_images/mad_lads.png",
      tokenId: "8993",
      contractAddress: "0xc88bfed94fd57443a012787bd43958fbd8553c69",
      blockchain: "SOL",
      tokenStandard: "Metaplex",
      royalty: "5.0",
      collection: "Mad Lads",
      floorPrice: "0",
      currency: "SOL",
      category: "pfp",
      items: 10000,
      creatorId: user3.id,
      attributes: [
        { trait_type: "Background", value: "Blue", rarity: "7%" },
        { trait_type: "Clothing", value: "Black Hoodie", rarity: "3%" },
        { trait_type: "Expression", value: "Smirk", rarity: "5%" },
        { trait_type: "Headwear", value: "Crown", rarity: "2%" }
      ]
    });

    const nft4 = await this.createNFT({
      name: "Azuki #9605",
      description: "Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden: a corner of the internet where artists, builders, and web3 enthusiasts meet to create a decentralized future.",
      imageUrl: "/assets/nft_images/120.png",
      tokenId: "9605",
      contractAddress: "0xed5af388653567af2f388e6224dc7c4b3241c544",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "7.5",
      collection: "Azuki",
      floorPrice: "0",
      currency: "ETH",
      category: "pfp",
      items: 10000,
      creatorId: user4.id,
      attributes: [
        { trait_type: "Hair", value: "Pink Spiky", rarity: "5%" },
        { trait_type: "Clothing", value: "Kimono", rarity: "15%" },
        { trait_type: "Eyes", value: "Suspicious", rarity: "10%" },
        { trait_type: "Background", value: "Off White C", rarity: "20%" }
      ]
    });

    const nft5 = await this.createNFT({
      name: "DeGods #8748",
      description: "DeGods is a digital art collection and global community of creators, innovators, and frens. Consider this your digital identity into the DeGods ecosystem.",
      imageUrl: "/assets/nft_images/razor1911nfo.png",
      tokenId: "8748",
      contractAddress: "0x60cd862c9c687a9de49aecdc3a99b74a4fc54ab6",
      blockchain: "SOL",
      tokenStandard: "Metaplex",
      royalty: "7.0",
      collection: "DeGods",
      floorPrice: "0",
      currency: "SOL",
      category: "pfp",
      items: 10000,
      creatorId: user5.id,
      attributes: [
        { trait_type: "Background", value: "Gray", rarity: "8%" },
        { trait_type: "Skin", value: "Gold", rarity: "4%" },
        { trait_type: "Eyes", value: "Sleepy", rarity: "7%" },
        { trait_type: "Mouth", value: "Neutral", rarity: "15%" }
      ]
    });

    const nft6 = await this.createNFT({
      name: "Claynosaurz #7221",
      description: "Claynosaurz is a collection of 10,000 unique 3D characters, made of clay, living on the Solana blockchain. Claynosaurz is a PFP project that is building a 3D world.",
      imageUrl: "/assets/nft_images/tpb.jpg",
      tokenId: "7221",
      contractAddress: "0x4aEb52dB83DaA33a31673599E892d9247b0449cA",
      blockchain: "SOL",
      tokenStandard: "Metaplex",
      royalty: "5.0",
      collection: "Claynosaurz",
      floorPrice: "0",
      currency: "SOL",
      category: "pfp",
      items: 10000,
      creatorId: user6.id,
      attributes: [
        { trait_type: "Species", value: "Diplodocus", rarity: "7%" },
        { trait_type: "Skin", value: "Sunset", rarity: "5%" },
        { trait_type: "Eyes", value: "Friendly", rarity: "15%" },
        { trait_type: "Background", value: "Violet", rarity: "10%" }
      ]
    });

    const nft7 = await this.createNFT({
      name: "Milady #8697",
      description: "Milady Maker is a collection of 10,000 generative PFPs based on a variation of the y2k Millennial Ms Paint aesthetic.",
      imageUrl: "/assets/nft_images/milady.png",
      tokenId: "8697",
      contractAddress: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "7.5",
      collection: "Milady",
      floorPrice: "0",
      currency: "ETH",
      category: "pfp",
      items: 10000,
      creatorId: user7.id,
      attributes: [
        { trait_type: "Face", value: "Makeup Blue", rarity: "2%" },
        { trait_type: "Hair", value: "Buns Blonde", rarity: "5%" },
        { trait_type: "Background", value: "Purple", rarity: "7%" },
        { trait_type: "Drip", value: "Fuzzy Coat", rarity: "3%" }
      ]
    });

    // Create auctions
    const oneDay = 24 * 60 * 60 * 1000;
    const threeDays = 3 * oneDay;
    const fiveDays = 5 * oneDay;
    const tenDays = 10 * oneDay;

    const auction1 = await this.createAuction({
      nftId: nft1.id,
      startingBid: "0",
      currentBid: "0.24",
      currency: "ETH",
      endTime: new Date(Date.now() + oneDay),
      featured: true,
      creatorId: user1.id,
    });

    const auction2 = await this.createAuction({
      nftId: nft2.id,
      startingBid: "0.2",
      currentBid: "0.34",
      currency: "ETH",
      endTime: new Date(Date.now() + fiveDays),
      featured: false,
      creatorId: user2.id,
    });

    const auction3 = await this.createAuction({
      nftId: nft3.id,
      startingBid: "0.015",
      currentBid: "0.027",
      currency: "SOL",
      endTime: new Date(Date.now() + threeDays),
      featured: false,
      creatorId: user3.id,
    });

    const auction4 = await this.createAuction({
      nftId: nft4.id,
      startingBid: "10.0",
      currentBid: "15.5",
      currency: "ETH",
      endTime: new Date(Date.now() - oneDay),
      featured: false,
      creatorId: user4.id,
    });

    const auction5 = await this.createAuction({
      nftId: nft5.id,
      startingBid: "1200.0",
      currentBid: "1390.0",
      currency: "SOL",
      endTime: new Date(Date.now() + tenDays),
      featured: true,
      creatorId: user5.id,
    });

    const auction6 = await this.createAuction({
      nftId: nft6.id,
      startingBid: "25.0",
      currentBid: "34.0",
      currency: "SOL",
      endTime: new Date(Date.now() + (oneDay * 2)),
      featured: true,
      creatorId: user6.id,
    });

    const auction7 = await this.createAuction({
      nftId: nft7.id,
      startingBid: "2.0",
      currentBid: "2.88",
      currency: "ETH",
      endTime: new Date(Date.now() + (oneDay * 9)),
      featured: true,
      creatorId: user7.id,
    });

    // Create bids
    await this.createBid({
      auctionId: auction1.id,
      bidderId: user2.id,
      amount: "0.6",
    });

    await this.createBid({
      auctionId: auction1.id,
      bidderId: user3.id,
      amount: "0.75",
    });

    await this.createBid({
      auctionId: auction1.id,
      bidderId: user5.id,
      amount: "0.875",
    });

    await this.createBid({
      auctionId: auction2.id,
      bidderId: user1.id,
      amount: "0.22",
    });

    await this.createBid({
      auctionId: auction2.id,
      bidderId: user4.id,
      amount: "0.28",
    });

    await this.createBid({
      auctionId: auction2.id,
      bidderId: user5.id,
      amount: "0.34",
    });

    await this.createBid({
      auctionId: auction3.id,
      bidderId: user2.id,
      amount: "0.018",
    });

    await this.createBid({
      auctionId: auction3.id,
      bidderId: user4.id,
      amount: "0.022",
    });

    await this.createBid({
      auctionId: auction3.id,
      bidderId: user6.id,
      amount: "0.027",
    });

    await this.createBid({
      auctionId: auction4.id,
      bidderId: user1.id,
      amount: "110.0",
    });

    await this.createBid({
      auctionId: auction4.id,
      bidderId: user3.id,
      amount: "125.0",
    });

    await this.createBid({
      auctionId: auction4.id,
      bidderId: user7.id,
      amount: "145.0",
    });

    await this.createBid({
      auctionId: auction5.id,
      bidderId: user1.id,
      amount: "1250.0",
    });

    await this.createBid({
      auctionId: auction5.id,
      bidderId: user2.id,
      amount: "1320.0",
    });

    await this.createBid({
      auctionId: auction5.id,
      bidderId: user3.id,
      amount: "1390.0",
    });

    await this.createBid({
      auctionId: auction6.id,
      bidderId: user4.id,
      amount: "28.0",
    });

    await this.createBid({
      auctionId: auction6.id,
      bidderId: user5.id,
      amount: "31.5",
    });

    await this.createBid({
      auctionId: auction6.id,
      bidderId: user7.id,
      amount: "34.0",
    });

    await this.createBid({
      auctionId: auction7.id,
      bidderId: user1.id,
      amount: "2.2",
    });

    await this.createBid({
      auctionId: auction7.id,
      bidderId: user2.id,
      amount: "2.55",
    });

    await this.createBid({
      auctionId: auction7.id,
      bidderId: user3.id,
      amount: "2.88",
    });

    // Create auction histories
    await this.createAuctionHistory({
      auctionId: auction1.id,
      description: "Auction created by CryptoMaestro",
      icon: "fa-plus-circle",
    });

    await this.createAuctionHistory({
      auctionId: auction1.id,
      description: "Bid placed for 0.6 ETH by geometrymaster",
      icon: "fa-gavel",
    });

    await this.createAuctionHistory({
      auctionId: auction1.id,
      description: "Bid placed for 0.75 ETH by pixelqueen",
      icon: "fa-gavel",
    });

    await this.createAuctionHistory({
      auctionId: auction1.id,
      description: "Bid placed for 0.875 ETH by cryptovision",
      icon: "fa-gavel",
    });

    // Create bid packs
    await this.createBidPack({
      name: "Starter Pack",
      type: "starter",
      bidCount: 10,
      bonusBids: 2,
      price: "0.01",
      originalPrice: "0.015",
      currency: "BTC",
      available: true,
    });

    await this.createBidPack({
      name: "Pro Pack",
      type: "pro",
      bidCount: 50,
      bonusBids: 15,
      price: "0.04",
      originalPrice: "0.065",
      currency: "BTC",
      available: true,
    });

    await this.createBidPack({
      name: "Premium Pack",
      type: "premium",
      bidCount: 125,
      bonusBids: 50,
      price: "0.09",
      originalPrice: "0.15",
      currency: "BTC",
      available: true,
    });

    await this.createBidPack({
      name: "Whale Pack",
      type: "whale",
      bidCount: 300,
      bonusBids: 150,
      price: "0.18",
      originalPrice: "0.30",
      currency: "BTC",
      available: true,
    });

    // Create activities
    await this.createActivity({
      type: "bid",
      nftId: nft6.id,
      from: "0x3aF1...c5D8",
      to: "@digitalsea",
      price: "34.0",
      currency: "SOL",
    });

    await this.createActivity({
      type: "purchase",
      nftId: nft2.id,
      from: "@geometrymaster",
      to: "0x8cD5...a82B",
      price: "0.34",
      currency: "ETH",
    });

    await this.createActivity({
      type: "listing",
      nftId: nft1.id,
      from: "@CryptoMaestro",
      to: "Auction House",
      price: "0.875",
      currency: "ETH",
    });

    await this.createActivity({
      type: "bid-increase",
      nftId: nft3.id,
      from: "0x3aF1...c5D8",
      to: "@pixelqueen",
      price: "0.027",
      currency: "BTC",
    });

    // Create blockchain networks for BitCrunch API data
    await this.createBlockchainNetwork({
      name: "Bitcoin",
      price: "43256.78",
      change: "+2.34%",
      gradient: "bg-gradient-to-r from-orange-500 to-orange-300",
    });

    await this.createBlockchainNetwork({
      name: "Ethereum",
      price: "3127.45",
      change: "-1.87%",
      gradient: "bg-gradient-to-r from-indigo-500 to-purple-500",
    });

    await this.createBlockchainNetwork({
      name: "Solana",
      price: "102.89",
      change: "+5.67%",
      gradient: "bg-gradient-to-r from-green-500 to-teal-500",
    });

    await this.createBlockchainNetwork({
      name: "Polygon",
      price: "1.15",
      change: "+3.21%",
      gradient: "bg-gradient-to-r from-pink-500 to-rose-500",
    });

    // Create market stats for BitCrunch API data
    await this.createMarketStat({
      label: "24h Volume",
      value: "$24.3M",
      change: "+12.5% from yesterday",
    });

    await this.createMarketStat({
      label: "Floor Price (avg)",
      value: "0.87 ETH",
      change: "-2.3% from yesterday",
    });

    await this.createMarketStat({
      label: "New Collections",
      value: "134",
      change: "+23 from yesterday",
    });

    await this.createMarketStat({
      label: "Active Wallets",
      value: "45.2K",
      change: "+5.7% from yesterday",
    });
  }

  /* User operations */
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  /* NFT operations */
  async getNFT(id: number): Promise<NFT | undefined> {
    const nft = this.nfts.get(id);
    if (!nft) return undefined;

    const creator = await this.getUser(nft.creatorId);
    if (!creator) return undefined;

    return { ...nft, creator };
  }

  async getNFTs(): Promise<NFT[]> {
    const nfts: NFT[] = [];
    for (const nft of this.nfts.values()) {
      const creator = await this.getUser(nft.creatorId);
      if (creator) {
        nfts.push({ ...nft, creator });
      }
    }
    return nfts;
  }

  async createNFT(insertNft: InsertNFT): Promise<NFT> {
    const id = this.nftId++;
    const now = new Date();
    const nft = { ...insertNft, id, createdAt: now };
    this.nfts.set(id, nft);

    const creator = await this.getUser(insertNft.creatorId);
    return { ...nft, creator: creator! };
  }

  /* Auction operations */
  async getAuction(id: number): Promise<Auction | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;

    const nft = await this.getNFT(auction.nftId);
    if (!nft) return undefined;

    const creator = await this.getUser(auction.creatorId);
    if (!creator) return undefined;

    const auctionBids = await this.getBidsByAuction(id);
    const history = await this.getAuctionHistory(id);

    return { ...auction, nft, creator, bids: auctionBids, history };
  }

  async getAuctions(): Promise<Auction[]> {
    const auctions: Auction[] = [];
    for (const auction of this.auctions.values()) {
      const nft = await this.getNFT(auction.nftId);
      const creator = await this.getUser(auction.creatorId);
      const auctionBids = await this.getBidsByAuction(auction.id);
      const history = await this.getAuctionHistory(auction.id);

      if (nft && creator) {
        auctions.push({ ...auction, nft, creator, bids: auctionBids, history });
      }
    }
    return auctions;
  }

  async getFeaturedAuctions(): Promise<Auction[]> {
    const allAuctions = await this.getAuctions();
    return allAuctions.filter(auction => auction.featured);
  }

  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = this.auctionId++;
    const now = new Date();
    const auction = { 
      ...insertAuction, 
      id, 
      createdAt: now, 
      bidCount: 0
    };
    this.auctions.set(id, auction);

    const nft = await this.getNFT(insertAuction.nftId);
    const creator = await this.getUser(insertAuction.creatorId);

    return { ...auction, nft: nft!, creator: creator!, bids: [], history: [] };
  }

  async updateAuctionBid(id: number, currentBid: string, bidCount: number, newEndTime?: Date): Promise<Auction> {
    const auction = this.auctions.get(id);
    if (!auction) {
      throw new Error(`Auction with ID ${id} not found`);
    }

    const updatedAuction = { 
      ...auction, 
      currentBid, 
      bidCount,
      endTime: newEndTime || auction.endTime 
    };
    this.auctions.set(id, updatedAuction);

    return this.getAuction(id) as Promise<Auction>;
  }
  
  // Penny Auction Mechanics
  async processAuctionBid(auctionId: number, bidderId: number): Promise<{
    success: boolean;
    auction?: Auction;
    bid?: Bid;
    userBidPack?: UserBidPack;
    error?: string;
  }> {
    try {
      // Step 1: Check if the auction exists
      const auction = await this.getAuction(auctionId);
      if (!auction) {
        return { success: false, error: `Auction with id ${auctionId} not found` };
      }
      
      // Step 2: Check if the auction is still active
      const now = new Date();
      if (new Date(auction.endTime) < now) {
        return { success: false, error: 'Auction has ended' };
      }
      
      // Step 3: Check if the user has bids available
      const userBidPackResult = await this.consumeBid(bidderId);
      if (!userBidPackResult.success) {
        return { 
          success: false, 
          error: userBidPackResult.error || 'No bids available' 
        };
      }
      
      // Step 4: Calculate the new price (current price + $0.03)
      const currentBid = Number(auction.currentBid || auction.startingBid);
      const bidIncrement = 0.03; // $0.03 increment per bid
      const newBidAmount = (currentBid + bidIncrement).toFixed(4);
      
      // Step 5: Extend the auction time
      const extensionSeconds = Math.floor(Math.random() * 6) + 10; // 10-15 seconds
      let newEndTime = new Date(auction.endTime);
      newEndTime.setSeconds(newEndTime.getSeconds() + extensionSeconds);
      
      // Step 6: Update the auction with new bid amount, end time, and increment bid count
      const updatedBidCount = (auction.bidCount || 0) + 1;
      const updatedAuction = await this.updateAuctionBid(
        auctionId, 
        newBidAmount, 
        updatedBidCount, 
        newEndTime
      );
      
      // Step 7: Create bid record
      const bid = await this.createBid({
        auctionId,
        bidderId,
        amount: newBidAmount
      });
      
      // Step 8: Record bid on blockchain (in a real implementation)
      const blockchainRecord = await this.recordBidOnBlockchain(bid.id);
      if (!blockchainRecord.success) {
        console.warn(`Failed to record bid on blockchain: ${blockchainRecord.error}`);
        // Continue anyway, we'll retry later
      }
      
      // Step 9: Create auction history record
      await this.createAuctionHistory({
        auctionId,
        description: `New bid of ${newBidAmount} placed`,
        icon: 'hammer'
      });
      
      // Step 10: Create activity record
      await this.createActivity({
        type: 'bid',
        nftId: auction.nftId,
        from: 'system',
        to: bidderId.toString(),
        price: newBidAmount,
        currency: auction.currency || 'ETH'
      });
      
      return {
        success: true,
        auction: updatedAuction,
        bid,
        userBidPack: userBidPackResult.userBidPack
      };
    } catch (error) {
      console.error('Error processing auction bid:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  async extendAuctionTime(auctionId: number, extensionSeconds: number): Promise<Auction> {
    const auction = await this.getAuction(auctionId);
    if (!auction) {
      throw new Error(`Auction with id ${auctionId} not found`);
    }
    
    let newEndTime = new Date(auction.endTime);
    newEndTime.setSeconds(newEndTime.getSeconds() + extensionSeconds);
    
    return this.updateAuctionBid(
      auctionId, 
      auction.currentBid || auction.startingBid, 
      auction.bidCount || 0, 
      newEndTime
    );
  }
  
  async incrementAuctionPrice(auctionId: number, incrementAmount: number): Promise<Auction> {
    const auction = await this.getAuction(auctionId);
    if (!auction) {
      throw new Error(`Auction with id ${auctionId} not found`);
    }
    
    const currentBid = Number(auction.currentBid || auction.startingBid);
    const newBidAmount = (currentBid + incrementAmount).toFixed(4);
    
    return this.updateAuctionBid(
      auctionId, 
      newBidAmount, 
      auction.bidCount || 0
    );
  }

  /* Bid operations */
  async getBidsByAuction(auctionId: number): Promise<Bid[]> {
    const bids: Bid[] = [];
    for (const bid of this.bids.values()) {
      if (bid.auctionId === auctionId) {
        const bidder = await this.getUser(bid.bidderId);
        if (bidder) {
          bids.push({ ...bid, bidder });
        }
      }
    }
    // Sort by timestamp (newest first)
    return bids.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.bidId++;
    const now = new Date();
    const bid = { ...insertBid, id, timestamp: now };
    this.bids.set(id, bid);

    // Update auction bid count
    const auction = await this.auctions.get(insertBid.auctionId);
    if (auction) {
      await this.updateAuctionBid(insertBid.auctionId, insertBid.amount, auction.bidCount + 1);
    }

    const bidder = await this.getUser(insertBid.bidderId);
    return { ...bid, bidder: bidder! };
  }

  /* BidPack operations */
  async getBidPack(id: number): Promise<BidPack | undefined> {
    return this.bidPacks.get(id);
  }

  async getBidPacks(): Promise<BidPack[]> {
    return Array.from(this.bidPacks.values());
  }

  async createBidPack(insertBidPack: InsertBidPack): Promise<BidPack> {
    const id = this.bidPackId++;
    const bidPack: BidPack = { ...insertBidPack, id };
    this.bidPacks.set(id, bidPack);
    return bidPack;
  }

  /* UserBidPack operations */
  async getUserBidPacks(userId: number): Promise<UserBidPack[]> {
    const userBidPacks: UserBidPack[] = [];
    for (const userBidPack of this.userBidPacks.values()) {
      if (userBidPack.userId === userId) {
        const bidPack = await this.getBidPack(userBidPack.bidPackId);
        const user = await this.getUser(userBidPack.userId);
        if (bidPack && user) {
          userBidPacks.push({ ...userBidPack, bidPack, user });
        }
      }
    }
    return userBidPacks;
  }

  async createUserBidPack(insertUserBidPack: InsertUserBidPack): Promise<UserBidPack> {
    const id = this.userBidPackId++;
    const now = new Date();
    const userBidPack = { ...insertUserBidPack, id, purchaseDate: now };
    this.userBidPacks.set(id, userBidPack);

    const bidPack = await this.getBidPack(insertUserBidPack.bidPackId);
    const user = await this.getUser(insertUserBidPack.userId);

    return { ...userBidPack, bidPack: bidPack!, user: user! };
  }

  async updateUserBidPackCount(id: number, bidsRemaining: number): Promise<UserBidPack> {
    const userBidPack = this.userBidPacks.get(id);
    if (!userBidPack) {
      throw new Error(`UserBidPack with ID ${id} not found`);
    }

    const updatedUserBidPack = { ...userBidPack, bidsRemaining };
    this.userBidPacks.set(id, updatedUserBidPack);

    const bidPack = await this.getBidPack(userBidPack.bidPackId);
    const user = await this.getUser(userBidPack.userId);

    return { ...updatedUserBidPack, bidPack: bidPack!, user: user! };
  }

  /* Activity operations */
  async getActivities(): Promise<Activity[]> {
    const activities: Activity[] = [];
    for (const activity of this.activities.values()) {
      const nft = await this.getNFT(activity.nftId);
      if (nft) {
        activities.push({ ...activity, nft });
      }
    }
    // Sort by timestamp (newest first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity = { ...insertActivity, id, timestamp: now };
    this.activities.set(id, activity);

    const nft = await this.getNFT(insertActivity.nftId);
    return { ...activity, nft: nft! };
  }

  /* Auction History operations */
  async getAuctionHistory(auctionId: number): Promise<AuctionHistory[]> {
    const history: AuctionHistory[] = [];
    for (const event of this.auctionHistories.values()) {
      if (event.auctionId === auctionId) {
        history.push(event);
      }
    }
    // Sort by timestamp (newest first)
    return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createAuctionHistory(insertHistory: InsertAuctionHistory): Promise<AuctionHistory> {
    const id = this.auctionHistoryId++;
    const now = new Date();
    const history = { ...insertHistory, id, timestamp: now };
    this.auctionHistories.set(id, history);
    return history;
  }

  /* BitCrunch related operations */
  private async createBlockchainNetwork(network: Omit<BlockchainNetwork, 'id'>): Promise<BlockchainNetwork> {
    const id = this.blockchainNetworkId++;
    const blockchainNetwork: BlockchainNetwork = { ...network, id };
    this.blockchainNetworks.set(id, blockchainNetwork);
    return blockchainNetwork;
  }

  private async createMarketStat(stat: Omit<MarketStat, 'id'>): Promise<MarketStat> {
    const id = this.marketStatId++;
    const marketStat: MarketStat = { ...stat, id };
    this.marketStats.set(id, marketStat);
    return marketStat;
  }

  async getBlockchainStats(): Promise<BlockchainStats> {
    return {
      networks: Array.from(this.blockchainNetworks.values()),
      marketStats: Array.from(this.marketStats.values())
    };
  }
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getNFT(id: number): Promise<NFT | undefined> {
    const [nft] = await db.select().from(nfts).where(eq(nfts.id, id));
    if (!nft) return undefined;
    
    // Get creator
    const creator = await this.getUser(nft.creatorId || 1);
    
    return { ...nft, creator: creator!, attributes: nft.attributes || [] };
  }

  async getNFTs(): Promise<NFT[]> {
    const allNfts = await db.select().from(nfts);
    
    // Get all creators
    const creatorIds = [...new Set(allNfts.map(nft => nft.creatorId).filter(Boolean))];
    const creators = await Promise.all(creatorIds.map(id => this.getUser(id || 1)));
    const creatorsMap = new Map(creators.map(creator => [creator!.id, creator]));
    
    return allNfts.map(nft => ({
      ...nft,
      creator: creatorsMap.get(nft.creatorId || 1)!,
      attributes: nft.attributes || []
    }));
  }

  async createNFT(insertNft: InsertNFT): Promise<NFT> {
    const [nft] = await db
      .insert(nfts)
      .values(insertNft)
      .returning();
    
    const creator = await this.getUser(nft.creatorId || 1);
    
    return { ...nft, creator: creator!, attributes: nft.attributes || [] };
  }

  async getAuction(id: number): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    if (!auction) return undefined;
    
    // Get NFT
    const nft = await this.getNFT(auction.nftId);
    
    // Get creator
    const creator = await this.getUser(auction.creatorId || 1);
    
    // Get bids
    const auctionBids = await this.getBidsByAuction(id);
    
    // Get history
    const history = await this.getAuctionHistory(id);
    
    return { ...auction, nft: nft!, creator: creator!, bids: auctionBids, history };
  }

  async getAuctions(): Promise<Auction[]> {
    const allAuctions = await db.select().from(auctions);
    return Promise.all(allAuctions.map(auction => this.getAuction(auction.id)));
  }

  async getFeaturedAuctions(): Promise<Auction[]> {
    const featuredAuctions = await db
      .select()
      .from(auctions)
      .where(eq(auctions.featured, true));
    
    return Promise.all(featuredAuctions.map(auction => this.getAuction(auction.id)));
  }

  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const [auction] = await db
      .insert(auctions)
      .values(insertAuction)
      .returning();
    
    return this.getAuction(auction.id) as Promise<Auction>;
  }

  async updateAuctionBid(id: number, currentBid: string, bidCount: number, newEndTime?: Date): Promise<Auction> {
    const [updatedAuction] = await db
      .update(auctions)
      .set({ 
        currentBid, 
        bidCount,
        ...(newEndTime && { endTime: newEndTime })
      })
      .where(eq(auctions.id, id))
      .returning();
    
    return this.getAuction(id) as Promise<Auction>;
  }

  async getBidsByAuction(auctionId: number): Promise<Bid[]> {
    const auctionBids = await db
      .select()
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.timestamp));
    
    // Get all bidders
    const bidderIds = [...new Set(auctionBids.map(bid => bid.bidderId))];
    const bidders = await Promise.all(bidderIds.map(id => this.getUser(id)));
    const biddersMap = new Map(bidders.map(bidder => [bidder!.id, bidder]));
    
    return auctionBids.map(bid => ({
      ...bid,
      bidder: biddersMap.get(bid.bidderId)!
    }));
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const now = new Date();
    const bidWithTimestamp = { ...insertBid, timestamp: now };
    
    const [bid] = await db
      .insert(bids)
      .values(bidWithTimestamp)
      .returning();
    
    const bidder = await this.getUser(bid.bidderId);
    
    return { ...bid, bidder: bidder! };
  }

  async getBidPack(id: number): Promise<BidPack | undefined> {
    const [bidPack] = await db.select().from(bidPacks).where(eq(bidPacks.id, id));
    return bidPack || undefined;
  }

  async getBidPacks(): Promise<BidPack[]> {
    return db.select().from(bidPacks);
  }

  async createBidPack(insertBidPack: InsertBidPack): Promise<BidPack> {
    const [bidPack] = await db
      .insert(bidPacks)
      .values(insertBidPack)
      .returning();
    
    return bidPack;
  }

  async getUserBidPacks(userId: number): Promise<UserBidPack[]> {
    const userPacks = await db
      .select()
      .from(userBidPacks)
      .where(eq(userBidPacks.userId, userId));
    
    // Get user
    const user = await this.getUser(userId);
    
    // Get all bid packs
    const packIds = [...new Set(userPacks.map(pack => pack.bidPackId))];
    const packs = await Promise.all(packIds.map(id => this.getBidPack(id)));
    const packsMap = new Map(packs.map(pack => [pack!.id, pack]));
    
    return userPacks.map(userPack => ({
      ...userPack,
      user: user!,
      bidPack: packsMap.get(userPack.bidPackId)!
    }));
  }

  async createUserBidPack(insertUserBidPack: InsertUserBidPack): Promise<UserBidPack> {
    const [userBidPack] = await db
      .insert(userBidPacks)
      .values(insertUserBidPack)
      .returning();
    
    const user = await this.getUser(userBidPack.userId);
    const bidPack = await this.getBidPack(userBidPack.bidPackId);
    
    return { ...userBidPack, user: user!, bidPack: bidPack! };
  }

  async updateUserBidPackCount(id: number, bidsRemaining: number): Promise<UserBidPack> {
    const [updatedUserBidPack] = await db
      .update(userBidPacks)
      .set({ bidsRemaining })
      .where(eq(userBidPacks.id, id))
      .returning();
    
    const user = await this.getUser(updatedUserBidPack.userId);
    const bidPack = await this.getBidPack(updatedUserBidPack.bidPackId);
    
    return { ...updatedUserBidPack, user: user!, bidPack: bidPack! };
  }

  async getActivities(): Promise<Activity[]> {
    const allActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp));
    
    // Get all NFTs
    const nftIds = [...new Set(allActivities.map(activity => activity.nftId))];
    const allNfts = await Promise.all(nftIds.map(id => this.getNFT(id)));
    const nftsMap = new Map(allNfts.map(nft => [nft!.id, nft]));
    
    return allActivities.map(activity => ({
      ...activity,
      nft: nftsMap.get(activity.nftId)!
    }));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const now = new Date();
    const activityWithTimestamp = { ...insertActivity, timestamp: now };
    
    const [activity] = await db
      .insert(activities)
      .values(activityWithTimestamp)
      .returning();
    
    const nft = await this.getNFT(activity.nftId);
    
    return { ...activity, nft: nft! };
  }

  async getAuctionHistory(auctionId: number): Promise<AuctionHistory[]> {
    return db
      .select()
      .from(auctionHistories)
      .where(eq(auctionHistories.auctionId, auctionId))
      .orderBy(desc(auctionHistories.timestamp));
  }

  async createAuctionHistory(insertHistory: InsertAuctionHistory): Promise<AuctionHistory> {
    const now = new Date();
    const historyWithTimestamp = { ...insertHistory, timestamp: now };
    
    const [history] = await db
      .insert(auctionHistories)
      .values(historyWithTimestamp)
      .returning();
    
    return history;
  }

  async getBlockchainStats(): Promise<BlockchainStats> {
    const networks = await db.select().from(blockchainNetworks);
    const stats = await db.select().from(marketStats);
    
    return {
      networks,
      marketStats: stats
    };
  }
}

// Use MemStorage for development, DatabaseStorage for production when database is connected
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
