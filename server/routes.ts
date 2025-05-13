import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { 
  insertUserSchema, 
  insertNftSchema, 
  insertAuctionSchema, 
  insertBidSchema, 
  insertActivitySchema,
  insertAuctionHistorySchema,
  insertBidPackSchema,
  insertUserBidPackSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('received: %s', message);
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  
  // Function to broadcast updates to all connected WebSocket clients
  const broadcastUpdate = (type: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  };

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
  });
  
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if wallet address already exists if provided
      if (userData.walletAddress) {
        const existingWallet = await storage.getUserByWalletAddress(userData.walletAddress);
        if (existingWallet) {
          return res.status(400).json({ message: 'Wallet address already linked to another account' });
        }
      }
      
      const newUser = await storage.createUser(userData);
      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.format() });
      }
      return res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  // NFT routes
  app.get('/api/nfts', async (req, res) => {
    const nfts = await storage.getNFTs();
    return res.json(nfts);
  });
  
  app.get('/api/nfts/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const nft = await storage.getNFT(id);
    
    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    
    return res.json(nft);
  });
  
  app.post('/api/nfts', async (req, res) => {
    try {
      const nftData = insertNftSchema.parse(req.body);
      
      // Verify that creator exists
      const creatorId = nftData.creatorId;
      if (creatorId === null || creatorId === undefined) {
        return res.status(400).json({ message: 'Creator ID is required' });
      }
      
      const creator = await storage.getUser(creatorId);
      if (!creator) {
        return res.status(400).json({ message: 'Creator not found' });
      }
      
      const newNft = await storage.createNFT(nftData);
      return res.status(201).json(newNft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid NFT data', errors: error.format() });
      }
      return res.status(500).json({ message: 'Failed to create NFT' });
    }
  });
  
  // Auction routes
  app.get('/api/auctions', async (req, res) => {
    const auctions = await storage.getAuctions();
    return res.json(auctions);
  });
  
  app.get('/api/auctions/featured', async (req, res) => {
    const featuredAuctions = await storage.getFeaturedAuctions();
    return res.json(featuredAuctions);
  });
  
  app.get('/api/auctions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const auction = await storage.getAuction(id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    return res.json(auction);
  });
  
  app.post('/api/auctions', async (req, res) => {
    try {
      const auctionData = insertAuctionSchema.parse(req.body);
      
      // Verify NFT exists
      const nft = await storage.getNFT(auctionData.nftId);
      if (!nft) {
        return res.status(400).json({ message: 'NFT not found' });
      }
      
      // Verify creator exists
      const creatorId = auctionData.creatorId;
      if (creatorId === null || creatorId === undefined) {
        return res.status(400).json({ message: 'Creator ID is required' });
      }
      
      const creator = await storage.getUser(creatorId);
      if (!creator) {
        return res.status(400).json({ message: 'Creator not found' });
      }
      
      const newAuction = await storage.createAuction(auctionData);
      
      // Create auction history entry
      await storage.createAuctionHistory({
        auctionId: newAuction.id,
        description: `Auction created by ${creator.username}`,
        icon: "fa-plus-circle",
      });
      
      // Create activity for the listing
      await storage.createActivity({
        type: "listing",
        nftId: auctionData.nftId,
        from: `@${creator.username}`,
        to: "Auction House",
        price: String(auctionData.startingBid || 0),
        currency: auctionData.currency || "ETH",
      });
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('new-auction', newAuction);
      
      return res.status(201).json(newAuction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid auction data', errors: error.format() });
      }
      return res.status(500).json({ message: 'Failed to create auction' });
    }
  });
  
  // Bid routes
  app.post('/api/bids', async (req, res) => {
    try {
      const bidData = z.object({
        auctionId: z.number(),
        amount: z.number(),
        walletAddress: z.string(),
      }).parse(req.body);
      
      // Get auction
      const auction = await storage.getAuction(bidData.auctionId);
      if (!auction) {
        return res.status(404).json({ message: 'Auction not found' });
      }
      
      // Check if auction is still active
      if (new Date(auction.endTime) < new Date()) {
        return res.status(400).json({ message: 'Auction has ended' });
      }
      
      // Check if bid amount is higher than current bid
      if (bidData.amount <= Number(auction.currentBid)) {
        return res.status(400).json({ message: 'Bid amount must be higher than current bid' });
      }
      
      // Get user by wallet address
      const bidder = await storage.getUserByWalletAddress(bidData.walletAddress);
      if (!bidder) {
        return res.status(404).json({ message: 'User not found for wallet address' });
      }
      
      // Create bid
      const newBid = await storage.createBid({
        auctionId: bidData.auctionId,
        bidderId: bidder.id,
        amount: bidData.amount,
      });
      
      // Create auction history entry
      await storage.createAuctionHistory({
        auctionId: bidData.auctionId,
        description: `Bid placed for ${bidData.amount} ${auction.currency} by ${bidder.username}`,
        icon: "fa-gavel",
      });
      
      // Create activity
      await storage.createActivity({
        type: "bid",
        nftId: auction.nftId,
        from: bidData.walletAddress.substring(0, 6) + '...' + bidData.walletAddress.substring(bidData.walletAddress.length - 4),
        to: `@${auction.creator.username}`,
        price: bidData.amount,
        currency: auction.currency,
      });
      
      // Get updated auction
      const updatedAuction = await storage.getAuction(bidData.auctionId);
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('new-bid', { bid: newBid, auction: updatedAuction });
      
      return res.status(201).json({ bid: newBid, auction: updatedAuction });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid bid data', errors: error.format() });
      }
      return res.status(500).json({ message: 'Failed to place bid' });
    }
  });
  
  // BidPack routes
  app.get('/api/bidpacks', async (req, res) => {
    const bidPacks = await storage.getBidPacks();
    return res.json(bidPacks);
  });
  
  app.post('/api/bidpacks/purchase', async (req, res) => {
    try {
      const purchaseData = z.object({
        packId: z.number(),
        walletAddress: z.string(),
      }).parse(req.body);
      
      // Get bid pack
      const bidPack = await storage.getBidPack(purchaseData.packId);
      if (!bidPack) {
        return res.status(404).json({ message: 'Bid pack not found' });
      }
      
      // Get user by wallet address
      const user = await storage.getUserByWalletAddress(purchaseData.walletAddress);
      if (!user) {
        return res.status(404).json({ message: 'User not found for wallet address' });
      }
      
      // Create user bid pack
      const userBidPack = await storage.createUserBidPack({
        userId: user.id,
        bidPackId: purchaseData.packId,
        bidsRemaining: bidPack.bidCount + bidPack.bonusBids,
      });
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('bidpack-purchase', { userBidPack });
      
      return res.status(201).json(userBidPack);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid purchase data', errors: error.format() });
      }
      return res.status(500).json({ message: 'Failed to purchase bid pack' });
    }
  });
  
  // Activity routes
  app.get('/api/activity', async (req, res) => {
    const activities = await storage.getActivities();
    return res.json(activities);
  });
  
  // BitCrunch API integration
  app.get('/api/blockchain/stats', async (req, res) => {
    try {
      const stats = await storage.getBlockchainStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch blockchain stats' });
    }
  });

  return httpServer;
}
