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
  insertAchievementSchema,
  insertUserAchievementSchema,
} from "@shared/schema";
import { z } from "zod";
import { magicEdenService } from "./magicEden";
import { moralisService } from "./moralisService";
import { unleashNftsService } from "./unleashNftsService";
import { achievementService } from "./achievementService";
import { alchemyNftService } from "./alchemyNftService";
import { EvmChain } from "@moralisweb3/common-evm-utils";

// WebSocket clients and utility functions
let wsClients: WebSocket[] = [];

// Helper function to normalize trait rarity to string for consistent typing
function normalizeTraitRarity(traits: Array<{
  trait_type: string;
  value: string;
  rarity?: number | string | undefined;
}>): Array<{
  trait_type: string;
  value: string;
  rarity: string;
}> {
  return traits.map(trait => ({
    trait_type: trait.trait_type,
    value: trait.value,
    rarity: trait.rarity ? trait.rarity.toString() : "0"  // Use "0" instead of null for rarity
  }));
}

// Broadcast updates to all connected WebSocket clients with enhanced metadata
function broadcastUpdate(type: string, data: any) {
  // Add timestamp to every message for client-side processing
  const enhancedData = {
    ...data,
    timestamp: new Date().toISOString(),
    messageId: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
  
  const message = JSON.stringify({ 
    type, 
    data: enhancedData 
  });
  
  // Log broadcast for debugging
  console.log(`[websocket] Broadcasting ${type} event to ${wsClients.length} clients`);
  
  let deliveredCount = 0;
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      deliveredCount++;
    }
  });
  
  console.log(`[websocket] Successfully delivered to ${deliveredCount}/${wsClients.length} clients`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection event
  wss.on('connection', (ws, req) => {
    console.log(`[websocket] New client connected from ${req.socket.remoteAddress}`);
    
    // Add client to our list with a unique ID
    const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    ws.clientId = clientId;
    wsClients.push(ws);
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`[websocket] Received message from ${clientId}:`, data.type);
        
        // Process message based on type
        if (data.type === 'ping') {
          // Respond to ping with pong + timestamp
          ws.send(JSON.stringify({ 
            type: 'pong', 
            data: {
              timestamp: new Date().toISOString(),
              clientId
            }
          }));
        } else if (data.type === 'subscribe') {
          // Handle client subscription to specific auctions
          const auctionId = data.auctionId;
          if (auctionId) {
            ws.subscribedAuctions = ws.subscribedAuctions || [];
            if (!ws.subscribedAuctions.includes(auctionId)) {
              ws.subscribedAuctions.push(auctionId);
              ws.send(JSON.stringify({
                type: 'subscription-confirmed',
                data: {
                  auctionId,
                  message: `Subscribed to auction ${auctionId} updates`,
                  timestamp: new Date().toISOString()
                }
              }));
            }
          }
        } else if (data.type === 'auction-stats') {
          // Handle request for auction stats
          const auctionId = data.auctionId;
          if (auctionId) {
            // Get latest auction data from storage
            storage.getAuction(auctionId).then(auction => {
              if (auction) {
                // Get recent bids for this auction
                storage.getBidsByAuction(auctionId).then(bids => {
                  // Calculate bid rate (bids per minute)
                  const now = new Date();
                  const oneMinuteAgo = new Date(now.getTime() - 60000);
                  const recentBids = bids.filter(b => 
                    b.timestamp && new Date(b.timestamp) >= oneMinuteAgo
                  );
                  
                  ws.send(JSON.stringify({
                    type: 'auction-stats-update',
                    data: {
                      auctionId,
                      bidCount: auction.bidCount,
                      currentBid: auction.currentBid,
                      lastBidTime: bids[0]?.timestamp || null,
                      bidRate: recentBids.length,
                      uniqueBidders: [...new Set(bids.map(b => b.bidderId))].length,
                      timestamp: new Date().toISOString()
                    }
                  }));
                });
              }
            });
          }
        }
      } catch (error) {
        console.error(`[websocket] Error processing message:`, error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log(`[websocket] Client ${clientId} disconnected`);
      // Remove client from our list
      wsClients = wsClients.filter(client => client !== ws);
    });
    
    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`[websocket] Error with client ${clientId}:`, error);
    });
    
    // Send initial connection confirmation with server stats
    ws.send(JSON.stringify({ 
      type: 'connected', 
      data: {
        message: 'Connected to Bidcoin auction server',
        clientId,
        clientCount: wsClients.length,
        timestamp: new Date().toISOString(),
        serverVersion: '1.2.0'
      }
    }));
  });
  
  
  // We use the broadcastUpdate function we defined at the top

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
  // The old '/api/auctions/:id/bid' endpoint has been removed
  // Use the '/api/bids' endpoint instead
  
  app.post('/api/bids', async (req, res) => {
    try {
      const bidData = z.object({
        auctionId: z.number(),
        amount: z.string(),
        bidderAddress: z.string(),
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
      
      // Get user by wallet address
      const bidder = await storage.getUserByWalletAddress(bidData.bidderAddress);
      if (!bidder) {
        return res.status(404).json({ message: 'User not found for wallet address' });
      }
      
      // Penny auction logic:
      // 1. Each bid costs $0.24 (in Bidcoin)
      // 2. Each bid only increases price by $0.03 (3 pennies per bid)
      // 3. Each bid extends auction time
      
      // Important: Bidding is always done in Bidcoin (platform currency)
      // The display/settlement amount is shown in the NFT's native currency for user convenience
      
      // Calculate the new bid amount (current bid + $0.03)
      const currentBid = Number(auction.currentBid || auction.startingBid);
      const bidIncrement = 0.03; // $0.03 increment per bid (in USD equivalent)
      
      // Get the NFT to check its floor price
      const nft = await storage.getNFT(auction.nftId);
      if (!nft) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      // Ensure we don't exceed the floor price discount threshold
      // We want to provide a 70-90% discount off the floor price
      const floorPrice = nft.floorPrice ? Number(nft.floorPrice) : 100.0;
      const maxPriceRatio = 0.3; // 70% discount (max price is 30% of floor)
      const maxPrice = floorPrice * maxPriceRatio;
      
      // Determine the new bid amount, capping at the maximum price if needed
      let newBidAmount: string;
      if (currentBid + bidIncrement >= maxPrice) {
        console.log(`Bid would exceed max price threshold. Capping at ${maxPrice}`);
        newBidAmount = maxPrice.toFixed(4);
      } else {
        newBidAmount = (currentBid + bidIncrement).toFixed(4);
      }
      
      // Note: The bid cost is fixed at $0.25 in Bidcoin tokens
      // Users pay this amount regardless of the NFT's native currency
      // Only when they win do they pay the final settlement price in the NFT's native crypto
      
      // Extend auction time (add 10-15 seconds per bid)
      let newEndTime = new Date(auction.endTime);
      const extensionSeconds = Math.floor(Math.random() * 6) + 10; // 10-15 seconds
      newEndTime.setSeconds(newEndTime.getSeconds() + extensionSeconds);
      
      // Update auction with new bid amount, end time, and increment bid count
      const updatedBidCount = (auction.bidCount || 0) + 1;
      await storage.updateAuctionBid(auction.id, newBidAmount, updatedBidCount, newEndTime);
      
      // Create bid record
      const newBid = await storage.createBid({
        auctionId: bidData.auctionId,
        bidderId: bidder.id,
        amount: newBidAmount,
      });
      
      // Create auction history entry
      await storage.createAuctionHistory({
        auctionId: bidData.auctionId,
        description: `Bid placed for ${newBidAmount} ${auction.currency} by ${bidder.username}`,
        icon: "fa-gavel",
      });
      
      // Create activity
      await storage.createActivity({
        type: "bid",
        nftId: auction.nftId,
        from: bidData.bidderAddress.substring(0, 6) + '...' + bidData.bidderAddress.substring(bidData.bidderAddress.length - 4),
        to: `@${auction.creator.username}`,
        price: newBidAmount,
        currency: auction.currency || "ETH",
      });
      
      // Process achievement triggers
      try {
        // Trigger achievements for bid placed
        await achievementService.processTrigger({
          type: 'bid_placed',
          userId: bidder.id,
          auctionId: auction.id,
          bidCount: updatedBidCount
        });
        
        // Check for first bid achievement if this is the user's first bid
        await achievementService.checkFirstTimeAchievement(bidder.id, 'bid');
        
        // Update bid count achievements
        await achievementService.updateBidCountAchievements(bidder.id);
        
        // Check for collection-specific achievements
        if (nft && nft.contractAddress) {
          await achievementService.processTrigger({
            type: 'collection_bid',
            userId: bidder.id,
            collection: nft.contractAddress
          });
        }
      } catch (error) {
        console.error('Error processing achievements:', error);
        // Non-blocking - continue even if achievements fail
      }
      
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
        bidsTotal: bidPack.bidCount + bidPack.bonusBids,
        bidsRemaining: bidPack.bidCount + bidPack.bonusBids,
        purchasePrice: bidPack.price.toString(),
        paymentMethod: 'ETH', // Default payment method
        currency: bidPack.currency,
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

  // ---------------------------------------------------------------------------
  // ALCHEMY NFT API ENDPOINTS - Direct access to Alchemy NFT API
  // ---------------------------------------------------------------------------
  
  // Get NFT metadata by contract address and token ID
  app.get('/api/alchemy/nft/:tokenAddress/:tokenId', async (req, res) => {
    try {
      const { tokenAddress, tokenId } = req.params;
      
      // Get NFT metadata from Alchemy
      const alchemyData = await alchemyNftService.getNFTMetadata(tokenAddress, tokenId);
      
      if (alchemyData) {
        // Format the data with Alchemy's formatter
        let formattedData = alchemyNftService.formatNFTMetadata(alchemyData);
        
        // Add floor price based on contract address
        if (tokenAddress === '0xed5af388653567af2f388e6224dc7c4b3241c544') { // Azuki
          formattedData.floor_price = "11.73";
          formattedData.floor_price_usd = "25560.94";
        } else if (tokenAddress === '0x2e175f748976cd5cdb98f12d1abc5d137d6c9379') { // Lil Z's Adventure
          formattedData.floor_price = "0.74";
          formattedData.floor_price_usd = "1610.58";
        } else if (tokenAddress === '0x4aeb52db83daa33a31673599e892d9247b0449ca') { // Claynosaurz
          formattedData.floor_price = "3.85";
          formattedData.floor_price_usd = "8398.75";
        } else if (tokenAddress === '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e') { // Doodles
          formattedData.floor_price = "2.12";
          formattedData.floor_price_usd = "4611.16";
        } else if (tokenAddress === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB') { // CryptoPunks
          formattedData.floor_price = "45.72";
          formattedData.floor_price_usd = "99466.56";
        } else if (tokenAddress === '0x60e4d786628fea6478f785a6d7e704777c86a7c6') { // Mutant Ape Yacht Club
          formattedData.floor_price = "2.248";
          formattedData.floor_price_usd = "4894.21";
        } else if (tokenAddress === '0x6e5dc5405baefb8c0166bcc78d2692777f2cbffb') { // BEEPLE: EVERYDAYS
          formattedData.floor_price = "15.99";
          formattedData.floor_price_usd = "34818.22";
        }
        
        return res.json(formattedData);
      } else {
        return res.status(404).json({ message: 'NFT not found in Alchemy' });
      }
    } catch (error: any) {
      console.error('Alchemy fetch error:', error);
      res.status(500).json({ message: 'Error fetching NFT from Alchemy' });
    }
  });
  
  // Get all NFTs in a collection
  app.get('/api/alchemy/collection/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const pageKey = req.query.pageKey as string;
      const pageSize = parseInt(req.query.pageSize as string || '20');
      
      const collectionData = await alchemyNftService.getNFTsForContract(address, pageKey, pageSize);
      
      if (collectionData) {
        // Format the collection data
        const formattedNfts = collectionData.nfts.map((nft: any) => 
          alchemyNftService.formatNFTMetadata(nft)
        );
        
        return res.json({
          nfts: formattedNfts,
          pageKey: collectionData.pageKey,
          totalCount: collectionData.totalCount
        });
      } else {
        return res.status(404).json({ message: 'Collection not found' });
      }
    } catch (error: any) {
      console.error('Alchemy collection fetch error:', error);
      res.status(500).json({ message: 'Error fetching collection from Alchemy' });
    }
  });
  
  // Get all NFTs owned by a wallet address
  app.get('/api/alchemy/wallet/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const pageKey = req.query.pageKey as string;
      const pageSize = parseInt(req.query.pageSize as string || '20');
      
      const walletData = await alchemyNftService.getNFTsForOwner(address, pageKey, pageSize);
      
      if (walletData) {
        // Format the wallet data
        const formattedNfts = walletData.ownedNfts.map((nft: any) => 
          alchemyNftService.formatNFTMetadata(nft)
        );
        
        return res.json({
          nfts: formattedNfts,
          pageKey: walletData.pageKey,
          totalCount: walletData.totalCount
        });
      } else {
        return res.status(404).json({ message: 'No NFTs found for this wallet' });
      }
    } catch (error: any) {
      console.error('Alchemy wallet fetch error:', error);
      res.status(500).json({ message: 'Error fetching wallet NFTs from Alchemy' });
    }
  });

  // UnleashNFTs (BitCrunch) API Routes
  app.get('/api/unleash/blockchains', async (req, res) => {
    try {
      const { page = '1', limit = '30', sort_by = 'blockchain_name' } = req.query;
      const blockchains = await unleashNftsService.getSupportedBlockchains(
        parseInt(page as string),
        parseInt(limit as string),
        sort_by as string
      );
      return res.json(blockchains);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch supported blockchains' });
    }
  });
  
  // Get collections by blockchain with native currency
  app.get('/api/unleash/collections-by-chain', async (req, res) => {
    try {
      const { 
        blockchain, 
        currency = 'native', // Use 'native' for blockchain native currency or 'usd' for USD
        limit = '12',
        offset = '0',
        time_range = '24h',
        sort_by = 'volume',
        metrics = 'floor_price,volume,holders,sales'
      } = req.query;
      
      // Convert metrics string to array if needed
      const metricsArray = typeof metrics === 'string' ? metrics.split(',') : (metrics as string[] || ['floor_price', 'volume', 'holders', 'sales']);
      
      // Get collections with the appropriate currency
      const result = await unleashNftsService.getCollectionsByBlockchain({
        blockchain: blockchain as string,
        currency: currency as string,
        metrics: metricsArray,
        sort_by: sort_by as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        time_range: time_range as string
      });
      
      return res.json(result);
    } catch (error) {
      console.error('Error fetching collections by blockchain:', error);
      return res.status(500).json({ message: 'Failed to fetch collections' });
    }
  });

  app.get('/api/unleash/collections', async (req, res) => {
    try {
      const { chain = 'ethereum', page = '1', limit = '10' } = req.query;
      const collections = await unleashNftsService.getCollectionsByChain(
        chain as string, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      return res.json(collections);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFT collections' });
    }
  });
  
  // New endpoint for collections with native currency support
  app.get('/api/unleash/collections-by-chain', async (req, res) => {
    try {
      const blockchain = req.query.blockchain as string || 'ethereum';
      const currency = req.query.currency as string || 'native';
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      
      // Map blockchain names to currency symbols
      const chainCurrencyMap: Record<string, string> = {
        'ethereum': 'ETH',
        'polygon': 'MATIC',
        'arbitrum': 'ETH',
        'optimism': 'ETH',
        'base': 'ETH',
        'solana': 'SOL',
        'binance': 'BNB',
        'avalanche': 'AVAX'
      };
      
      try {
        // Get collections using the existing service
        const collections = await unleashNftsService.getCollectionsByChain(blockchain, page, limit);
        
        // Log what we received
        console.log('[unleash-collections] Received collections from service:', collections);
        
        // Handle the case where no collections were returned or collections is not an array
        const collectionsArray = Array.isArray(collections) ? collections : [];
        
        // Enhance collections with native currency information
        const enhancedCollections = collectionsArray.map(collection => {
          // Determine the native currency symbol
          const currencySymbol = chainCurrencyMap[blockchain.toLowerCase()] || 'ETH';
          
          // Add native currency data
          return {
            ...collection,
            currency_symbol: currencySymbol,
            floor_price_native: collection.floor_price,
            floor_price_usd: collection.floor_price_usd || collection.floor_price
          };
        });
        
        if (enhancedCollections.length > 0) {
          res.json({ collections: enhancedCollections });
          return;
        }
        
        // If we didn't get any collections, our fallback in the client should handle it
        res.json({ collections: [] });
      } catch (apiError) {
        console.error(`[unleash-collections] API error: ${apiError}`);
        res.json({ collections: [] });
      }
    } catch (error) {
      console.error('Error fetching collections with native currency:', error);
      res.status(500).json({ error: 'Failed to fetch NFT collections with native currency' });
    }
  });

  app.get('/api/unleash/collection/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'ethereum' } = req.query;
      const collection = await unleashNftsService.getCollectionMetadata(address, chain as string);
      return res.json(collection);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch collection metadata' });
    }
  });

  app.get('/api/unleash/collection/:address/metrics', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'ethereum' } = req.query;
      const metrics = await unleashNftsService.getCollectionMetrics(address, chain as string);
      return res.json(metrics);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch collection metrics' });
    }
  });

  app.get('/api/unleash/collection/:address/trend', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'ethereum', period = '30d' } = req.query;
      const trend = await unleashNftsService.getCollectionTrend(
        address, 
        chain as string, 
        period as string
      );
      return res.json(trend);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch collection trend data' });
    }
  });

  app.get('/api/unleash/collection/:address/traits', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'ethereum' } = req.query;
      const traits = await unleashNftsService.getCollectionTraits(address, chain as string);
      return res.json(traits);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch collection traits' });
    }
  });
  
  // Achievement system endpoints
  
  // Get all achievements
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await db.select().from(achievements);
      return res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return res.status(500).json({ message: 'Failed to fetch achievements' });
    }
  });
  
  // Get user achievements
  app.get('/api/users/:userId/achievements', async (req, res) => {
    try {
      const { userId } = req.params;
      const userAchievements = await achievementService.getUserAchievements(parseInt(userId));
      return res.json(userAchievements);
    } catch (error) {
      console.error(`Error fetching user achievements for user ${req.params.userId}:`, error);
      return res.status(500).json({ message: 'Failed to fetch user achievements' });
    }
  });
  
  // Get user achievement stats
  app.get('/api/users/:userId/achievement-stats', async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await achievementService.getUserAchievementStats(parseInt(userId));
      return res.json(stats);
    } catch (error) {
      console.error(`Error fetching achievement stats for user ${req.params.userId}:`, error);
      return res.status(500).json({ message: 'Failed to fetch achievement stats' });
    }
  });
  
  // Process an achievement trigger (mostly used internally, but exposed as API for testing)
  app.post('/api/achievements/trigger', async (req, res) => {
    try {
      const triggerSchema = z.object({
        type: z.enum(['bid_placed', 'auction_won', 'login_streak', 'bid_count', 'collection_bid', 'first_bid', 'first_win', 'social_share']),
        userId: z.number(),
        // Optional fields based on trigger type
        auctionId: z.number().optional(),
        days: z.number().optional(),
        count: z.number().optional(),
        collection: z.string().optional(),
        platform: z.string().optional(),
      });
      
      const validatedData = triggerSchema.parse(req.body);
      const unlockedAchievements = await achievementService.processTrigger(validatedData as any);
      
      return res.json({ 
        success: true, 
        unlockedAchievements: unlockedAchievements.map(ua => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          points: ua.achievement.points,
          tier: ua.achievement.tier,
          icon: ua.achievement.icon
        }))
      });
    } catch (error) {
      console.error('Error processing achievement trigger:', error);
      return res.status(500).json({ message: 'Failed to process achievement trigger' });
    }
  });

  app.get('/api/unleash/collection/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'ethereum', page = '1', limit = '10' } = req.query;
      const nfts = await unleashNftsService.getCollectionNFTs(
        address, 
        chain as string, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      return res.json(nfts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFTs in collection' });
    }
  });

  app.get('/api/unleash/collection/:address/transactions', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'ethereum', page = '1', limit = '10' } = req.query;
      const transactions = await unleashNftsService.getCollectionTransactions(
        address, 
        chain as string, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      return res.json(transactions);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch collection transactions' });
    }
  });

  app.get('/api/unleash/collections-with-valuation', async (req, res) => {
    try {
      const { chain = 'ethereum', page = '1', limit = '10' } = req.query;
      const collections = await unleashNftsService.getCollectionsWithValuation(
        chain as string, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      return res.json(collections);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch collections with valuation' });
    }
  });

  app.get('/api/unleash/nfts-with-valuation', async (req, res) => {
    try {
      const { collection, chain = 'ethereum', page = '1', limit = '10' } = req.query;
      if (!collection) {
        return res.status(400).json({ message: 'Collection address is required' });
      }
      const nfts = await unleashNftsService.getNFTsWithValuation(
        collection as string, 
        chain as string, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      return res.json(nfts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFTs with valuation' });
    }
  });

  app.get('/api/unleash/nft-valuation', async (req, res) => {
    try {
      const { collection, token_id, chain = 'ethereum' } = req.query;
      if (!collection || !token_id) {
        return res.status(400).json({ message: 'Collection address and token ID are required' });
      }
      const valuation = await unleashNftsService.getNFTValuation(
        collection as string, 
        token_id as string, 
        chain as string
      );
      return res.json(valuation);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFT valuation' });
    }
  });
  
  // Detailed NFT metadata endpoint
  app.get('/api/unleash/nft/metadata', async (req, res) => {
    try {
      const { contract_address, slug_name, token_id, blockchain = 'ethereum' } = req.query;
      
      if (!token_id) {
        return res.status(400).json({ message: 'token_id is required' });
      }
      
      if (!contract_address && !slug_name) {
        return res.status(400).json({ 
          message: 'Either contract_address or slug_name is required' 
        });
      }
      
      // Define a function to enhance metadata with consistent floor price data
      const enhanceMetadata = (metadata: any, contract_address: string) => {
        if (!metadata) return metadata;
        
        if (contract_address === '0xed5af388653567af2f388e6224dc7c4b3241c544') { // Azuki
          metadata.floor_price = "11.73";
          metadata.floor_price_usd = "25560.94";
        } else if (contract_address === '0x2e175f748976cd5cdb98f12d1abc5d137d6c9379') { // Lil Z's Adventure
          metadata.floor_price = "0.74";
          metadata.floor_price_usd = "1610.58";
        } else if (contract_address === '0x4aeb52db83daa33a31673599e892d9247b0449ca') { // Claynosaurz
          metadata.floor_price = "3.85";
          metadata.floor_price_usd = "8398.75";
        } else if (contract_address === '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e') { // Doodles
          metadata.floor_price = "2.12";
          metadata.floor_price_usd = "4611.16";
        } else if (contract_address === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB') { // CryptoPunks
          metadata.floor_price = "45.72";
          metadata.floor_price_usd = "99466.56";
        } else if (contract_address === '0x60e4d786628fea6478f785a6d7e704777c86a7c6') { // Mutant Ape Yacht Club
          metadata.floor_price = "2.248";
          metadata.floor_price_usd = "4894.21";
        } else if (contract_address === '0x6e5dc5405baefb8c0166bcc78d2692777f2cbffb') { // BEEPLE: EVERYDAYS
          metadata.floor_price = "15.99";
          metadata.floor_price_usd = "34818.22";
        }
        
        return metadata;
      };
      
      // Check if we're dealing with a premium NFT that needs special handling
      const isPremiumNFT = (
        (contract_address === '0xed5af388653567af2f388e6224dc7c4b3241c544' && token_id === '9605') ||  // Azuki
        (contract_address === '0x2e175f748976cd5cdb98f12d1abc5d137d6c9379' && token_id === '245') ||   // Lil Z's Adventure
        (contract_address === '0x4aeb52db83daa33a31673599e892d9247b0449ca' && token_id === '7221') ||  // Claynosaurz
        (contract_address === '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e' && token_id === '1234') ||  // Doodles
        (contract_address === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB' && token_id === '7804') ||  // CryptoPunks
        (contract_address === '0x60e4d786628fea6478f785a6d7e704777c86a7c6' && token_id === '3652') ||  // Mutant Ape Yacht Club
        (contract_address === '0x6e5dc5405baefb8c0166bcc78d2692777f2cbffb' && token_id === '187')      // BEEPLE: EVERYDAYS
      );
      
      // Try UnleashNFTs API first
      let metadata = null;
      
      try {
        metadata = await unleashNftsService.getNFTMetadataFlex({
          contractAddress: contract_address as string | undefined,
          slugName: slug_name as string | undefined,
          tokenId: token_id as string,
          chain: blockchain as string
        });
      } catch (error) {
        // Silent error handling, will fall back to Alchemy
      }
      
      // If UnleashNFTs API didn't return valid data, try Alchemy API as fallback
      if (!metadata && contract_address) {
        try {
          const alchemyData = await alchemyNftService.getNFTMetadata(contract_address, token_id as string);
          if (alchemyData) {
            metadata = alchemyNftService.formatNFTMetadata(alchemyData);
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      // Apply floor price data for premium NFTs
      if (isPremiumNFT || metadata) {
        metadata = enhanceMetadata(metadata || {}, contract_address as string);
      }
      
      return res.json(metadata || { message: 'No metadata found' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFT metadata' });
    }
  });
  
  // New endpoint specifically for auction NFT details with consistent data
  app.get('/api/nft-details/:nftId', async (req, res) => {
    try {
      const { nftId } = req.params;
      
      // Get the NFT from storage
      const nft = await storage.getNFT(parseInt(nftId));
      
      if (!nft) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      // Enrich the NFT with detailed metadata
      let enrichedNFT = { ...nft };
      let metadataFound = false;
      
      try {
        // Attempt to get more detailed metadata from UnleashNFTs
        const metadata = await unleashNftsService.getNFTMetadataFlex({
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          chain: nft.blockchain || 'ethereum'
        });
        
        if (metadata) {
          metadataFound = true;
          // Merge the metadata with our NFT object
          enrichedNFT = {
            ...enrichedNFT,
            floorPrice: metadata.floor_price 
              ? metadata.floor_price.toString()
              : enrichedNFT.floorPrice,
            floorPriceUsd: metadata.floor_price_usd 
              ? metadata.floor_price_usd.toString()
              : null,
            attributes: metadata.traits && metadata.traits.length > 0
              ? metadata.traits.map((trait: any) => ({
                  trait_type: trait.trait_type,
                  value: trait.value,
                  rarity: trait.rarity ? trait.rarity.toString() : null
                }))
              : enrichedNFT.attributes
          };
          
          // Special case handling for premium NFTs to ensure consistent data
          if (
            (nft.contractAddress === '0xed5af388653567af2f388e6224dc7c4b3241c544' && nft.tokenId === '9605') ||
            (nft.contractAddress === '0x60cd862c9c687a9de49aecdc3a99b74a4fc54ab6' && nft.tokenId === '8748') ||
            (nft.contractAddress === '0x4aeb52db83daa33a31673599e892d9247b0449ca' && nft.tokenId === '7221') ||
            (nft.contractAddress === '0x5af0d9827e0c53e4799bb226655a1de152a425a5' && nft.tokenId === '7218') ||
            (nft.contractAddress === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB' && nft.tokenId === '7804') ||
            ((nft.contractAddress === '0xc88bfed94fd57443a012787bd43958fbd8553c69' || 
              nft.contractAddress === '0x8ec79a75be1bf1394e8d657ee006da730d003789') && 
              nft.tokenId === '8993')
          ) {
            // Apply premium data for selected NFTs
            
            // Set consistent floor prices based on premium data
            if (nft.contractAddress === '0xed5af388653567af2f388e6224dc7c4b3241c544') { // Azuki
              enrichedNFT.floorPrice = '11.73';
              enrichedNFT.floorPriceUsd = '25560.94';
            } else if (nft.contractAddress === '0x60cd862c9c687a9de49aecdc3a99b74a4fc54ab6') { // DeGods
              enrichedNFT.floorPrice = '4.58';
              enrichedNFT.floorPriceUsd = '9945.10';
            } else if (nft.contractAddress === '0x4aeb52db83daa33a31673599e892d9247b0449ca') { // Claynosaurz
              enrichedNFT.floorPrice = '3.85';
              enrichedNFT.floorPriceUsd = '8398.75';
            } else if (nft.contractAddress === '0x5af0d9827e0c53e4799bb226655a1de152a425a5') { // Milady
              enrichedNFT.floorPrice = '2.35';
              enrichedNFT.floorPriceUsd = '5129.75';
            } else if (nft.contractAddress === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB') { // CryptoPunks
              enrichedNFT.floorPrice = '5.72';
              enrichedNFT.floorPriceUsd = '12435.67';
            } else if (nft.contractAddress === '0xc88bfed94fd57443a012787bd43958fbd8553c69' || 
                      nft.contractAddress === '0x8ec79a75be1bf1394e8d657ee006da730d003789') { // MadLads
              enrichedNFT.floorPrice = '5.91';
              enrichedNFT.floorPriceUsd = '12890.56';
            }
          }
        }
      } catch (metadataError) {
        console.error('Error enriching NFT with metadata from UnleashNFTs:', metadataError);
        
        // If metadata wasn't found with UnleashNFTs, try with Alchemy
        if (!metadataFound) {
          try {
            // Fallback to Alchemy API for NFT metadata
            const alchemyData = await alchemyNftService.getNFTMetadata(nft.contractAddress, nft.tokenId);
            
            if (alchemyData) {
              const formattedData = alchemyNftService.formatNFTMetadata(alchemyData);
              metadataFound = true;
              
              // Merge the Alchemy data with our NFT object
              enrichedNFT = {
                ...enrichedNFT,
                floorPrice: formattedData.floor_price 
                  ? formattedData.floor_price.toString()
                  : enrichedNFT.floorPrice,
                floorPriceUsd: formattedData.floor_price_usd 
                  ? formattedData.floor_price_usd.toString()
                  : null,
                attributes: formattedData.traits && formattedData.traits.length > 0
                  ? formattedData.traits.map((trait: any) => ({
                      trait_type: trait.trait_type,
                      value: trait.value,
                      rarity: trait.rarity ? trait.rarity.toString() : null
                    }))
                  : enrichedNFT.attributes
              };
              
              // Successfully enriched NFT with Alchemy data
            }
          } catch (alchemyError) {
            // Continue with the original NFT data if enrichment fails
          }
        }
      }
      
      // Apply premium data override for specific NFTs
      if (
        (nft.contractAddress === '0xed5af388653567af2f388e6224dc7c4b3241c544' && nft.tokenId === '9605') ||
        (nft.contractAddress === '0x60cd862c9c687a9de49aecdc3a99b74a4fc54ab6' && nft.tokenId === '8748') ||
        (nft.contractAddress === '0x4aeb52db83daa33a31673599e892d9247b0449ca' && nft.tokenId === '7221') ||
        (nft.contractAddress === '0x5af0d9827e0c53e4799bb226655a1de152a425a5' && nft.tokenId === '7218') ||
        (nft.contractAddress === '0xbba9187d5108e395d0681462523c4404de06a497' && nft.tokenId === '4269') ||
        ((nft.contractAddress === '0xc88bfed94fd57443a012787bd43958fbd8553c69' || 
          nft.contractAddress === '0x8ec79a75be1bf1394e8d657ee006da730d003789') && 
          nft.tokenId === '8993')
      ) {
        // Apply premium data for selected NFTs
        
        // Set consistent floor prices based on premium data
        if (nft.contractAddress === '0xed5af388653567af2f388e6224dc7c4b3241c544') { // Azuki
          enrichedNFT.floorPrice = '11.73';
          enrichedNFT.floorPriceUsd = '25560.94';
        } else if (nft.contractAddress === '0x60cd862c9c687a9de49aecdc3a99b74a4fc54ab6') { // DeGods
          enrichedNFT.floorPrice = '4.58';
          enrichedNFT.floorPriceUsd = '9945.10';
        } else if (nft.contractAddress === '0x4aeb52db83daa33a31673599e892d9247b0449ca') { // Claynosaurz
          enrichedNFT.floorPrice = '3.85';
          enrichedNFT.floorPriceUsd = '8398.75';
        } else if (nft.contractAddress === '0x5af0d9827e0c53e4799bb226655a1de152a425a5') { // Milady
          enrichedNFT.floorPrice = '2.35';
          enrichedNFT.floorPriceUsd = '5129.75';
        } else if (nft.contractAddress === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB') { // CryptoPunks
          enrichedNFT.floorPrice = '5.72';
          enrichedNFT.floorPriceUsd = '12435.67';
        } else if (nft.contractAddress === '0xc88bfed94fd57443a012787bd43958fbd8553c69' || 
                  nft.contractAddress === '0x8ec79a75be1bf1394e8d657ee006da730d003789') { // MadLads
          enrichedNFT.floorPrice = '5.91';
          enrichedNFT.floorPriceUsd = '12890.56';
        }
      }
      
      return res.json(enrichedNFT);
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      return res.status(500).json({ message: 'Failed to fetch NFT details' });
    }
  });

  // Magic Eden API integration
  app.get('/api/magiceden/collections', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const timeRange = req.query.timeRange as string || '1d';
      const collections = await magicEdenService.getPopularCollections(limit, timeRange);
      return res.json(collections);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch Magic Eden collections' });
    }
  });

  app.get('/api/magiceden/collections/:symbol/nfts', async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const nfts = await magicEdenService.getCollectionNFTs(symbol, limit);
      return res.json(nfts);
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch NFTs for collection ${req.params.symbol}` });
    }
  });

  app.get('/api/magiceden/nfts/:collection/:tokenMint', async (req, res) => {
    try {
      const { collection, tokenMint } = req.params;
      const nft = await magicEdenService.getNFTDetails(collection, tokenMint);
      
      if (!nft) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      return res.json(nft);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFT details' });
    }
  });

  // Import Magic Eden NFTs to our system
  app.post('/api/magiceden/import', async (req, res) => {
    try {
      const { collectionSymbol, limit = 5, creatorId = 1 } = req.body;
      
      if (!collectionSymbol) {
        return res.status(400).json({ message: 'Collection symbol is required' });
      }
      
      const meNFTs = await magicEdenService.getCollectionNFTs(collectionSymbol, limit);
      
      if (!meNFTs || meNFTs.length === 0) {
        return res.status(404).json({ message: 'No NFTs found for this collection' });
      }
      
      const importedNFTs = [];
      
      for (const meNFT of meNFTs) {
        // Convert Magic Eden NFT to our app format
        const nftData = magicEdenService.convertToAppNFT(meNFT, creatorId);
        
        // Try to enrich with UnleashNFTs data if available
        try {
          // First get collection data to enhance description and metadata
          const collectionData = await unleashNftsService.getCollectionsByChain('solana', 1, 10);
          
          // Find a matching collection if available
          const matchingCollection = collectionData.find(c => 
            c.name.toLowerCase() === collectionSymbol.toLowerCase() || 
            c.contract_address.toLowerCase() === meNFT.mintAddress.toLowerCase()
          );
          
          if (matchingCollection) {
            // Enhance with collection data
            if (matchingCollection.name) {
              nftData.collection = matchingCollection.name;
            }
            
            if (matchingCollection.description && (!nftData.description || nftData.description === '')) {
              nftData.description = matchingCollection.description;
            }
            
            if (matchingCollection.floor_price) {
              nftData.floorPrice = matchingCollection.floor_price.toString();
            }
            
            // Try to get NFT-specific data if token ID is available
            if (meNFT.mintAddress) {
              try {
                // Get collection NFTs
                const nfts = await unleashNftsService.getCollectionNFTs(
                  matchingCollection.contract_address,
                  'solana',
                  1,
                  20
                );
                
                // Find matching NFT by token ID/mint address
                const matchingNFT = nfts.find(n => n.token_id === meNFT.mintAddress);
                
                if (matchingNFT) {
                  // Override with richer data if available
                  if (matchingNFT.description && matchingNFT.description.length > nftData.description.length) {
                    nftData.description = matchingNFT.description;
                  }
                  
                  if (matchingNFT.estimated_price) {
                    nftData.floorPrice = matchingNFT.estimated_price.toString();
                  }
                  
                  // Add traits as attributes if available
                  if (matchingNFT.traits && matchingNFT.traits.length > 0) {
                    // Convert traits to our attribute format with normalized rarity field
                    const unleashAttributes = normalizeTraitRarity(matchingNFT.traits);
                    
                    // Combine existing attributes with UnleashNFTs attributes
                    const existingAttributes = Array.isArray(nftData.attributes) ? nftData.attributes : [];
                    nftData.attributes = [...existingAttributes, ...unleashAttributes];
                  }
                }
              } catch (nftError) {
                // Unable to fetch specific NFT data from UnleashNFTs, continuing with fallback
              }
            }
          }
        } catch (unleashError) {
          // Unable to fetch UnleashNFTs data, continue with basic data
          // Continue with basic Magic Eden data
        }
        
        // Create NFT in our system
        const nft = await storage.createNFT(nftData);
        importedNFTs.push(nft);
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('nfts-imported', { count: importedNFTs.length, collection: collectionSymbol });
      
      return res.status(201).json(importedNFTs);
    } catch (error) {
      console.error('Error importing NFTs:', error);
      return res.status(500).json({ message: 'Failed to import NFTs from Magic Eden' });
    }
  });

  // Moralis API integration
  app.get('/api/moralis/wallet/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const chainParam = req.query.chain as string;
      
      // Default to ETH, but allow other chains
      let chain = EvmChain.ETHEREUM;
      if (chainParam === 'polygon') {
        chain = EvmChain.POLYGON;
      } else if (chainParam === 'bsc') {
        chain = EvmChain.BSC;
      } else if (chainParam === 'avalanche') {
        chain = EvmChain.AVALANCHE;
      }
      
      const nfts = await moralisService.getWalletNFTs(address, chain);
      return res.json(nfts);
    } catch (error) {
      console.error('Error fetching wallet NFTs:', error);
      return res.status(500).json({ message: 'Failed to fetch NFTs from wallet' });
    }
  });

  app.get('/api/moralis/collection/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const chainParam = req.query.chain as string;
      
      // Default to ETH, but allow other chains
      let chain = EvmChain.ETHEREUM;
      if (chainParam === 'polygon') {
        chain = EvmChain.POLYGON;
      } else if (chainParam === 'bsc') {
        chain = EvmChain.BSC;
      } else if (chainParam === 'avalanche') {
        chain = EvmChain.AVALANCHE;
      }
      
      const nfts = await moralisService.getNFTsByCollection(address, chain);
      return res.json(nfts);
    } catch (error) {
      console.error('Error fetching collection NFTs:', error);
      return res.status(500).json({ message: 'Failed to fetch NFTs from collection' });
    }
  });
  
  // Alchemy NFT API endpoints
  app.get('/api/alchemy/nft/:contract/:tokenId', async (req, res) => {
    try {
      const { contract, tokenId } = req.params;
      const nftData = await alchemyNftService.getNFTMetadata(contract, tokenId);
      
      if (!nftData) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      const formattedData = alchemyNftService.formatNFTMetadata(nftData);
      return res.json(formattedData);
    } catch (error) {
      console.error('Error fetching NFT metadata from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch NFT metadata' });
    }
  });
  
  app.get('/api/alchemy/collections/trending', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const collections = await alchemyNftService.getTrendingCollections(limit);
      return res.json(collections);
    } catch (error) {
      console.error('Error fetching trending collections from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch trending collections' });
    }
  });
  
  app.get('/api/alchemy/contract/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const contractData = await alchemyNftService.getContractMetadata(address);
      
      if (!contractData) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      return res.json(contractData);
    } catch (error) {
      console.error('Error fetching contract metadata from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch contract metadata' });
    }
  });
  
  app.get('/api/alchemy/contract/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const pageKey = req.query.pageKey as string;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 50;
      
      const nftsData = await alchemyNftService.getNFTsForContract(address, pageKey, pageSize);
      
      if (!nftsData) {
        return res.status(404).json({ message: 'NFTs not found' });
      }
      
      return res.json(nftsData);
    } catch (error) {
      console.error('Error fetching NFTs for contract from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch NFTs for contract' });
    }
  });
  
  app.get('/api/alchemy/owner/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      const pageKey = req.query.pageKey as string;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 50;
      
      const nftsData = await alchemyNftService.getNFTsForOwner(address, pageKey, pageSize);
      
      if (!nftsData) {
        return res.status(404).json({ message: 'NFTs not found' });
      }
      
      return res.json(nftsData);
    } catch (error) {
      console.error('Error fetching NFTs for owner from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch NFTs for owner' });
    }
  });
  
  app.get('/api/alchemy/contract/:address/floor-price', async (req, res) => {
    try {
      const { address } = req.params;
      const marketplace = req.query.marketplace as string || 'all';
      
      const floorPrice = await alchemyNftService.getCollectionFloorPrice(address, marketplace);
      
      if (!floorPrice) {
        return res.status(404).json({ message: 'Floor price not found' });
      }
      
      return res.json(floorPrice);
    } catch (error) {
      console.error('Error fetching floor price from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch floor price' });
    }
  });

  app.get('/api/moralis/nft/:tokenAddress/:tokenId', async (req, res) => {
    try {
      const { tokenAddress, tokenId } = req.params;
      const chainParam = req.query.chain as string;
      
      // Default to ETH, but allow other chains
      let chain = EvmChain.ETHEREUM;
      if (chainParam === 'polygon') {
        chain = EvmChain.POLYGON;
      } else if (chainParam === 'bsc') {
        chain = EvmChain.BSC;
      } else if (chainParam === 'avalanche') {
        chain = EvmChain.AVALANCHE;
      }
      
      try {
        // First try with Moralis
        const nftData = await moralisService.getNFTMetadata(tokenAddress, tokenId, chain);
        
        if (nftData) {
          return res.json(nftData);
        }
        
        // If Moralis fails, try with Alchemy as fallback
        const alchemyData = await alchemyNftService.getNFTMetadata(tokenAddress, tokenId);
        
        if (alchemyData) {
          const formattedData = alchemyNftService.formatNFTMetadata(alchemyData);
          return res.json(formattedData);
        }
        
        return res.status(404).json({ message: 'NFT not found' });
      } catch (apiError) {
        // Try Alchemy as fallback if Moralis throws an error
        try {
          const alchemyData = await alchemyNftService.getNFTMetadata(tokenAddress, tokenId);
          
          if (alchemyData) {
            const formattedData = alchemyNftService.formatNFTMetadata(alchemyData);
            return res.json(formattedData);
          }
          
          return res.status(404).json({ message: 'NFT not found' });
        } catch (fallbackError) {
          return res.status(404).json({ message: 'NFT not found' });
        }
      }
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch NFT metadata' });
    }
  });

  // Import NFT from Moralis to our system
  // ALCHEMY NFT API ENDPOINTS
  app.get('/api/alchemy/nft/:contractAddress/:tokenId', async (req, res) => {
    try {
      const { contractAddress, tokenId } = req.params;
      
      const nftData = await alchemyNftService.getNFTMetadata(contractAddress, tokenId);
      
      if (!nftData) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      const formattedData = alchemyNftService.formatNFTMetadata(nftData);
      return res.json(formattedData);
    } catch (error) {
      console.error('Error fetching NFT metadata from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch NFT metadata' });
    }
  });

  app.get('/api/alchemy/collection/:contractAddress', async (req, res) => {
    try {
      const { contractAddress } = req.params;
      
      const collectionData = await alchemyNftService.getContractMetadata(contractAddress);
      
      if (!collectionData) {
        return res.status(404).json({ message: 'Collection not found' });
      }
      
      return res.json(collectionData);
    } catch (error) {
      console.error('Error fetching collection metadata from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch collection metadata' });
    }
  });

  app.get('/api/alchemy/collection/:contractAddress/nfts', async (req, res) => {
    try {
      const { contractAddress } = req.params;
      const pageKey = req.query.pageKey as string;
      const pageSize = parseInt(req.query.pageSize as string || '20');
      
      const nftsData = await alchemyNftService.getNFTsForContract(contractAddress, pageKey, pageSize);
      
      if (!nftsData) {
        return res.status(404).json({ message: 'NFTs not found' });
      }
      
      return res.json(nftsData);
    } catch (error) {
      console.error('Error fetching NFTs for collection from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch NFTs for collection' });
    }
  });

  app.get('/api/alchemy/owner/:ownerAddress/nfts', async (req, res) => {
    try {
      const { ownerAddress } = req.params;
      const pageKey = req.query.pageKey as string;
      const pageSize = parseInt(req.query.pageSize as string || '20');
      
      const nftsData = await alchemyNftService.getNFTsForOwner(ownerAddress, pageKey, pageSize);
      
      if (!nftsData) {
        return res.status(404).json({ message: 'NFTs not found' });
      }
      
      return res.json(nftsData);
    } catch (error) {
      console.error('Error fetching NFTs for owner from Alchemy:', error);
      return res.status(500).json({ message: 'Failed to fetch NFTs for owner' });
    }
  });

  app.post('/api/nfts/import', async (req, res) => {
    try {
      const { tokenAddress, tokenId, creatorId = 1, chain = 'ethereum' } = req.body;
      
      if (!tokenAddress || !tokenId) {
        return res.status(400).json({ 
          message: 'Token address and token ID are required' 
        });
      }
      
      // Map chain string to Moralis chain
      let moralisChain = EvmChain.ETHEREUM;
      if (chain === 'polygon') {
        moralisChain = EvmChain.POLYGON;
      } else if (chain === 'bsc') {
        moralisChain = EvmChain.BSC;
      } else if (chain === 'avalanche') {
        moralisChain = EvmChain.AVALANCHE;
      }
      
      // Get NFT metadata from Moralis
      const nftData = await moralisService.getNFTMetadata(tokenAddress, tokenId, moralisChain);
      
      if (!nftData) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      // Map to our app's NFT schema
      const appNftData = moralisService.mapToAppNFT(nftData, creatorId);
      
      // Try to enrich with UnleashNFTs data if available
      try {
        const unleashData = await unleashNftsService.getNFTValuation(
          tokenAddress,
          tokenId,
          chain
        );
        
        if (unleashData) {
          // Enrich with floor price and price estimation if available
          if (unleashData.estimated_price) {
            appNftData.floorPrice = unleashData.estimated_price.toString();
          }
          
          // Get additional collection data
          const collectionData = await unleashNftsService.getCollectionMetadata(
            tokenAddress,
            chain
          );
          
          if (collectionData) {
            // Add collection name if available
            if (collectionData.name) {
              appNftData.collection = collectionData.name;
            }
            
            // Enhance description if available
            if (collectionData.description && (!appNftData.description || appNftData.description === '')) {
              appNftData.description = collectionData.description;
            }
          }
        }
      } catch (unleashError) {
        // Unable to fetch UnleashNFTs data, continue with basic data
        // Continue with basic Moralis data
      }
      
      // Create NFT in our system
      const nft = await storage.createNFT(appNftData);
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('nft-imported', { nft });
      
      return res.status(201).json(nft);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to import NFT' });
    }
  });

  // Import multiple NFTs from a wallet
  app.post('/api/wallet/:walletAddress/import', async (req, res) => {
    const { walletAddress } = req.params;
    try {
      const { limit = 5, creatorId = 1, chain = 'ethereum' } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Map chain string to Moralis chain
      let moralisChain = EvmChain.ETHEREUM;
      if (chain === 'polygon') {
        moralisChain = EvmChain.POLYGON;
      } else if (chain === 'bsc') {
        moralisChain = EvmChain.BSC;
      } else if (chain === 'avalanche') {
        moralisChain = EvmChain.AVALANCHE;
      }
      
      // Get NFTs from wallet
      const nfts = await moralisService.getWalletNFTs(walletAddress, moralisChain);
      
      if (!nfts || nfts.length === 0) {
        return res.status(404).json({ message: 'No NFTs found in this wallet' });
      }
      
      // Limit the number of NFTs to import
      const limitedNfts = nfts.slice(0, limit);
      
      const importedNFTs = [];
      
      // Import each NFT
      for (const nft of limitedNfts) {
        // Map to our app's NFT schema
        const appNftData = moralisService.mapToAppNFT(nft, creatorId);
        
        // Try to enrich with UnleashNFTs data if available
        try {
          if (nft.token_address) {
            // Fetch collection metadata
            const collectionData = await unleashNftsService.getCollectionMetadata(
              nft.token_address,
              chain
            );
            
            if (collectionData) {
              // Add collection name if available
              if (collectionData.name) {
                appNftData.collection = collectionData.name;
              }
              
              // Enhance description if available and needed
              if (collectionData.description && (!appNftData.description || appNftData.description === '')) {
                appNftData.description = collectionData.description;
              }
              
              // Get floor price if available
              if (collectionData.floor_price) {
                appNftData.floorPrice = collectionData.floor_price.toString();
              }
              
              // Get collection metrics for more data
              const collectionMetrics = await unleashNftsService.getCollectionMetrics(
                nft.token_address,
                chain
              );
              
              if (collectionMetrics && collectionMetrics.floor_price) {
                appNftData.floorPrice = collectionMetrics.floor_price.toString();
              }
            }
            
            // Try to get NFT-specific data
            if (nft.token_id) {
              // Get NFT valuation
              const nftValuation = await unleashNftsService.getNFTValuation(
                nft.token_address,
                nft.token_id,
                chain
              );
              
              if (nftValuation && nftValuation.estimated_price) {
                appNftData.floorPrice = nftValuation.estimated_price.toString();
              }
              
              // Get collection NFTs to find the specific one
              const collectionNFTs = await unleashNftsService.getCollectionNFTs(
                nft.token_address,
                chain
              );
              
              // Find this specific NFT in the collection
              const specificNFT = collectionNFTs.find(n => n.token_id === nft.token_id);
              
              if (specificNFT) {
                // Use better description if available
                if (specificNFT.description && specificNFT.description.length > appNftData.description.length) {
                  appNftData.description = specificNFT.description;
                }
                
                // Add traits as attributes if available
                if (specificNFT.traits && specificNFT.traits.length > 0) {
                  // Convert traits to our attribute format using the normalizer
                  const unleashAttributes = normalizeTraitRarity(specificNFT.traits);
                  
                  // Combine with existing attributes
                  const existingAttributes = Array.isArray(appNftData.attributes) ? appNftData.attributes : [];
                  appNftData.attributes = [...existingAttributes, ...unleashAttributes];
                }
              }
            }
          }
        } catch (unleashError) {
          // Unable to fetch UnleashNFTs data, continue with basic data
          // Continue with basic Moralis data
        }
        
        const createdNft = await storage.createNFT(appNftData);
        importedNFTs.push(createdNft);
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('wallet-nfts-imported', { 
        count: importedNFTs.length, 
        wallet: walletAddress 
      });
      
      return res.status(201).json(importedNFTs);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to import NFTs from wallet' });
    }
  });

  return httpServer;
}
