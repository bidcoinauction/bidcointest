var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path2 from "path";
import cors from "cors";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  achievements: () => achievements,
  activities: () => activities,
  activityTypes: () => activityTypes,
  auctionHistories: () => auctionHistories,
  auctions: () => auctions,
  bidPacks: () => bidPacks,
  bids: () => bids,
  blockchainNetworks: () => blockchainNetworks,
  insertAchievementSchema: () => insertAchievementSchema,
  insertActivitySchema: () => insertActivitySchema,
  insertAuctionHistorySchema: () => insertAuctionHistorySchema,
  insertAuctionSchema: () => insertAuctionSchema,
  insertBidPackSchema: () => insertBidPackSchema,
  insertBidSchema: () => insertBidSchema,
  insertNftSchema: () => insertNftSchema,
  insertUserAchievementSchema: () => insertUserAchievementSchema,
  insertUserBidPackSchema: () => insertUserBidPackSchema,
  insertUserSchema: () => insertUserSchema,
  marketStats: () => marketStats,
  nfts: () => nfts,
  userAchievements: () => userAchievements,
  userBidPacks: () => userBidPacks,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, jsonb, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  email: text("email"),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  email: true,
  avatar: true,
  bio: true
});
var nfts = pgTable("nfts", {
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
  collectionName: text("collection_name"),
  // Collection name display
  collectionImage: text("collection_image"),
  // Added for collection image
  // Price metrics
  priceAvg: decimal("price_avg", { precision: 10, scale: 6 }),
  // Average price at which NFTs are sold
  priceCeiling: decimal("price_ceiling", { precision: 10, scale: 6 }),
  // Highest price at which an NFT in the collection was sold
  // Volume metrics
  volume24h: decimal("volume_24h", { precision: 10, scale: 6 }),
  // Added for 24h volume
  volumeChange: decimal("volume_change", { precision: 10, scale: 4 }),
  // Change in volume as percentage
  // Collection metrics
  marketcap: decimal("marketcap", { precision: 14, scale: 2 }),
  // Total market value of the collection
  marketcapChange: decimal("marketcap_change", { precision: 10, scale: 4 }),
  // Change in marketcap as percentage
  // Holder metrics
  holders: integer("holders"),
  // Number of traders currently holding NFTs
  holdersChange: decimal("holders_change", { precision: 10, scale: 4 }),
  // Change in holders as percentage
  holdersDiamondHands: integer("holders_diamond_hands"),
  // Number of diamond hands holders
  holdersWhales: integer("holders_whales"),
  // Number of whales holding NFTs from collection
  // Activity metrics
  sales: integer("sales"),
  // Number of NFTs sold
  salesChange: decimal("sales_change", { precision: 10, scale: 4 }),
  // Change in sales as percentage
  traders: integer("traders"),
  // Number of traders (buyer and/or seller)
  tradersChange: decimal("traders_change", { precision: 10, scale: 4 }),
  // Change in traders as percentage
  // Rarity metrics
  rarityScore: decimal("rarity_score", { precision: 10, scale: 2 }),
  // Rarity score (higher is more rare)
  rarityRank: integer("rarity_rank"),
  // Rarity rank within collection (lower is more rare)
  // Basic metadata
  currency: text("currency").default("ETH"),
  items: integer("items"),
  category: text("category").default("art"),
  creatorId: integer("creator_id").references(() => users.id),
  attributes: jsonb("attributes").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow()
});
var insertNftSchema = createInsertSchema(nfts).pick({
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
  attributes: true
});
var auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  nftId: integer("nft_id").notNull().references(() => nfts.id),
  startingBid: decimal("starting_bid", { precision: 10, scale: 6 }).notNull(),
  currentBid: decimal("current_bid", { precision: 10, scale: 6 }),
  reservePrice: decimal("reserve_price", { precision: 10, scale: 6 }),
  // Optional minimum final price
  currency: text("currency").notNull().default("ETH"),
  // Penny auction mechanics
  bidIncrementAmount: decimal("bid_increment_amount", { precision: 10, scale: 6 }).default("0.03"),
  // Default: $0.03 per bid
  bidFee: decimal("bid_fee", { precision: 10, scale: 6 }).default("0.24"),
  // Default: $0.24 per bid
  timeExtension: integer("time_extension").default(60),
  // Default: 60 seconds (1 minute) extension per bid
  autoExtensionThreshold: integer("auto_extension_threshold").default(30),
  // Default: 30 seconds threshold
  // Auction state
  endTime: timestamp("end_time").notNull(),
  featured: boolean("featured").default(false),
  creatorId: integer("creator_id").references(() => users.id),
  bidCount: integer("bid_count").default(0),
  lastBidderId: integer("last_bidder_id").references(() => users.id),
  // Track last bidder
  status: text("status").default("active"),
  // active, ended, canceled, settled
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at")
  // When auction was settled
});
var insertAuctionSchema = createInsertSchema(auctions).pick({
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
  status: true
});
var bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  bidderId: integer("bidder_id").notNull().references(() => users.id),
  // Bid details
  amount: decimal("amount", { precision: 10, scale: 6 }).notNull(),
  // Actual bid amount (current price + increment)
  bidFee: decimal("bid_fee", { precision: 10, scale: 6 }).notNull(),
  // Fee paid for this bid (usually $0.24)
  newPriceAfterBid: decimal("new_price_after_bid", { precision: 10, scale: 6 }).notNull(),
  // New auction price after this bid
  newEndTimeAfterBid: timestamp("new_end_time_after_bid"),
  // New auction end time after this bid (if extended)
  // Bid source
  userBidPackId: integer("user_bid_pack_id").references(() => userBidPacks.id),
  // Which bid pack was used
  bidPackRemainingAfter: integer("bid_pack_remaining_after"),
  // Bids remaining in pack after this bid
  // Tracking
  bidNumber: integer("bid_number").notNull(),
  // Which number bid this is in the auction (1st, 2nd, etc.)
  isAutoBid: boolean("is_auto_bid").default(false),
  // Whether this was placed by auto-bidder
  // Status
  status: text("status").default("valid"),
  // valid, invalid, refunded
  processed: boolean("processed").default(false),
  // Whether this bid was processed for blockchain recording
  transactionId: text("transaction_id"),
  // Blockchain transaction ID if recorded on-chain
  timestamp: timestamp("timestamp").defaultNow()
});
var insertBidSchema = createInsertSchema(bids).pick({
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
  status: true
}).extend({
  // Make bidFee, newPriceAfterBid, and bidNumber optional in the schema
  // The implementation will provide default values
  bidFee: z.string().optional(),
  newPriceAfterBid: z.string().optional(),
  bidNumber: z.number().optional(),
  status: z.string().optional()
});
var bidPacks = pgTable("bid_packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // starter, pro, premium, whale
  description: text("description"),
  // Optional description of bid pack
  // Bid counts
  bidCount: integer("bid_count").notNull(),
  bonusBids: integer("bonus_bids").notNull(),
  totalBids: integer("total_bids").notNull(),
  // Convenience field: bidCount + bonusBids
  // Pricing
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 6 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  // % discount if on sale
  pricePerBid: decimal("price_per_bid", { precision: 10, scale: 6 }).notNull(),
  // Price per bid (price / totalBids)
  savings: decimal("savings", { precision: 10, scale: 6 }),
  // $ savings vs buying individual bids
  // Payment options
  currency: text("currency").notNull().default("BTC"),
  acceptedPaymentMethods: jsonb("accepted_payment_methods").default(["ETH", "BTC", "SOL", "USDC"]),
  // Display
  imageUrl: text("image_url"),
  // Optional image for the bid pack
  color: text("color").default("#3498db"),
  // Color for styling
  featured: boolean("featured").default(false),
  // Whether to highlight this pack
  sortOrder: integer("sort_order").default(0),
  // Order to display packs (lower first)
  // Availability
  available: boolean("available").default(true),
  startDate: timestamp("start_date"),
  // When this pack becomes available (for limited time offers)
  endDate: timestamp("end_date"),
  // When this pack expires
  // Tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});
var insertBidPackSchema = createInsertSchema(bidPacks).pick({
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
  endDate: true
});
var userBidPacks = pgTable("user_bid_packs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bidPackId: integer("bid_pack_id").notNull().references(() => bidPacks.id),
  // Bid counts
  bidsTotal: integer("bids_total").notNull(),
  // Total bids purchased
  bidsRemaining: integer("bids_remaining").notNull(),
  // Bids still available to use
  bidsUsed: integer("bids_used").default(0),
  // Bids already used
  // Purchase details
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 6 }).notNull(),
  // Actual price paid
  currency: text("currency").notNull().default("BTC"),
  // Currency used for payment
  paymentMethod: text("payment_method").notNull(),
  // ETH, BTC, SOL, USDC, etc.
  paymentTxId: text("payment_tx_id"),
  // Blockchain transaction ID for the payment
  // Purchase status
  status: text("status").default("active"),
  // active, expired, depleted
  autoRenew: boolean("auto_renew").default(false),
  // Whether to auto-renew when depleted
  // Dates
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  // Optional expiration date
  lastUsedDate: timestamp("last_used_date")
  // Last time a bid was used
});
var insertUserBidPackSchema = createInsertSchema(userBidPacks).pick({
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
  expiryDate: true
});
var activityTypes = ["bid", "purchase", "listing", "bid-increase"];
var activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  nftId: integer("nft_id").notNull().references(() => nfts.id),
  from: text("from").notNull(),
  to: text("to").notNull(),
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  currency: text("currency").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});
var insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  nftId: true,
  from: true,
  to: true,
  price: true,
  currency: true
});
var auctionHistories = pgTable("auction_histories", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});
var insertAuctionHistorySchema = createInsertSchema(auctionHistories).pick({
  auctionId: true,
  description: true,
  icon: true
});
var blockchainNetworks = pgTable("blockchain_networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  change: text("change").notNull(),
  gradient: text("gradient").notNull()
});
var marketStats = pgTable("market_stats", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  change: text("change").notNull()
});
var achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  // bid, auction, collection, social
  tier: text("tier").notNull().default("bronze"),
  // bronze, silver, gold, platinum
  points: integer("points").notNull(),
  icon: text("icon").notNull(),
  condition: jsonb("condition").notNull(),
  // JSON with condition details
  isSecret: boolean("is_secret").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  type: true,
  tier: true,
  points: true,
  icon: true,
  condition: true,
  isSecret: true
});
var userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
  completed: true,
  completedAt: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var mockBidPacks = [
  { id: 1, name: "Starter Pack", bidCount: 10, bonusBids: 0, price: "0.01", currency: "ETH", image: "/images/bidpack-starter.png" },
  { id: 2, name: "Pro Pack", bidCount: 50, bonusBids: 5, price: "0.04", currency: "ETH", image: "/images/bidpack-pro.png" },
  { id: 3, name: "Elite Pack", bidCount: 100, bonusBids: 15, price: "0.07", currency: "ETH", image: "/images/bidpack-elite.png" }
];
var mockAuctions = [
  {
    id: 1,
    title: "DEGEN TOONZ #4269",
    description: "DEGEN TOONZ Collection is the debut PFP collection from Degen Toonz, featuring a wide set of rare traits that make each NFT unique.",
    currentBid: "0.09",
    bidCount: 3,
    startTime: new Date(Date.now() - 864e5).toISOString(),
    endTime: new Date(Date.now() + 6e4).toISOString(),
    leader: "0x2345...6789",
    nft: {
      id: 4269,
      name: "DEGEN TOONZ #4269",
      image: "https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5vojLlrVRiCbV5jPQugpR-4FZ9RA-gV6-FwQDXu5gj-rV?auto=format&dpr=1&w=1000",
      contractAddress: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
      tokenId: "4269",
      blockchain: 1,
      collection: "DEGEN TOONZ",
      floor: "12435.67"
    }
  },
  {
    id: 2,
    title: "Milady #7218",
    description: "Milady Maker is a collection of 10,000 generative pfpNFTs.",
    currentBid: "0.03",
    bidCount: 1,
    startTime: new Date(Date.now() - 864e5).toISOString(),
    endTime: new Date(Date.now() + 57e3).toISOString(),
    leader: "0x9a8E...7FFe",
    nft: {
      id: 7218,
      name: "Milady #7218",
      image: "https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKQHqMc1kcXtfkhgqsLlmEbDnVwgGECIA?auto=format&dpr=1&w=1000",
      contractAddress: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
      tokenId: "7218",
      blockchain: 1,
      collection: "Milady",
      floor: "5129.75"
    }
  }
];
var mockActivity = [
  {
    id: 1,
    type: "bid",
    auctionId: 1,
    bidAmount: "34.0",
    currency: "SOL",
    bidderAddress: "0x3aF1...c5D8",
    bidderName: "@digitalsea",
    timestamp: new Date(Date.now() - 5 * 6e4).toISOString(),
    nft: {
      id: 7221,
      name: "Claynosaurz #7221",
      image: "https://i.seadn.io/gae/jsfhye5yrhOSusDCKXquKoMQbYs-B8Nm3V2B5fZB-Hee9g_-Lk-8ddsZNKr8vLaEet2HVZ1ZvYS-e4jXTOzXk4t1QiX6EHMqSYbH7PRm?auto=format&dpr=1&w=1000",
      ordinal: "7221"
    }
  },
  {
    id: 2,
    type: "purchase",
    auctionId: 2,
    bidAmount: "0.34",
    currency: "ETH",
    bidderAddress: "0x8cD5...a82B",
    sellerName: "@geometrymaster",
    timestamp: new Date(Date.now() - 5 * 6e4).toISOString(),
    nft: {
      id: 7218,
      name: "Milady #7218",
      image: "https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKQHqMc1kcXtfkhgqsLlmEbDnVwgGECIA?auto=format&dpr=1&w=1000",
      ordinal: "7218"
    }
  },
  {
    id: 3,
    type: "listing",
    auctionId: 1,
    bidAmount: "0.875",
    currency: "ETH",
    sellerAddress: "@CryptoMaestro",
    timestamp: new Date(Date.now() - 5 * 6e4).toISOString(),
    nft: {
      id: 4269,
      name: "DEGEN TOONZ #4269",
      image: "https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5vojLlrVRiCbV5jPQugpR-4FZ9RA-gV6-FwQDXu5gj-rV?auto=format&dpr=1&w=1000",
      ordinal: "4269"
    }
  }
];
var mockBlockchainStats = {
  totalTransactions: 1245,
  averageGasPrice: "25",
  blockHeight: 175e5,
  networkHashrate: "950 TH/s"
};
var storage = {
  getBidPacks: async () => {
    try {
      if (process.env.NODE_ENV === "development") {
        return mockBidPacks;
      }
      return await db.select().from(bidPacks);
    } catch (error) {
      console.error("Error fetching bid packs:", error);
      return [];
    }
  },
  getAuctions: async () => {
    try {
      if (process.env.NODE_ENV === "development") {
        return mockAuctions;
      }
      return await db.select().from(auctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      return [];
    }
  },
  getFeaturedAuctions: async () => {
    try {
      if (process.env.NODE_ENV === "development") {
        return mockAuctions.slice(0, 1);
      }
      return await db.select().from(auctions).limit(1);
    } catch (error) {
      console.error("Error fetching featured auctions:", error);
      return [];
    }
  },
  getAuction: async (id) => {
    try {
      if (process.env.NODE_ENV === "development") {
        return mockAuctions.find((a) => a.id === id) || null;
      }
      return await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);
    } catch (error) {
      console.error(`Error fetching auction ${id}:`, error);
      return null;
    }
  },
  getActivity: async () => {
    try {
      if (process.env.NODE_ENV === "development") {
        return mockActivity;
      }
      return await db.select().from(activities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      return [];
    }
  },
  getBlockchainStats: async () => {
    try {
      if (process.env.NODE_ENV === "development") {
        return mockBlockchainStats;
      }
      return mockBlockchainStats;
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      return mockBlockchainStats;
    }
  }
};

// server/unleashNftsService.ts
import axios from "axios";

// server/vite.ts
import express from "express";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1e3
    // Increase this value as needed
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/unleashNftsService.ts
var BASE_URL_V1 = "https://api.unleashnfts.com/v1";
var BASE_URL_V2 = "https://api.unleashnfts.com/v2";
var API_KEY = process.env.VITE_BITCRUNCH_API_KEY || "0c4b62cce16246d181310c3b57512529";
log(`Using UnleashNFTs API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`, "unleash-nfts");
var UnleashNftsService = class {
  headersV1;
  headersV2;
  constructor() {
    this.headersV1 = {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    };
    this.headersV2 = {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    };
    log(`UnleashNFTs Service initialized with API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`, "unleash-nfts");
  }
  /**
   * Get supported blockchains
   * @param page Page number (defaults to 1)
   * @param limit Items per page (defaults to 30)
   * @param sortBy Sort field (defaults to blockchain_name)
   */
  async getSupportedBlockchains(page = 1, limit = 30, sortBy = "blockchain_name") {
    try {
      const response = await axios.get(`${BASE_URL_V1}/blockchains`, {
        headers: this.headersV1,
        params: {
          sort_by: sortBy,
          offset: (page - 1) * limit,
          limit
        }
      });
      return response.data?.blockchains || [];
    } catch (error) {
      this.handleError("getSupportedBlockchains", error);
      return [];
    }
  }
  /**
   * Get collections by blockchain
   * @param chain The blockchain chain_id (1 for Ethereum, 137 for Polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   * @param metrics Type of metrics to include (volume, floor_price, etc.)
   * @param sortBy Field to sort by (volume, market_cap, etc.)
   */
  async getCollectionsByChain(chain, page = 1, limit = 10, metricsParam = "volume,market_cap,floor_price,holders,sales,traders,volume_change,market_cap_change,holders_change,sales_change,traders_change", sortBy = "volume_24h") {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching collections for chain ${chainId}...`, "unleash-nfts");
      const metrics = metricsParam.includes(",") ? metricsParam.split(",") : [metricsParam];
      const response = await axios.get(`${BASE_URL_V1}/collections`, {
        headers: this.headersV1,
        params: {
          blockchain: chainId,
          currency: "usd",
          metrics: metrics.join(","),
          sort_by: sortBy,
          sort_order: "desc",
          offset: (page - 1) * limit,
          limit,
          time_range: "24h",
          // Default to 24h, but we could make this configurable
          include_washtrade: true
        }
      });
      const collections = response.data?.collections || [];
      return collections.map((collection) => {
        if (collection.image_url) {
          collection.image_url = this.cleanImageUrl(collection.image_url);
        }
        return collection;
      });
    } catch (error) {
      this.handleError("getCollectionsByChain", error);
      return [];
    }
  }
  /**
   * Get collection metadata by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetadata(contractAddress, chain) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching metadata for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      log(`[unleash-nfts] Using v1 format: ${BASE_URL_V1}/collection/${chainId}/${contractAddress}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}`, {
        headers: this.headersV1
      });
      const collection = response.data;
      if (collection && collection.image_url) {
        collection.image_url = this.cleanImageUrl(collection.image_url);
      }
      return collection;
    } catch (error) {
      this.handleError("getCollectionMetadata", error);
      if (error.response) {
        log(`Request: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, "unleash-nfts");
        if (error.response.status === 404) {
          log(`Not found (404): Collection not found for contract address ${contractAddress}`, "unleash-nfts");
        } else if (error.response.status === 401) {
          log(`Unauthorized (401): API key may be invalid or missing.`, "unleash-nfts");
        }
      }
      return null;
    }
  }
  /**
   * Get collection metrics by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMetrics(contractAddress, chain) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching metrics for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/metrics`, {
        headers: this.headersV1,
        params: {
          currency: "usd",
          time_range: "24h"
        }
      });
      return response.data.metrics || null;
    } catch (error) {
      this.handleError("getCollectionMetrics", error);
      return null;
    }
  }
  /**
   * Get collection trend data by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param period The time period (24h, 7d, 30d, all)
   */
  async getCollectionTrend(contractAddress, chain, period = "30d") {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching trend data for collection ${contractAddress} on chain ${chainId} over ${period}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/trend`, {
        headers: this.headersV1,
        params: {
          currency: "usd",
          time_range: period,
          include_washtrade: true
        }
      });
      return response.data || null;
    } catch (error) {
      this.handleError("getCollectionTrend", error);
      return null;
    }
  }
  /**
   * Get collection traits by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionTraits(contractAddress, chain) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching traits for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/traits`, {
        headers: this.headersV1
      });
      return response.data.traits || [];
    } catch (error) {
      this.handleError("getCollectionTraits", error);
      return [];
    }
  }
  /**
   * Get NFTs in a collection by contract address
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionNFTs(contractAddress, chain, page = 1, limit = 10) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFTs for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/nfts`, {
        headers: this.headersV1,
        params: {
          offset: (page - 1) * limit,
          limit,
          sort_by: "token_id",
          sort_order: "asc"
        }
      });
      const nfts3 = response.data.nfts || [];
      return nfts3.map((nft) => {
        if (nft.image_url) {
          nft.image_url = this.cleanImageUrl(nft.image_url);
        }
        return nft;
      });
    } catch (error) {
      this.handleError("getCollectionNFTs", error);
      return [];
    }
  }
  /**
   * Sanitize NFT image URLs to avoid marketplace restrictions
   * This is a critical function to ensure NFT images load properly from various sources
   * @param url The original image URL
   * @returns Sanitized image URL that uses direct sources
   */
  cleanImageUrl(url) {
    if (!url) return "";
    if (url.startsWith("data:image")) {
      return url;
    }
    try {
      if (url.startsWith("ipfs://")) {
        const cid = url.replace("ipfs://", "");
        return `https://unleash.imgix.net/ipfs/${cid}`;
      }
      if (url.includes("/ipfs/")) {
        const cid = url.split("/ipfs/")[1];
        return `https://unleash.imgix.net/ipfs/${cid}`;
      }
      if (url.includes("magiceden") || url.includes("opensea")) {
        log(`Skipping restricted marketplace URL: ${url}`, "unleash-nfts");
        return "/placeholder-nft.png";
      }
      return url;
    } catch (e) {
      log(`Error cleaning image URL: ${e}`, "unleash-nfts");
      return url;
    }
  }
  /**
   * Get collection transactions
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionTransactions(contractAddress, chain, page = 1, limit = 10) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching transactions for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/collection/${chainId}/${contractAddress}/transactions`, {
        headers: this.headersV1,
        params: {
          offset: (page - 1) * limit,
          limit,
          sort_by: "timestamp",
          sort_order: "desc"
        }
      });
      return response.data.transactions || [];
    } catch (error) {
      this.handleError("getCollectionTransactions", error);
      return [];
    }
  }
  /**
   * Get collections with NFT valuation support
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getCollectionsWithValuation(chain, page = 1, limit = 10) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching collections with valuation on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/nft/valuation/collections`, {
        headers: this.headersV1,
        params: {
          blockchain: chainId,
          offset: (page - 1) * limit,
          limit
        }
      });
      const collections = response.data.collections || [];
      return collections.map((collection) => {
        if (collection.image_url) {
          collection.image_url = this.cleanImageUrl(collection.image_url);
        }
        return collection;
      });
    } catch (error) {
      this.handleError("getCollectionsWithValuation", error);
      return [];
    }
  }
  /**
   * Get NFTs with valuation
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   * @param page Page number
   * @param limit Items per page
   */
  async getNFTsWithValuation(contractAddress, chain, page = 1, limit = 10) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFTs with valuation for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V1}/nft/valuation/nfts`, {
        headers: this.headersV1,
        params: {
          blockchain: chainId,
          collection_address: contractAddress,
          offset: (page - 1) * limit,
          limit
        }
      });
      const nfts3 = response.data.nfts || [];
      return nfts3.map((nft) => {
        if (nft.image_url) {
          nft.image_url = this.cleanImageUrl(nft.image_url);
        }
        return nft;
      });
    } catch (error) {
      this.handleError("getNFTsWithValuation", error);
      return [];
    }
  }
  /**
   * Get NFT valuation by contract address and token ID
   * @param contractAddress The collection contract address
   * @param tokenId The NFT token ID
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTValuation(contractAddress, tokenId, chain) {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching valuation for NFT ${contractAddress}/${tokenId} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V2}/nft/valuation`, {
        headers: this.headersV2,
        params: {
          blockchain: chainId,
          collection_address: contractAddress,
          token_id: tokenId
        }
      });
      return response.data.valuation || null;
    } catch (error) {
      this.handleError("getNFTValuation", error);
      return null;
    }
  }
  /**
   * Get detailed NFT metadata by contract address and token ID
   * @param contractAddress The collection contract address
   * @param tokenId The NFT token ID
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTDetailedMetadata(contractAddress, tokenId, chain = "ethereum") {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching detailed NFT metadata for ${contractAddress}/${tokenId} on chain ${chainId}`, "unleash-nfts");
      try {
        const v1Url = `${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`;
        log(`[unleash-nfts] Using direct v1 path: ${v1Url}`, "unleash-nfts");
        const response = await axios.get(v1Url, { headers: this.headersV1 });
        const nftData = response.data;
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId} from v1 endpoint`, "unleash-nfts");
        }
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        log(`\u2705 Detailed metadata loaded from UnleashNFTs v1 API`, "unleash-nfts");
        return nftData;
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        log(`NFT metadata endpoint failed: ${errorMsg}`, "unleash-nfts");
        log(`API Error in getNFTDetailedMetadata: ${error.message}`, "unleash-nfts");
        log(`Request: GET ${error.config?.url}`, "unleash-nfts");
        if (error.response) {
          const status = error.response.status;
          const statusText = error.response.statusText;
          log(`Status: ${status} - ${statusText}`, "unleash-nfts");
          if (status === 404) {
            log(`Not found (404): The requested resource was not found. Check the contract address and token ID.`, "unleash-nfts");
          } else if (status === 401) {
            log(`Unauthorized (401): API key may be invalid or missing.`, "unleash-nfts");
          } else if (status === 429) {
            log(`Rate limited (429): Too many requests. Please wait and try again.`, "unleash-nfts");
          }
        }
        throw error;
      }
    } catch (error) {
      this.handleError("getNFTDetailedMetadata", error);
      return null;
    }
  }
  /**
   * Get NFT metadata by either contract address or slug name
   * @param options Configuration object
   * @param options.contractAddress The collection contract address
   * @param options.slugName The collection slug name
   * @param options.tokenId The NFT token ID
   * @param options.chain The blockchain name (ethereum, polygon, etc.)
   */
  async getNFTMetadataFlex({
    contractAddress,
    slugName,
    tokenId,
    chain = "ethereum"
  }) {
    try {
      if (!contractAddress && !slugName) {
        throw new Error("Either contractAddress or slugName must be provided for NFT metadata lookup");
      }
      const chainId = this.normalizeChainId(chain);
      log(`Fetching NFT metadata for token ${tokenId} on chain ${chainId}`, "unleash-nfts");
      const params = {
        blockchain: chainId,
        token_id: tokenId
      };
      if (contractAddress) {
        params.collection_address = contractAddress;
        log(`Using collection address: ${contractAddress}`, "unleash-nfts");
      }
      if (slugName) {
        params.collection_slug = slugName;
        log(`Using collection slug: ${slugName}`, "unleash-nfts");
      }
      try {
        let response;
        let nftData;
        if (contractAddress) {
          log(`[unleash-nfts] Using direct v1 path: ${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, "unleash-nfts");
          response = await axios.get(`${BASE_URL_V1}/nft/${chainId}/${contractAddress}/${tokenId}`, {
            headers: this.headersV1
          });
          nftData = response.data;
        } else {
          log(`[unleash-nfts] Using params with slug: ${BASE_URL_V1}/nft/metadata`, "unleash-nfts");
          response = await axios.get(`${BASE_URL_V1}/nft/metadata`, {
            headers: this.headersV1,
            params
          });
          nftData = response.data;
        }
        if (nftData && nftData.image_url) {
          nftData.image_url = this.cleanImageUrl(nftData.image_url);
          log(`Cleaned image URL for NFT ${tokenId}`, "unleash-nfts");
        }
        if (nftData && nftData.collection && nftData.collection.image_url) {
          nftData.collection.image_url = this.cleanImageUrl(nftData.collection.image_url);
        }
        return nftData;
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        log(`API Error in getNFTMetadataFlex: ${errorMsg}`, "unleash-nfts");
        if (error.response) {
          log(`Request: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, "unleash-nfts");
          if (error.response.status === 404) {
            log(`Not found (404): The requested resource was not found. Check the contract address and token ID.`, "unleash-nfts");
          } else if (error.response.status === 401) {
            log(`Unauthorized (401): API key may be invalid or missing.`, "unleash-nfts");
          } else {
            log(`Error status: ${error.response.status} ${error.response.statusText}`, "unleash-nfts");
            log(`Error details: ${JSON.stringify(error.response.data)}`, "unleash-nfts");
          }
        }
        throw error;
      }
    } catch (error) {
      this.handleError("getNFTMetadataFlex", error);
      return null;
    }
  }
  /**
   * Normalize blockchain chain ID to format expected by UnleashNFTs API
   * @param chain - Chain name (ethereum, polygon, etc.)
   * @returns Normalized chain ID (1 for ethereum, etc.)
   */
  normalizeChainId(chain) {
    const chainMap = {
      "ethereum": "1",
      "eth": "1",
      "polygon": "137",
      "matic": "137",
      "binance": "56",
      "bsc": "56",
      "avalanche": "43114",
      "avax": "43114",
      "arbitrum": "42161",
      "optimism": "10",
      "fantom": "250",
      "ftm": "250",
      "base": "8453",
      "solana": "900",
      // Added new chains from docs
      "gnosis": "100",
      "zksync": "324",
      "linea": "59144"
    };
    if (/^\d+$/.test(chain)) {
      return chain;
    }
    const normalizedChain = chainMap[chain.toLowerCase()];
    if (normalizedChain) {
      log(`Normalized chain '${chain}' to '${normalizedChain}'`, "unleash-nfts");
      return normalizedChain;
    }
    log(`Using original chain identifier: ${chain}`, "unleash-nfts");
    return chain;
  }
  /**
   * Handle API errors with detailed logging
   */
  handleError(method, error) {
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Unknown error";
    const status = error.response?.status;
    const requestUrl = error.config?.url || "unknown";
    const requestMethod = error.config?.method || "unknown";
    if (status === 401 || errorMessage.includes("API key")) {
      log(`UnleashNfts API AUTHENTICATION ERROR in ${method}: ${errorMessage}`, "unleash-nfts");
      log(`Please check that the VITE_BITCRUNCH_API_KEY environment variable contains a valid API key.`, "unleash-nfts");
      if (API_KEY) {
        const keyPreview = `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`;
        log(`Current API key begins with: ${keyPreview}`, "unleash-nfts");
      } else {
        log(`No API key found in environment variables.`, "unleash-nfts");
      }
      return;
    }
    if (status === 429) {
      log(`UnleashNFTs API RATE LIMIT ERROR in ${method}: Too many requests. Please wait before trying again.`, "unleash-nfts");
      return;
    }
    if (status === 403) {
      log(`Forbidden (403): Upgrade plan required for this endpoint`, "unleash-nfts");
      return;
    }
    if (status === 422) {
      log(`Validation Error (422): Check request parameters`, "unleash-nfts");
      return;
    }
    log(`API Error in ${method}: ${errorMessage}`, "unleash-nfts");
    log(`Request: ${requestMethod.toUpperCase()} ${requestUrl}`, "unleash-nfts");
    if (status) {
      if (status === 400) {
        log(`Bad request (400): The request was improperly formatted or contained invalid parameters.`, "unleash-nfts");
      } else if (status === 404) {
        log(`Not found (404): The requested resource was not found. Check the contract address and token ID.`, "unleash-nfts");
      } else if (status >= 500) {
        log(`Server error (${status}): The UnleashNFTs API server is experiencing issues. Try again later.`, "unleash-nfts");
      }
    }
  }
  /**
   * Get collections by blockchain with metrics and native currency
   * @param blockchain Blockchain ID (1 for Ethereum, 137 for Polygon, etc.)
   * @param metrics Array of metrics to include
   * @param sort_by Field to sort by
   * @param limit Number of collections to return
   */
  async getCollectionsByBlockchain(params) {
    try {
      const url = `${BASE_URL_V1}/collections`;
      const blockchainId = params.blockchain ? this.normalizeChainId(params.blockchain.toString()) : void 0;
      const defaultParams = {
        metrics: ["floor_price", "volume", "holders", "sales"],
        sort_by: "volume",
        sort_order: "desc",
        limit: 20,
        offset: 0,
        time_range: "24h",
        include_washtrade: true
      };
      const queryParams = { ...defaultParams };
      if (blockchainId) queryParams.blockchain = blockchainId;
      if (params.currency) queryParams.currency = params.currency;
      if (params.metrics) queryParams.metrics = params.metrics;
      if (params.sort_by) queryParams.sort_by = params.sort_by;
      if (params.limit) queryParams.limit = params.limit;
      if (params.offset) queryParams.offset = params.offset;
      if (params.time_range) queryParams.time_range = params.time_range;
      if (params.include_washtrade !== void 0) queryParams.include_washtrade = params.include_washtrade;
      if (params.category) queryParams.category = params.category;
      if (params.cursor) queryParams.cursor = params.cursor;
      log(`Fetching collections with params: ${JSON.stringify(queryParams)}`, "unleash-nfts");
      const response = await axios.get(url, {
        headers: this.headersV1,
        params: queryParams
      });
      log(`Successfully fetched collections for blockchain: ${blockchainId || "all blockchains"}`, "unleash-nfts");
      const currencySymbols = {
        "1": "ETH",
        // Ethereum
        "137": "MATIC",
        // Polygon
        "42161": "ETH",
        // Arbitrum
        "10": "ETH",
        // Optimism
        "56": "BNB",
        // Binance Smart Chain
        "43114": "AVAX",
        // Avalanche
        "8453": "ETH"
        // Base
        // Add more chains as needed
      };
      const currencySymbol = blockchainId ? currencySymbols[blockchainId] || "ETH" : "ETH";
      if (response.data?.collections) {
        response.data.collections = response.data.collections.map((collection) => {
          if (collection.image_url) {
            collection.image_url = this.cleanImageUrl(collection.image_url);
          }
          collection.currency_symbol = currencySymbol;
          if (collection.floor_price !== void 0) {
            const floorPrice = typeof collection.floor_price === "string" ? parseFloat(collection.floor_price) : collection.floor_price;
            collection.floor_price_native = floorPrice;
            if (response.data.price_info && response.data.price_info[currencySymbol.toLowerCase()]) {
              const exchangeRate = response.data.price_info[currencySymbol.toLowerCase()].usd;
              collection.floor_price_usd = floorPrice * exchangeRate;
            }
          }
          return collection;
        });
      }
      return response.data;
    } catch (error) {
      this.handleError("getCollectionsByBlockchain", error);
      return null;
    }
  }
  /**
   * Get collection mint feed (real-time data)
   * @param contractAddress The collection contract address
   * @param chain The blockchain name (ethereum, polygon, etc.)
   */
  async getCollectionMintFeed(contractAddress, chain = "ethereum") {
    try {
      const chainId = this.normalizeChainId(chain);
      log(`Fetching mint feed for collection ${contractAddress} on chain ${chainId}`, "unleash-nfts");
      const response = await axios.get(`${BASE_URL_V2}/mint-feed/${chainId}/${contractAddress}`, {
        headers: this.headersV2
      });
      return response.data || null;
    } catch (error) {
      this.handleError("getCollectionMintFeed", error);
      return null;
    }
  }
};
var unleashNftsService = new UnleashNftsService();

// server/alchemyNftService.ts
import axios2 from "axios";
import { Network, Alchemy } from "alchemy-sdk";
var API_KEY2 = process.env.ALCHEMY_API_KEY || "p-kWjyqsAvVDoVAFV7Kqhie5XlEFGA4v";
var BASE_URL = `https://eth-mainnet.g.alchemy.com/nft/v3/${API_KEY2}`;
var settings = {
  apiKey: API_KEY2,
  network: Network.ETH_MAINNET
};
var NFTMetadataCache = class {
  cache = /* @__PURE__ */ new Map();
  defaultTTL = 18e5;
  // 30 minutes in milliseconds
  // Get a value from cache
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  // Set a value in cache with optional TTL
  set(key, value, ttl = this.defaultTTL) {
    const now = Date.now();
    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt: now + ttl
    });
  }
  // Clear the entire cache
  clear() {
    this.cache.clear();
  }
  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
};
var nftCache = new NFTMetadataCache();
var AlchemyNftService = class {
  headers;
  alchemy;
  constructor() {
    this.headers = {
      "accept": "application/json"
    };
    this.alchemy = new Alchemy(settings);
    log(`Alchemy NFT Service initialized with API key: ${API_KEY2.substring(0, 4)}...${API_KEY2.substring(API_KEY2.length - 4)}`, "alchemy-nft");
  }
  /**
   * Get NFT metadata by contract address and token ID
   * @param contractAddress The NFT contract address
   * @param tokenId The NFT token ID
   */
  async getNFTMetadata(contractAddress, tokenId) {
    try {
      const cacheKey = `nft:${contractAddress.toLowerCase()}:${tokenId}`;
      const cachedData = nftCache.get(cacheKey);
      if (cachedData) {
        log(`Using cached NFT metadata for ${contractAddress}:${tokenId}`, "alchemy-nft");
        return cachedData;
      }
      log(`Fetching NFT metadata for ${contractAddress}:${tokenId}`, "alchemy-nft");
      const response = await this.alchemy.nft.getNftMetadata(
        contractAddress,
        tokenId,
        { refreshCache: false }
      );
      if (response) {
        nftCache.set(cacheKey, response);
      }
      return response;
    } catch (error) {
      this.handleError("getNFTMetadata", error);
      return null;
    }
  }
  /**
   * Get NFTs for a specific owner address
   * @param ownerAddress The owner's Ethereum address
   * @param pageKey Optional page key for pagination
   * @param pageSize Number of results per page (default 100, max 100)
   */
  async getNFTsForOwner(ownerAddress, pageKey, pageSize = 100) {
    try {
      const cacheKey = `owner:${ownerAddress.toLowerCase()}:page:${pageKey || "first"}:size:${pageSize}`;
      const cachedData = nftCache.get(cacheKey);
      if (cachedData) {
        log(`Using cached NFTs for owner ${ownerAddress}`, "alchemy-nft");
        return cachedData;
      }
      log(`Fetching NFTs for owner ${ownerAddress}`, "alchemy-nft");
      const options = {
        pageSize,
        omitMetadata: false
      };
      if (pageKey) {
        options.pageKey = pageKey;
      }
      const response = await this.alchemy.nft.getNftsForOwner(
        ownerAddress,
        options
      );
      if (response) {
        nftCache.set(cacheKey, response);
      }
      return response;
    } catch (error) {
      this.handleError("getNFTsForOwner", error);
      return null;
    }
  }
  /**
   * Get all NFTs for a contract with metadata
   * @param contractAddress The NFT contract address
   * @param pageKey Optional page key for pagination
   * @param pageSize Number of results per page (default 100, max 100)
   */
  async getNFTsForContract(contractAddress, pageKey, pageSize = 100) {
    try {
      const cacheKey = `contract:${contractAddress.toLowerCase()}:page:${pageKey || "first"}:size:${pageSize}`;
      const cachedData = nftCache.get(cacheKey);
      if (cachedData) {
        log(`Using cached NFTs for contract ${contractAddress}`, "alchemy-nft");
        return cachedData;
      }
      log(`Fetching NFTs for contract ${contractAddress}`, "alchemy-nft");
      const options = {
        pageSize,
        omitMetadata: false
      };
      if (pageKey) {
        options.pageKey = pageKey;
      }
      const response = await this.alchemy.nft.getNftsForContract(
        contractAddress,
        options
      );
      if (response) {
        nftCache.set(cacheKey, response);
      }
      return response;
    } catch (error) {
      this.handleError("getNFTsForContract", error);
      return null;
    }
  }
  /**
   * Get collection metadata
   * @param contractAddress The collection contract address
   */
  async getContractMetadata(contractAddress) {
    try {
      const cacheKey = `collection:${contractAddress.toLowerCase()}`;
      const cachedData = nftCache.get(cacheKey);
      if (cachedData) {
        log(`Using cached collection metadata for ${contractAddress}`, "alchemy-nft");
        return cachedData;
      }
      log(`Fetching collection metadata for ${contractAddress}`, "alchemy-nft");
      const response = await this.alchemy.nft.getContractMetadata(
        contractAddress
      );
      if (response) {
        nftCache.set(cacheKey, response, 72e5);
      }
      return response;
    } catch (error) {
      this.handleError("getContractMetadata", error);
      return null;
    }
  }
  /**
   * Converts Alchemy data format to our internal NFT metadata format
   * @param alchemyData Alchemy API response data
   */
  formatNFTMetadata(alchemyData) {
    if (!alchemyData) return null;
    const traits = alchemyData.rawMetadata?.attributes?.map((attr) => ({
      trait_type: attr.trait_type,
      value: attr.value,
      rarity: attr.rarity || Math.floor(Math.random() * 100) / 10
      // Use provided rarity or calculate one
    })) || [];
    const name = alchemyData.title || alchemyData.name || alchemyData.rawMetadata?.name || alchemyData.metadata?.name || `NFT #${alchemyData.tokenId}`;
    const description = alchemyData.description || alchemyData.rawMetadata?.description || alchemyData.metadata?.description || "";
    const imageUrl = alchemyData.rawMetadata?.image || (alchemyData.media && alchemyData.media.length > 0 ? alchemyData.media[0].gateway : "") || "";
    const collectionName = alchemyData.contract?.name || "";
    const tokenType = alchemyData.tokenType || "ERC721";
    let currency = "ETH";
    let floor_price = 0;
    let floor_price_usd = 0;
    if (alchemyData.contract?.openSea?.floorPrice) {
      floor_price = alchemyData.contract.openSea.floorPrice;
      floor_price_usd = floor_price * 3e3;
    }
    return {
      collection_name: collectionName,
      contract_address: alchemyData.contract?.address,
      token_id: alchemyData.tokenId,
      name,
      description,
      image_url: imageUrl,
      token_type: tokenType,
      floor_price,
      floor_price_usd,
      currency,
      traits
    };
  }
  /**
   * Get trending collections
   * @param limit Number of collections to return
   */
  async getTrendingCollections(limit = 10) {
    try {
      const cacheKey = `trending:collections:limit:${limit}`;
      const cachedData = nftCache.get(cacheKey);
      if (cachedData) {
        log(`Using cached trending collections data`, "alchemy-nft");
        return cachedData;
      }
      log(`Fetching trending collections with limit ${limit}`, "alchemy-nft");
      const response = await axios2.get("https://eth-mainnet.g.alchemy.com/nft/v2/", {
        headers: this.headers,
        params: {
          apiKey: API_KEY2,
          category: "all",
          limit
        }
      });
      if (!response.data || !Array.isArray(response.data.collections)) {
        return [];
      }
      const formattedCollections = response.data.collections.map((collection) => ({
        name: collection.name,
        contract_address: collection.contract_address,
        description: collection.description,
        image_url: collection.image_url,
        floor_price: collection.floor_price,
        floor_price_usd: collection.floor_price * 3e3,
        // Rough conversion
        currency: "ETH",
        token_schema: "ERC-721",
        chain: "ethereum",
        volume_24h: collection.volume || 0,
        items_count: collection.total_supply || 0
      }));
      nftCache.set(cacheKey, formattedCollections, 36e5);
      return formattedCollections;
    } catch (error) {
      this.handleError("getTrendingCollections", error);
      return [];
    }
  }
  /**
   * Get collection floor price
   * @param contractAddress The collection contract address
   * @param marketplace Marketplace to get floor price from (default: all)
   */
  async getCollectionFloorPrice(contractAddress, marketplace = "all") {
    try {
      log(`Fetching floor price for collection ${contractAddress}`, "alchemy-nft");
      const metadata = await this.getContractMetadata(contractAddress);
      if (metadata && metadata.openSea && metadata.openSea.floorPrice) {
        return {
          floor_price: metadata.openSea.floorPrice,
          floor_price_usd: metadata.openSea.floorPrice * 3e3,
          // Rough conversion
          currency: "ETH",
          marketplace: "opensea"
        };
      }
      return {
        floor_price: 0,
        floor_price_usd: 0,
        currency: "ETH",
        marketplace: "unknown"
      };
    } catch (error) {
      this.handleError("getCollectionFloorPrice", error);
      return null;
    }
  }
  /**
   * Handle API errors with detailed logging
   */
  handleError(method, error) {
    const errorResponse = error.response;
    const status = errorResponse?.status;
    const data = errorResponse?.data;
    log(`Alchemy API Error in ${method}: ${error.message}`, "alchemy-nft");
    if (errorResponse) {
      log(`Status: ${status}`, "alchemy-nft");
      log(`Response: ${JSON.stringify(data)}`, "alchemy-nft");
    }
  }
};
var alchemyNftService = new AlchemyNftService();

// server/moralisService.ts
var MoralisService = class {
  // Get NFTs for a specific owner address
  async getWalletNFTs(address, chain = "eth") {
    console.log("[moralis] Using Alchemy instead of Moralis for wallet NFTs");
    const alchemyResponse = await alchemyNftService.getNFTsForOwner(address);
    return (alchemyResponse?.ownedNfts || []).map((nft) => ({
      tokenId: nft.tokenId,
      tokenAddress: nft.contract.address,
      tokenUri: nft.tokenUri?.raw || "",
      metadata: nft.metadata || {
        name: nft.title || nft.name || "",
        description: nft.description || "",
        image: nft.media?.[0]?.gateway || "",
        attributes: nft.metadata?.attributes || []
      },
      name: nft.title || nft.name || "",
      symbol: nft.contract.symbol || "",
      contractType: nft.tokenType || "ERC721",
      ownerOf: address
    }));
  }
  // Get NFT metadata by contract address and token ID
  async getNFTMetadata(address, tokenId, chain = "eth") {
    console.log("[moralis] Using Alchemy instead of Moralis for NFT metadata");
    return alchemyNftService.getNFTMetadata(address, tokenId);
  }
  // Get owner of NFT
  async getNFTOwner(address, tokenId, chain = "eth") {
    console.log("[moralis] Using Alchemy instead of Moralis for NFT owner");
    return { owner: null };
  }
};
var moralisService = new MoralisService();

// server/routes.ts
import { EvmChain } from "@moralisweb3/common-evm-utils";
function setupRoutes(app2) {
  app2.get("/api/auctions/featured", async (req, res) => {
    try {
      const featuredAuctions = await storage.getFeaturedAuctions();
      res.json(featuredAuctions);
    } catch (error) {
      console.error("Error fetching featured auctions:", error);
      res.status(500).json({ error: "Failed to fetch featured auctions" });
    }
  });
  app2.get("/api/auctions", async (req, res) => {
    try {
      const auctions2 = await storage.getAuctions();
      res.json(auctions2);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      res.status(500).json({ error: "Failed to fetch auctions" });
    }
  });
  app2.get("/api/auctions/:id", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      res.json(auction);
    } catch (error) {
      console.error(`Error fetching auction ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch auction" });
    }
  });
  app2.get("/api/bidpacks", async (req, res) => {
    try {
      const bidPacks2 = await storage.getBidPacks();
      res.json(bidPacks2);
    } catch (error) {
      console.error("Error fetching bid packs:", error);
      res.status(500).json({ error: "Failed to fetch bid packs" });
    }
  });
  app2.get("/api/activity", async (req, res) => {
    try {
      const activity = await storage.getActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });
  app2.get("/api/blockchain/stats", async (req, res) => {
    try {
      const stats = await storage.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      res.status(500).json({ error: "Failed to fetch blockchain stats" });
    }
  });
  app2.get("/api/nft/blockchains", async (req, res) => {
    try {
      const blockchains = await unleashNftsService.getSupportedBlockchains();
      res.json(blockchains);
    } catch (error) {
      console.error("Error fetching supported blockchains:", error);
      res.status(500).json({ error: "Failed to fetch supported blockchains" });
    }
  });
  app2.get("/api/nft/collections/:chain", async (req, res) => {
    try {
      const { chain } = req.params;
      const { page = "1", limit = "10", metrics, sortBy } = req.query;
      const collections = await unleashNftsService.getCollectionsByChain(
        chain,
        parseInt(page),
        parseInt(limit),
        metrics,
        sortBy
      );
      res.json(collections);
    } catch (error) {
      console.error(`Error fetching collections for chain ${req.params.chain}:`, error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });
  app2.get("/api/nft/collection/:chain/:address", async (req, res) => {
    try {
      const { chain, address } = req.params;
      const collection = await unleashNftsService.getCollectionMetadata(address, chain);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error(`Error fetching collection ${req.params.address}:`, error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });
  app2.get("/api/nft/collection/:chain/:address/nfts", async (req, res) => {
    try {
      const { chain, address } = req.params;
      const { page = "1", limit = "10" } = req.query;
      const nfts3 = await unleashNftsService.getCollectionNFTs(
        address,
        chain,
        parseInt(page),
        parseInt(limit)
      );
      res.json(nfts3);
    } catch (error) {
      console.error(`Error fetching NFTs for collection ${req.params.address}:`, error);
      res.status(500).json({ error: "Failed to fetch NFTs" });
    }
  });
  app2.get("/api/nft/:chain/:address/:tokenId", async (req, res) => {
    try {
      const { chain, address, tokenId } = req.params;
      const nft = await unleashNftsService.getNFTDetailedMetadata(address, tokenId, chain);
      if (!nft) {
        return res.status(404).json({ error: "NFT not found" });
      }
      res.json(nft);
    } catch (error) {
      console.error(`Error fetching NFT ${req.params.address}/${req.params.tokenId}:`, error);
      res.status(500).json({ error: "Failed to fetch NFT" });
    }
  });
  app2.get("/api/nft/:chain/:address/:tokenId/valuation", async (req, res) => {
    try {
      const { chain, address, tokenId } = req.params;
      const valuation = await unleashNftsService.getNFTValuation(address, tokenId, chain);
      if (!valuation) {
        return res.status(404).json({ error: "NFT valuation not found" });
      }
      res.json(valuation);
    } catch (error) {
      console.error(`Error fetching NFT valuation ${req.params.address}/${req.params.tokenId}:`, error);
      res.status(500).json({ error: "Failed to fetch NFT valuation" });
    }
  });
  app2.post("/api/nft/import", async (req, res) => {
    try {
      const { tokenAddress, tokenId, chain = "ethereum", creatorId = 1 } = req.body;
      if (!tokenAddress || !tokenId) {
        return res.status(400).json({ message: "Token address and token ID are required" });
      }
      const nftData = await moralisService.getNFTMetadata(tokenAddress, tokenId, chain);
      if (!nftData) {
        return res.status(404).json({ message: "NFT not found" });
      }
      const appNftData = {
        name: nftData.name || nftData.title || `NFT #${tokenId}`,
        description: nftData.description || "",
        imageUrl: nftData.image_url || nftData.image || "",
        tokenId,
        contractAddress: tokenAddress,
        blockchain: chain,
        tokenStandard: nftData.contract_type || "ERC721",
        royalty: "0",
        collection: "",
        floorPrice: "0",
        currency: chain === "ethereum" ? "ETH" : chain === "polygon" ? "MATIC" : "USD",
        category: "collectible",
        creatorId,
        attributes: nftData.attributes || []
      };
      try {
        const unleashData = await unleashNftsService.getNFTValuation(
          tokenAddress,
          tokenId,
          chain
        );
        if (unleashData) {
          if (unleashData.estimated_price) {
            appNftData.floorPrice = unleashData.estimated_price.toString();
          }
          const collectionData = await unleashNftsService.getCollectionMetadata(
            tokenAddress,
            chain
          );
          if (collectionData) {
            if (collectionData.name) {
              appNftData.collection = collectionData.name;
            }
            if (collectionData.description && (!appNftData.description || appNftData.description === "")) {
              appNftData.description = collectionData.description;
            }
          }
        }
      } catch (unleashError) {
        console.error("Error enriching NFT with UnleashNFTs data:", unleashError);
      }
      const nft = appNftData;
      if (typeof broadcastUpdate === "function") {
        broadcastUpdate("nft-imported", { nft });
      }
      return res.status(201).json(nft);
    } catch (error) {
      console.error("Error importing NFT:", error);
      return res.status(500).json({ message: "Failed to import NFT" });
    }
  });
  app2.post("/api/wallet/:walletAddress/import", async (req, res) => {
    const { walletAddress } = req.params;
    try {
      const { limit = 5, creatorId = 1, chain = "ethereum" } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      let moralisChain;
      if (chain === "polygon") {
        moralisChain = EvmChain.POLYGON.toString();
      } else if (chain === "bsc") {
        moralisChain = EvmChain.BSC.toString();
      } else if (chain === "avalanche") {
        moralisChain = EvmChain.AVALANCHE.toString();
      } else {
        moralisChain = EvmChain.ETHEREUM.toString();
      }
      const nfts3 = await moralisService.getWalletNFTs(walletAddress, moralisChain);
      if (!nfts3 || nfts3.length === 0) {
        return res.status(404).json({ message: "No NFTs found in this wallet" });
      }
      const limitedNfts = nfts3.slice(0, limit);
      const importedNFTs = [];
      for (const nft of limitedNfts) {
        const appNftData = {
          name: nft.name || `NFT #${nft.tokenId}`,
          description: nft.metadata?.description || "",
          imageUrl: nft.metadata?.image || "",
          tokenId: nft.tokenId,
          contractAddress: nft.tokenAddress,
          blockchain: chain,
          tokenStandard: nft.contractType || "ERC721",
          royalty: "0",
          collection: "",
          floorPrice: "0",
          currency: chain === "ethereum" ? "ETH" : chain === "polygon" ? "MATIC" : "USD",
          category: "collectible",
          creatorId,
          attributes: nft.metadata?.attributes || []
        };
        try {
          if (nft.tokenAddress) {
            const collectionData = await unleashNftsService.getCollectionMetadata(
              nft.tokenAddress,
              chain
            );
            if (collectionData) {
              if (collectionData.name) {
                appNftData.collection = collectionData.name;
              }
              if (collectionData.description && (!appNftData.description || appNftData.description === "")) {
                appNftData.description = collectionData.description;
              }
              if (collectionData.floor_price) {
                appNftData.floorPrice = collectionData.floor_price.toString();
              }
              const collectionMetrics = await unleashNftsService.getCollectionMetrics(
                nft.tokenAddress,
                chain
              );
              if (collectionMetrics && collectionMetrics.floor_price) {
                appNftData.floorPrice = collectionMetrics.floor_price.toString();
              }
            }
            if (nft.tokenId) {
              const nftValuation = await unleashNftsService.getNFTValuation(
                nft.tokenAddress,
                nft.tokenId,
                chain
              );
              if (nftValuation && nftValuation.estimated_price) {
                appNftData.floorPrice = nftValuation.estimated_price.toString();
              }
              const collectionNFTs = await unleashNftsService.getCollectionNFTs(
                nft.tokenAddress,
                chain
              );
              const specificNFT = collectionNFTs.find((n) => n.token_id === nft.tokenId);
              if (specificNFT) {
                if (specificNFT.description && specificNFT.description.length > appNftData.description.length) {
                  appNftData.description = specificNFT.description;
                }
                if (specificNFT.traits && specificNFT.traits.length > 0) {
                  const unleashAttributes = specificNFT.traits.map((trait) => ({
                    trait_type: trait.trait_type,
                    value: trait.value,
                    rarity: trait.rarity || null
                  }));
                  const existingAttributes = Array.isArray(appNftData.attributes) ? appNftData.attributes : [];
                  appNftData.attributes = [...existingAttributes, ...unleashAttributes];
                }
              }
            }
          }
        } catch (unleashError) {
          console.error("Error enriching NFT with UnleashNFTs data:", unleashError);
        }
        importedNFTs.push(appNftData);
      }
      broadcastUpdate("wallet-nfts-imported", {
        count: importedNFTs.length,
        wallet: walletAddress
      });
      return res.status(201).json(importedNFTs);
    } catch (error) {
      console.error("Error importing NFTs from wallet:", error);
      return res.status(500).json({ message: "Failed to import NFTs from wallet" });
    }
  });
  app2.get("*", (req, res) => {
    res.sendFile("index.html", { root: "./client/dist" });
  });
}
function broadcastUpdate(type, data) {
  console.log(`Broadcasting ${type} update:`, data);
}

// server/index.ts
var app = express2();
var server = createServer(app);
var wss = new WebSocketServer({ server });
app.use(cors());
app.use(express2.json());
app.use(express2.static(path2.join(__dirname, "../client/dist")));
setupRoutes(app);
wss.on("connection", (ws2) => {
  console.log("Client connected");
  ws2.on("message", (message) => {
    console.log("Received message:", message);
  });
  ws2.on("close", () => {
    console.log("Client disconnected");
  });
});
var PORT = process.env.PORT || 3e3;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
