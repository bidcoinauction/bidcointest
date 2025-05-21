import express from 'express';
import { storage } from './storage';

export function setupRoutes(app: express.Express) {
  // API routes
  app.get('/api/auctions/featured', async (req, res) => {
    try {
      const featuredAuctions = await storage.getFeaturedAuctions();
      res.json(featuredAuctions);
    } catch (error) {
      console.error('Error fetching featured auctions:', error);
      res.status(500).json({ error: 'Failed to fetch featured auctions' });
    }
  });

  app.get('/api/auctions', async (req, res) => {
    try {
      const auctions = await storage.getAuctions();
      res.json(auctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      res.status(500).json({ error: 'Failed to fetch auctions' });
    }
  });

  app.get('/api/auctions/:id', async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }
      
      res.json(auction);
    } catch (error) {
      console.error(`Error fetching auction ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch auction' });
    }
  });

  app.get('/api/bidpacks', async (req, res) => {
    try {
      const bidPacks = await storage.getBidPacks();
      res.json(bidPacks);
    } catch (error) {
      console.error('Error fetching bid packs:', error);
      res.status(500).json({ error: 'Failed to fetch bid packs' });
    }
  });

  app.get('/api/activity', async (req, res) => {
    try {
      const activity = await storage.getActivity();
      res.json(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  });

  app.get('/api/blockchain/stats', async (req, res) => {
    try {
      const stats = await storage.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      res.status(500).json({ error: 'Failed to fetch blockchain stats' });
    }
  });

  // Catch-all route for client-side routing
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: './client/dist' });
  });
}
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
