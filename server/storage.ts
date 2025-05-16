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
      name: "CryptoPunk #7804",
      description: "CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard. They have been featured in places like The New York Times, Christie's of London, Art|Basel Miami, and The PBS NewsHour.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/cryptopunk7804.png",
      tokenId: "7804",
      contractAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "0",
      collection: "CryptoPunks",
      currency: "ETH",
      category: "pfp",
      items: 10000,
      creatorId: user1.id,
      attributes: [
        { trait_type: "Type", value: "Alien", rarity: "0.09%" },
        { trait_type: "Accessory", value: "Cap Forward", rarity: "2.5%" },
        { trait_type: "Accessory", value: "Small Shades", rarity: "3.7%" },
        { trait_type: "Accessory", value: "Pipe", rarity: "3.2%" }
      ]
    });

    const nft2 = await this.createNFT({
      name: "Milady #7218",
      description: "Milady Maker is a collection of 10,000 randomly generated Milady NFTs on the Ethereum blockchain.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ.avif",
      tokenId: "7218",
      contractAddress: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "5.0",
      collection: "Milady Maker",
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
      name: "Lil Z's Adventure #245",
      description: "Lil Z's Adventure is an NFT collection launched in April 2024 with 8,097 unique characters on Ethereum.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/TVRjeE5UTXhNakE5TlE9PV8yNDU%3D.png",
      tokenId: "245",
      contractAddress: "0x2e175f748976cd5cdb98f12d1abc5d137d6c9379",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "5.0",
      collection: "Lil Z's Adventure",
      collectionName: "Lil Z's Adventure",
      currency: "ETH",
      category: "pfp",
      items: 8097,
      creatorId: user3.id,
      attributes: [
        { trait_type: "Background", value: "Vibrant Green", rarity: "8%" },
        { trait_type: "Character", value: "Lil Z Explorer", rarity: "4%" },
        { trait_type: "Accessory", value: "Adventure Backpack", rarity: "6%" },
        { trait_type: "Headwear", value: "Explorer Hat", rarity: "3%" }
      ]
    });

    const nft4 = await this.createNFT({
      name: "Azuki #9605",
      description: "Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden: a corner of the internet where artists, builders, and web3 enthusiasts meet to create a decentralized future.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/f661377cb772f318ba53d52ff45c8921.png",
      tokenId: "9605",
      contractAddress: "0xed5af388653567af2f388e6224dc7c4b3241c544",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "7.5",
      collection: "Azuki",
      collectionName: "Azuki",
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
      name: "BEEPLE: EVERYDAYS - Bulls Run",
      description: "BEEPLE: EVERYDAYS - THE 2020 COLLECTION is a collection of digital art pieces created by Beeple (Mike Winkelmann), one of the most famous digital artists in the NFT space.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/f661377cb772f318ba53d52ff45c8921.png",
      tokenId: "187",
      contractAddress: "0x6e5dc5405baefb8c0166bcc78d2692777f2cbffb",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "10.0",
      collection: "BEEPLE: EVERYDAYS",
      collectionName: "BEEPLE: EVERYDAYS",
      floorPrice: "15.99",
      floorPriceUsd: "34818.22",
      currency: "ETH",
      category: "art",
      items: 722,
      creatorId: user5.id,
      attributes: [
        { trait_type: "Style", value: "Digital illustration", rarity: "25%" },
        { trait_type: "Collection", value: "EVERYDAYS", rarity: "100%" },
        { trait_type: "Artist", value: "Beeple", rarity: "100%" },
        { trait_type: "Theme", value: "Financial", rarity: "12%" }
      ]
    });

    const nft6 = await this.createNFT({
      name: "Doodles #1234",
      description: "A community-driven collectible NFT project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ.avif",
      tokenId: "1234",
      contractAddress: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "5.0",
      collection: "Doodles",
      collectionName: "Doodles",
      currency: "ETH",
      category: "pfp",
      items: 9998,
      creatorId: user6.id,
      attributes: [
        { trait_type: "Background", value: "Blue Sky", rarity: "10%" },
        { trait_type: "Face", value: "Happy", rarity: "15%" },
        { trait_type: "Head", value: "Pink Hair", rarity: "7%" },
        { trait_type: "Body", value: "Blue Hoodie", rarity: "8%" }
      ]
    });

    const nft7 = await this.createNFT({
      name: "Mutant Ape Yacht Club #3652",
      description: "The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes that can only be created by exposing an existing Bored Ape to a vial of MUTANT SERUM or by minting a Mutant Ape in the public sale.",
      imageUrl: "https://bidcoinlanding.standard.us-east-1.oortstorages.com/ebebf8da2543032f469b1a436d848822.png",
      tokenId: "3652",
      contractAddress: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
      blockchain: "ETH",
      tokenStandard: "ERC-721",
      royalty: "7.5",
      collection: "Mutant Ape Yacht Club",
      collectionName: "Mutant Ape Yacht Club",
      currency: "ETH",
      category: "pfp",
      items: 19551,
      creatorId: user7.id,
      attributes: [
        { trait_type: "Fur", value: "Psychedelic Green", rarity: "1.7%" },
        { trait_type: "Background", value: "Army Green", rarity: "12.4%" },
        { trait_type: "Eyes", value: "Angry", rarity: "4.6%" },
        { trait_type: "Clothes", value: "Biker Vest", rarity: "3.8%" },
        { trait_type: "Mouth", value: "Bored", rarity: "23%" }
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
    // These packs provide Bidcoin which is the platform's internal bidding currency
    // Users purchase these with real cryptocurrency but can only place bids using Bidcoin
    // Each bid costs $0.24, and users can select quantity
    await this.createBidPack({
      name: "Single Bid",
      type: "single",
      bidCount: 1,
      bonusBids: 0,
      totalBids: 1,
      price: "0.24",
      originalPrice: "0.24",
      pricePerBid: "0.24",
      currency: "USD",
      available: true,
    });

    await this.createBidPack({
      name: "Starter Pack",
      type: "starter",
      bidCount: 60,
      bonusBids: 0,
      totalBids: 60,
      price: "12.00",
      originalPrice: "14.40",
      pricePerBid: "0.20",
      currency: "USD",
      available: true,
    });

    await this.createBidPack({
      name: "Pro Pack",
      type: "pro",
      bidCount: 155,
      bonusBids: 0,
      totalBids: 155,
      price: "30.00",
      originalPrice: "37.20",
      pricePerBid: "0.19",
      currency: "USD",
      available: true,
    });

    await this.createBidPack({
      name: "Premium Pack",
      type: "premium",
      bidCount: 325,
      bonusBids: 0,
      totalBids: 325,
      price: "60.00",
      originalPrice: "78.00",
      pricePerBid: "0.18",
      currency: "USD",
      available: true,
    });

    await this.createBidPack({
      name: "Whale Pack",
      type: "whale",
      bidCount: 650,
      bonusBids: 0,
      totalBids: 650,
      price: "120.00",
      originalPrice: "156.00",
      pricePerBid: "0.18",
      currency: "USD",
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
      
      // Step 2: Check auction status
      if (auction.status !== 'active') {
        return { success: false, error: `Auction is not active (status: ${auction.status})` };
      }
      
      // Step 3: Check if the auction is still active
      const now = new Date();
      if (new Date(auction.endTime) < now) {
        // Auto-update auction status if it's ended
        const auctionCopy = { ...auction, status: 'ended' };
        this.auctions.set(auctionId, auctionCopy);
        return { success: false, error: 'Auction has ended' };
      }
      
      // Step 4: Check if the user has Bidcoin bids available
      // All bids are made using Bidcoin (platform's internal currency)
      const userBidPackResult = await this.consumeBid(bidderId);
      if (!userBidPackResult.success) {
        return { 
          success: false, 
          error: userBidPackResult.error || 'Insufficient Bidcoin balance' 
        };
      }
      
      // Step 5: Calculate the new bid price using the auction's bidIncrementAmount
      const currentBid = Number(auction.currentBid || auction.startingBid);
      const bidIncrement = Number(auction.bidIncrementAmount || 0.03); // Default: $0.03 increment per bid
      const bidFee = Number(auction.bidFee || 0.24); // Default: $0.24 per bid
      
      // Get the NFT data for maximum price calculations
      const nft = await this.getNFT(auction.nftId);
      if (!nft) {
        return { success: false, error: 'NFT not found' };
      }
      
      // Calculate maximum auction price (70-90% discount from floor price)
      // Use floor price if available, otherwise fallback to retail price or a default
      const floorPrice = nft.floorPriceUsd 
        ? Number(nft.floorPriceUsd) 
        : (nft.floorPrice 
            ? Number(nft.floorPrice) 
            : (nft.retailPrice 
                ? Number(nft.retailPrice) 
                : 100.0));
      
      // 30% of floor price = 70% discount
      const maxPriceRatio = 0.3;
      const maxPrice = floorPrice * maxPriceRatio;
      
      // Reserve price check
      const reservePrice = auction.reservePrice ? Number(auction.reservePrice) : 0;
      
      // Calculate new bid amount, respecting max price and reserve price
      let newBidAmount: string;
      if (currentBid + bidIncrement >= maxPrice) {
        // If we would exceed max price threshold, cap it
        console.log(`Bid would exceed max price threshold. Capping at ${maxPrice}`);
        newBidAmount = maxPrice.toFixed(6);
      } else {
        // Normal case - increment by the standard amount (default $0.03)
        newBidAmount = (currentBid + bidIncrement).toFixed(6);
      }
      
      // Step 6: Calculate time extension based on auction settings
      // Use the timeExtension field from the auction (default: 60 seconds)
      const extensionSeconds = auction.timeExtension || 60;
      
      // Check if we're in the auto-extension threshold period
      const timeLeft = new Date(auction.endTime).getTime() - now.getTime();
      const thresholdMs = (auction.autoExtensionThreshold || 30) * 1000; // Default: 30 seconds threshold
      
      let newEndTime = new Date(auction.endTime);
      if (timeLeft <= thresholdMs) {
        // We're in the final countdown - extend by the full extension time
        newEndTime.setSeconds(newEndTime.getSeconds() + extensionSeconds);
      } else {
        // Not in the final countdown - just add a small extension
        const smallExtension = Math.floor(extensionSeconds / 4);
        newEndTime.setSeconds(newEndTime.getSeconds() + smallExtension);
      }
      
      // Step 7: Update the auction with new bid amount, end time, and increment bid count
      const updatedBidCount = (auction.bidCount || 0) + 1;
      
      // Update auction in one step
      const updatedAuctionData = { 
        ...auction, 
        currentBid: newBidAmount, 
        bidCount: updatedBidCount, 
        endTime: newEndTime,
        lastBidderId: bidderId
      };
      this.auctions.set(auctionId, updatedAuctionData);
      
      // Step 8: Create comprehensive bid record with all the new fields
      const bidNumber = updatedBidCount;
      const userBidPack = userBidPackResult.userBidPack;
      
      const bid = await this.createBid({
        auctionId,
        bidderId,
        amount: newBidAmount,
        bidFee: bidFee.toString(),
        newPriceAfterBid: newBidAmount,
        newEndTimeAfterBid: newEndTime,
        userBidPackId: userBidPack?.id,
        bidPackRemainingAfter: userBidPack?.bidsRemaining,
        bidNumber,
        isAutoBid: false,
        status: 'valid'
      });
      
      // Step 9: Record bid on blockchain (in a real implementation)
      const blockchainRecord = await this.recordBidOnBlockchain(bid.id);
      if (!blockchainRecord.success) {
        console.warn(`Failed to record bid on blockchain: ${blockchainRecord.error}`);
        // Continue anyway, we'll retry later
      } else if (blockchainRecord.transactionId) {
        // Update the bid with the transaction ID
        const updatedBid = { ...bid, transactionId: blockchainRecord.transactionId, processed: true };
        this.bids.set(bid.id, updatedBid);
      }
      
      // Step 10: Create auction history record
      const bidderName = (await this.getUser(bidderId))?.username || `User #${bidderId}`;
      await this.createAuctionHistory({
        auctionId,
        description: `${bidderName} placed bid #${bidNumber} of ${newBidAmount} ${auction.currency}`,
        icon: 'hammer'
      });
      
      // Step 11: Create activity record
      // Note: The activity shows the bid in the NFT's currency for display purposes,
      // but the actual bid was placed using Bidcoin (platform's internal currency)
      await this.createActivity({
        type: 'bid',
        nftId: auction.nftId,
        from: bidderName,
        to: 'Auction',
        price: newBidAmount,
        currency: auction.currency || 'ETH'  // Display currency is NFT's native currency
      });
      
      return {
        success: true,
        auction: updatedAuctionData,
        bid,
        userBidPack
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
    
    // Set default values for required fields if not provided
    const bidWithDefaults = {
      ...insertBid,
      
      // If bidFee is not provided, use default $0.24
      bidFee: insertBid.bidFee || "0.24",
      
      // If newPriceAfterBid not provided, use amount
      newPriceAfterBid: insertBid.newPriceAfterBid || insertBid.amount,
      
      // If bidNumber not provided, calculate based on auction
      bidNumber: insertBid.bidNumber || 1,
      
      // Set status to valid by default
      status: insertBid.status || "valid",
      
      // Add ID and timestamp
      id, 
      timestamp: now
    };
    
    // Store bid in memory
    this.bids.set(id, bidWithDefaults);

    // Get bidder for return value
    const bidder = await this.getUser(insertBid.bidderId);
    
    return { ...bidWithDefaults, bidder: bidder! };
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
  
  async consumeBid(userId: number): Promise<{
    success: boolean;
    userBidPack?: UserBidPack;
    error?: string;
  }> {
    try {
      // Get user bid packs with remaining bids
      const userBidPacks = await this.getUserBidPacks(userId);
      
      // First check active packs not expired and with remaining bids
      const now = new Date();
      const activePacks = userBidPacks
        .filter(pack => {
          // Check status is active
          if (pack.status !== 'active') return false;
          
          // Check not expired if expiry date exists
          if (pack.expiryDate && new Date(pack.expiryDate) < now) return false;
          
          // Check has bids remaining
          return pack.bidsRemaining > 0;
        })
        .sort((a, b) => {
          // Sort by:
          // 1. Expiring soonest first (if has expiry date)
          // 2. Oldest purchase date first (for packs without expiry)
          
          const aHasExpiry = !!a.expiryDate;
          const bHasExpiry = !!b.expiryDate;
          
          // If only one has expiry, prioritize it
          if (aHasExpiry && !bHasExpiry) return -1;
          if (!aHasExpiry && bHasExpiry) return 1;
          
          // If both have expiry, sort by soonest expiry
          if (aHasExpiry && bHasExpiry) {
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          }
          
          // Otherwise sort by purchase date
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        });
      
      if (activePacks.length === 0) {
        return {
          success: false,
          error: 'No active bids available. Purchase a bid pack to continue.'
        };
      }
      
      // Use the highest priority pack
      const packToUse = activePacks[0];
      const updatedBidsRemaining = packToUse.bidsRemaining - 1;
      const updatedBidsUsed = (packToUse.bidsUsed || 0) + 1;
      
      // Check if this will deplete the pack
      let status = packToUse.status;
      if (updatedBidsRemaining === 0) {
        status = 'depleted';
        
        // Check if auto-renew is enabled
        if (packToUse.autoRenew) {
          // In a real implementation, this would trigger a purchase
          console.log(`Auto-renew enabled for pack ${packToUse.id}. Processing renewal...`);
        }
      }
      
      // Update the user bid pack with new counts and last used date
      const updatedPackData = { 
        ...packToUse, 
        bidsRemaining: updatedBidsRemaining,
        bidsUsed: updatedBidsUsed,
        lastUsedDate: now,
        status
      };
      
      this.userBidPacks.set(packToUse.id, updatedPackData);
      
      return {
        success: true,
        userBidPack: updatedPackData
      };
    } catch (error) {
      console.error('Error consuming bid:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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
  
  // Blockchain Integration
  async recordBidOnBlockchain(bidId: number): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // In a real implementation, this would interact with a blockchain
      // For now, we'll mock the successful recording
      const bid = await this.getBid(bidId);
      if (!bid) {
        return { success: false, error: `Bid with id ${bidId} not found` };
      }
      
      // Simulate blockchain tx
      const transactionId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      console.log(`[Blockchain] Recorded bid ${bidId} with transaction ${transactionId}`);
      
      return {
        success: true,
        transactionId
      };
    } catch (error) {
      console.error('Error recording bid on blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error'
      };
    }
  }
  
  async verifyBidTransaction(transactionId: string): Promise<boolean> {
    // In a real implementation, this would verify the transaction on the blockchain
    // For now, we'll assume all transactions with our format are valid
    return transactionId.startsWith('tx_');
  }
  
  // Settlement Process
  async finalizeAuction(auctionId: number): Promise<{
    success: boolean;
    winner?: User;
    finalPrice?: string;
    error?: string;
  }> {
    try {
      const auction = await this.getAuction(auctionId);
      if (!auction) {
        return { success: false, error: `Auction with id ${auctionId} not found` };
      }
      
      // Check if auction is ended
      const now = new Date();
      if (new Date(auction.endTime) > now) {
        return { success: false, error: 'Auction has not ended yet' };
      }
      
      // Get all bids for this auction
      const bids = await this.getBidsByAuction(auctionId);
      if (bids.length === 0) {
        return { success: false, error: 'No bids found for this auction' };
      }
      
      // Sort bids by timestamp (most recent first)
      const sortedBids = [...bids].sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });
      
      // Get the winner (most recent bidder)
      const winningBid = sortedBids[0];
      const winner = await this.getUser(winningBid.bidderId);
      
      if (!winner) {
        return { success: false, error: 'Winner not found' };
      }
      
      // Create auction history record
      await this.createAuctionHistory({
        auctionId,
        description: `Auction finalized. Winner: ${winner.username} at ${auction.currentBid}`,
        icon: 'trophy'
      });
      
      // Create activity record
      await this.createActivity({
        type: 'purchase',
        nftId: auction.nftId,
        from: auction.creatorId?.toString() || 'system',
        to: winner.id.toString(),
        price: auction.currentBid || auction.startingBid,
        currency: auction.currency || 'ETH'
      });
      
      return {
        success: true,
        winner,
        finalPrice: auction.currentBid || auction.startingBid
      };
    } catch (error) {
      console.error('Error finalizing auction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  private async getBid(bidId: number): Promise<Bid | undefined> {
    const bid = this.bids.get(bidId);
    if (!bid) return undefined;
    
    const bidder = await this.getUser(bid.bidderId);
    if (!bidder) return undefined;
    
    return { ...bid, bidder };
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
