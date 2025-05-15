import { pgTable, text, serial, integer, boolean, jsonb, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  email: text("email"),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  email: true,
  avatar: true,
  bio: true,
});

// NFT schema
export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  tokenId: text("token_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  blockchain: text("blockchain").notNull(),
  tokenStandard: text("token_standard").notNull(),
  royalty: decimal("royalty", { precision: 5, scale: 2 }).default("0"),
  collection: text("collection"),
  collectionName: text("collection_name"), // Collection name display
  collectionImage: text("collection_image"), // Added for collection image
  
  // Price metrics
  floorPrice: decimal("floor_price", { precision: 10, scale: 6 }),
  floorPriceUsd: decimal("floor_price_usd", { precision: 10, scale: 2 }), // Added USD floor price for consistent display
  retailPrice: decimal("retail_price", { precision: 10, scale: 6 }), // Added retail price for discount calculation
  priceAvg: decimal("price_avg", { precision: 10, scale: 6 }), // Average price at which NFTs are sold
  priceCeiling: decimal("price_ceiling", { precision: 10, scale: 6 }), // Highest price at which an NFT in the collection was sold
  
  // Volume metrics
  volume24h: decimal("volume_24h", { precision: 10, scale: 6 }), // Added for 24h volume
  volumeChange: decimal("volume_change", { precision: 10, scale: 4 }), // Change in volume as percentage
  
  // Collection metrics
  marketcap: decimal("marketcap", { precision: 14, scale: 2 }), // Total market value of the collection
  marketcapChange: decimal("marketcap_change", { precision: 10, scale: 4 }), // Change in marketcap as percentage
  
  // Holder metrics
  holders: integer("holders"), // Number of traders currently holding NFTs
  holdersChange: decimal("holders_change", { precision: 10, scale: 4 }), // Change in holders as percentage
  holdersDiamondHands: integer("holders_diamond_hands"), // Number of diamond hands holders
  holdersWhales: integer("holders_whales"), // Number of whales holding NFTs from collection
  
  // Activity metrics
  sales: integer("sales"), // Number of NFTs sold
  salesChange: decimal("sales_change", { precision: 10, scale: 4 }), // Change in sales as percentage
  traders: integer("traders"), // Number of traders (buyer and/or seller)
  tradersChange: decimal("traders_change", { precision: 10, scale: 4 }), // Change in traders as percentage
  
  // Rarity metrics
  rarityScore: decimal("rarity_score", { precision: 10, scale: 2 }), // Rarity score (higher is more rare)
  rarityRank: integer("rarity_rank"), // Rarity rank within collection (lower is more rare)
  
  // Basic metadata
  currency: text("currency").default("ETH"),
  items: integer("items"),
  category: text("category").default("art"),
  creatorId: integer("creator_id").references(() => users.id),
  attributes: jsonb("attributes").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNftSchema = createInsertSchema(nfts).pick({
  name: true,
  description: true,
  imageUrl: true,
  tokenId: true,
  contractAddress: true,
  blockchain: true,
  tokenStandard: true,
  royalty: true,
  collection: true,
  collectionName: true,
  collectionImage: true,
  
  // Price metrics
  floorPrice: true,
  floorPriceUsd: true,
  retailPrice: true,
  priceAvg: true,
  priceCeiling: true,
  
  // Volume metrics
  volume24h: true,
  volumeChange: true,
  
  // Collection metrics
  marketcap: true,
  marketcapChange: true,
  
  // Holder metrics
  holders: true,
  holdersChange: true,
  holdersDiamondHands: true,
  holdersWhales: true,
  
  // Activity metrics
  sales: true,
  salesChange: true,
  traders: true,
  tradersChange: true,
  
  // Rarity metrics
  rarityScore: true,
  rarityRank: true,
  
  // Basic metadata
  currency: true,
  items: true,
  category: true,
  creatorId: true,
  attributes: true,
});

// Auction schema
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  nftId: integer("nft_id").notNull().references(() => nfts.id),
  startingBid: decimal("starting_bid", { precision: 10, scale: 6 }).notNull(),
  currentBid: decimal("current_bid", { precision: 10, scale: 6 }),
  currency: text("currency").notNull().default("ETH"),
  endTime: timestamp("end_time").notNull(),
  featured: boolean("featured").default(false),
  creatorId: integer("creator_id").references(() => users.id),
  bidCount: integer("bid_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  nftId: true,
  startingBid: true,
  currentBid: true,
  currency: true,
  endTime: true,
  featured: true,
  creatorId: true,
  bidCount: true,
});

// Bid schema
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  bidderId: integer("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 6 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBidSchema = createInsertSchema(bids).pick({
  auctionId: true,
  bidderId: true,
  amount: true,
});

// BidPack (Ordinals) schema
export const bidPacks = pgTable("bid_packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // starter, pro, premium, whale
  bidCount: integer("bid_count").notNull(),
  bonusBids: integer("bonus_bids").notNull(),
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 6 }).notNull(),
  currency: text("currency").notNull().default("BTC"),
  available: boolean("available").default(true),
});

export const insertBidPackSchema = createInsertSchema(bidPacks).pick({
  name: true,
  type: true,
  bidCount: true,
  bonusBids: true,
  price: true,
  originalPrice: true,
  currency: true,
  available: true,
});

// User bid pack purchases
export const userBidPacks = pgTable("user_bid_packs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bidPackId: integer("bid_pack_id").notNull().references(() => bidPacks.id),
  bidsRemaining: integer("bids_remaining").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
});

export const insertUserBidPackSchema = createInsertSchema(userBidPacks).pick({
  userId: true,
  bidPackId: true,
  bidsRemaining: true,
});

// Activity types
export const activityTypes = ["bid", "purchase", "listing", "bid-increase"] as const;
export type ActivityType = typeof activityTypes[number];

// Activity schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  nftId: integer("nft_id").notNull().references(() => nfts.id),
  from: text("from").notNull(),
  to: text("to").notNull(),
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  currency: text("currency").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  nftId: true,
  from: true,
  to: true,
  price: true,
  currency: true,
});

// Auction history event schema
export const auctionHistories = pgTable("auction_histories", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAuctionHistorySchema = createInsertSchema(auctionHistories).pick({
  auctionId: true,
  description: true,
  icon: true,
});

// BitCrunch API related schemas
export const blockchainNetworks = pgTable("blockchain_networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  change: text("change").notNull(),
  gradient: text("gradient").notNull(),
});

export const marketStats = pgTable("market_stats", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  change: text("change").notNull(),
});

// Convenience interfaces and types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NFT = typeof nfts.$inferSelect & {
  creator: User;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity: string;
  }>;
};
export type InsertNFT = z.infer<typeof insertNftSchema>;

export type BidPack = typeof bidPacks.$inferSelect;
export type InsertBidPack = z.infer<typeof insertBidPackSchema>;

export type UserBidPack = typeof userBidPacks.$inferSelect & {
  bidPack: BidPack;
  user: User;
};
export type InsertUserBidPack = z.infer<typeof insertUserBidPackSchema>;

export type Bid = typeof bids.$inferSelect & {
  bidder: User;
};
export type InsertBid = z.infer<typeof insertBidSchema>;

export type Activity = typeof activities.$inferSelect & {
  nft: NFT;
};
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type AuctionHistory = typeof auctionHistories.$inferSelect;
export type InsertAuctionHistory = z.infer<typeof insertAuctionHistorySchema>;

export type Auction = typeof auctions.$inferSelect & {
  nft: NFT;
  creator: User;
  bids: Bid[];
  history: AuctionHistory[];
};
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type BlockchainNetwork = typeof blockchainNetworks.$inferSelect;
export type MarketStat = typeof marketStats.$inferSelect;

export type BlockchainStats = {
  networks: BlockchainNetwork[];
  marketStats: MarketStat[];
};
