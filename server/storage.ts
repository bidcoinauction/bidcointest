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
  updateAuctionBid(id: number, currentBid: string, bidCount: number): Promise<Auction>;
  
  // Bid operations
  getBidsByAuction(auctionId: number): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  
  // BidPack operations
  getBidPack(id: number): Promise<BidPack | undefined>;
  getBidPacks(): Promise<BidPack[]>;
  createBidPack(bidPack: InsertBidPack): Promise<BidPack>;
  
  // UserBidPack operations
  getUserBidPacks(userId: number): Promise<UserBidPack[]>;
  createUserBidPack(userBidPack: InsertUserBidPack): Promise<UserBidPack>;
  updateUserBidPackCount(id: number, bidsRemaining: number): Promise<UserBidPack>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Auction History operations
  getAuctionHistory(auctionId: number): Promise<AuctionHistory[]>;
  createAuctionHistory(history: InsertAuctionHistory): Promise<AuctionHistory>;
  
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
      imageUrl: "/assets/nft_images/300.png",
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
      imageUrl: "/assets/nft_images/tnb.jpg",
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
      imageUrl: "/assets/nft_images/120.png",
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
      imageUrl: "/assets/nft_images/300.png",
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
      imageUrl: "/assets/nft_images/tnb.jpg",
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

  async updateAuctionBid(id: number, currentBid: string, bidCount: number): Promise<Auction> {
    const auction = this.auctions.get(id);
    if (!auction) {
      throw new Error(`Auction with ID ${id} not found`);
    }

    const updatedAuction = { ...auction, currentBid, bidCount };
    this.auctions.set(id, updatedAuction);

    return this.getAuction(id) as Promise<Auction>;
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

export const storage = new MemStorage();
