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
import { magicEdenService } from "./magicEden";
import { moralisService } from "./moralisService";
import { unleashNftsService } from "./unleashNftsService";
import { EvmChain } from "@moralisweb3/common-evm-utils";

// WebSocket clients and utility functions
let wsClients: WebSocket[] = [];

// Broadcast updates to all connected WebSocket clients
function broadcastUpdate(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Add client to our list
    wsClients.push(ws);
    
    ws.on('message', (message) => {
      console.log('received: %s', message);
      
      // You can handle incoming messages here if needed
      try {
        const data = JSON.parse(message.toString());
        // Process message based on type
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Remove client from our list when they disconnect
      wsClients = wsClients.filter(client => client !== ws);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to Bidcoin auction server',
      timestamp: new Date().toISOString()
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

  // UnleashNFTs (BitCrunch) API Routes
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
        const nftData = magicEdenService.convertToAppNFT(meNFT, creatorId);
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
      
      const nftData = await moralisService.getNFTMetadata(tokenAddress, tokenId, chain);
      
      if (!nftData) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      return res.json(nftData);
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return res.status(500).json({ message: 'Failed to fetch NFT metadata' });
    }
  });

  // Import NFT from Moralis to our system
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
      
      // Create NFT in our system
      const nft = await storage.createNFT(appNftData);
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('nft-imported', { nft });
      
      return res.status(201).json(nft);
    } catch (error) {
      console.error('Error importing NFT from Moralis:', error);
      return res.status(500).json({ message: 'Failed to import NFT from Moralis' });
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
        const appNftData = moralisService.mapToAppNFT(nft, creatorId);
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
      console.error('Error importing wallet NFTs:', error);
      return res.status(500).json({ message: 'Failed to import NFTs from wallet' });
    }
  });

  return httpServer;
}
