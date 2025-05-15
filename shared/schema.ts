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
  reservePrice: decimal("reserve_price", { precision: 10, scale: 6 }), // Optional minimum final price
  currency: text("currency").notNull().default("ETH"),
  
  // Penny auction mechanics
  bidIncrementAmount: decimal("bid_increment_amount", { precision: 10, scale: 6 }).default("0.03"), // Default: $0.03 per bid
  bidFee: decimal("bid_fee", { precision: 10, scale: 6 }).default("0.24"), // Default: $0.24 per bid
  timeExtension: integer("time_extension").default(60), // Default: 60 seconds (1 minute) extension per bid
  autoExtensionThreshold: integer("auto_extension_threshold").default(30), // Default: 30 seconds threshold
  
  // Auction state
  endTime: timestamp("end_time").notNull(),
  featured: boolean("featured").default(false),
  creatorId: integer("creator_id").references(() => users.id),
  bidCount: integer("bid_count").default(0),
  lastBidderId: integer("last_bidder_id").references(() => users.id), // Track last bidder
  status: text("status").default("active"), // active, ended, canceled, settled
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at"), // When auction was settled
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  nftId: true,
  startingBid: true,
  currentBid: true,
  reservePrice: true,
  currency: true,
  bidIncrementAmount: true,
  bidFee: true,
  timeExtension: true,
  autoExtensionThreshold: true,
  endTime: true,
  featured: true,
  creatorId: true,
  bidCount: true,
  status: true,
});

// Bid schema
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  bidderId: integer("bidder_id").notNull().references(() => users.id),
  
  // Bid details
  amount: decimal("amount", { precision: 10, scale: 6 }).notNull(), // Actual bid amount (current price + increment)
  bidFee: decimal("bid_fee", { precision: 10, scale: 6 }).notNull(), // Fee paid for this bid (usually $0.24)
  newPriceAfterBid: decimal("new_price_after_bid", { precision: 10, scale: 6 }).notNull(), // New auction price after this bid
  newEndTimeAfterBid: timestamp("new_end_time_after_bid"), // New auction end time after this bid (if extended)
  
  // Bid source
  userBidPackId: integer("user_bid_pack_id").references(() => userBidPacks.id), // Which bid pack was used
  bidPackRemainingAfter: integer("bid_pack_remaining_after"), // Bids remaining in pack after this bid
  
  // Tracking
  bidNumber: integer("bid_number").notNull(), // Which number bid this is in the auction (1st, 2nd, etc.)
  isAutoBid: boolean("is_auto_bid").default(false), // Whether this was placed by auto-bidder
  
  // Status
  status: text("status").default("valid"), // valid, invalid, refunded
  processed: boolean("processed").default(false), // Whether this bid was processed for blockchain recording
  transactionId: text("transaction_id"), // Blockchain transaction ID if recorded on-chain
  
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBidSchema = createInsertSchema(bids).pick({
  auctionId: true,
  bidderId: true,
  amount: true,
  bidFee: true,
  newPriceAfterBid: true,
  newEndTimeAfterBid: true,
  userBidPackId: true,
  bidPackRemainingAfter: true,
  bidNumber: true,
  isAutoBid: true,
  status: true,
});

// BidPack (Ordinals) schema
export const bidPacks = pgTable("bid_packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // starter, pro, premium, whale
  description: text("description"), // Optional description of bid pack
  
  // Bid counts
  bidCount: integer("bid_count").notNull(),
  bonusBids: integer("bonus_bids").notNull(),
  totalBids: integer("total_bids").notNull(), // Convenience field: bidCount + bonusBids
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 6 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }), // % discount if on sale
  pricePerBid: decimal("price_per_bid", { precision: 10, scale: 6 }).notNull(), // Price per bid (price / totalBids)
  savings: decimal("savings", { precision: 10, scale: 6 }), // $ savings vs buying individual bids
  
  // Payment options
  currency: text("currency").notNull().default("BTC"),
  acceptedPaymentMethods: jsonb("accepted_payment_methods").default(['ETH', 'BTC', 'SOL', 'USDC']),
  
  // Display
  imageUrl: text("image_url"), // Optional image for the bid pack
  color: text("color").default("#3498db"), // Color for styling
  featured: boolean("featured").default(false), // Whether to highlight this pack
  sortOrder: integer("sort_order").default(0), // Order to display packs (lower first)
  
  // Availability
  available: boolean("available").default(true),
  startDate: timestamp("start_date"), // When this pack becomes available (for limited time offers)
  endDate: timestamp("end_date"), // When this pack expires
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertBidPackSchema = createInsertSchema(bidPacks).pick({
  name: true,
  type: true,
  description: true,
  bidCount: true,
  bonusBids: true,
  totalBids: true,
  price: true,
  originalPrice: true,
  discountPercentage: true,
  pricePerBid: true,
  savings: true,
  currency: true,
  acceptedPaymentMethods: true,
  imageUrl: true,
  color: true,
  featured: true,
  sortOrder: true,
  available: true,
  startDate: true,
  endDate: true,
});

// User bid pack purchases
export const userBidPacks = pgTable("user_bid_packs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bidPackId: integer("bid_pack_id").notNull().references(() => bidPacks.id),
  
  // Bid counts
  bidsTotal: integer("bids_total").notNull(), // Total bids purchased
  bidsRemaining: integer("bids_remaining").notNull(), // Bids still available to use
  bidsUsed: integer("bids_used").default(0), // Bids already used
  
  // Purchase details
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 6 }).notNull(), // Actual price paid
  currency: text("currency").notNull().default("BTC"), // Currency used for payment
  paymentMethod: text("payment_method").notNull(), // ETH, BTC, SOL, USDC, etc.
  paymentTxId: text("payment_tx_id"), // Blockchain transaction ID for the payment
  
  // Purchase status
  status: text("status").default("active"), // active, expired, depleted
  autoRenew: boolean("auto_renew").default(false), // Whether to auto-renew when depleted
  
  // Dates
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiryDate: timestamp("expiry_date"), // Optional expiration date
  lastUsedDate: timestamp("last_used_date"), // Last time a bid was used
});

export const insertUserBidPackSchema = createInsertSchema(userBidPacks).pick({
  userId: true,
  bidPackId: true,
  bidsTotal: true,
  bidsRemaining: true,
  purchasePrice: true,
  currency: true,
  paymentMethod: true,
  paymentTxId: true,
  status: true,
  autoRenew: true,
  expiryDate: true,
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
