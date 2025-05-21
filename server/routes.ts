import express from 'express';
import { storage } from './storage';
import { unleashNftsService } from './unleashNftsService';
import { moralisService } from './moralisService';
import { EvmChain } from '@moralisweb3/common-evm-utils';

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

  // Add UnleashNFTs API routes
  app.get('/api/nft/blockchains', async (req, res) => {
    try {
      const blockchains = await unleashNftsService.getSupportedBlockchains();
      res.json(blockchains);
    } catch (error) {
      console.error('Error fetching supported blockchains:', error);
      res.status(500).json({ error: 'Failed to fetch supported blockchains' });
    }
  });

  app.get('/api/nft/collections/:chain', async (req, res) => {
    try {
      const { chain } = req.params;
      const { page = '1', limit = '10', metrics, sortBy } = req.query;
      
      const collections = await unleashNftsService.getCollectionsByChain(
        chain,
        parseInt(page as string),
        parseInt(limit as string),
        metrics as string,
        sortBy as string
      );
      
      res.json(collections);
    } catch (error) {
      console.error(`Error fetching collections for chain ${req.params.chain}:`, error);
      res.status(500).json({ error: 'Failed to fetch collections' });
    }
  });

  app.get('/api/nft/collection/:chain/:address', async (req, res) => {
    try {
      const { chain, address } = req.params;
      
      const collection = await unleashNftsService.getCollectionMetadata(address, chain);
      
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      
      res.json(collection);
    } catch (error) {
      console.error(`Error fetching collection ${req.params.address}:`, error);
      res.status(500).json({ error: 'Failed to fetch collection' });
    }
  });

  app.get('/api/nft/collection/:chain/:address/nfts', async (req, res) => {
    try {
      const { chain, address } = req.params;
      const { page = '1', limit = '10' } = req.query;
      
      const nfts = await unleashNftsService.getCollectionNFTs(
        address,
        chain,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      res.json(nfts);
    } catch (error) {
      console.error(`Error fetching NFTs for collection ${req.params.address}:`, error);
      res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
  });

  app.get('/api/nft/:chain/:address/:tokenId', async (req, res) => {
    try {
      const { chain, address, tokenId } = req.params;
      
      const nft = await unleashNftsService.getNFTDetailedMetadata(address, tokenId, chain);
      
      if (!nft) {
        return res.status(404).json({ error: 'NFT not found' });
      }
      
      res.json(nft);
    } catch (error) {
      console.error(`Error fetching NFT ${req.params.address}/${req.params.tokenId}:`, error);
      res.status(500).json({ error: 'Failed to fetch NFT' });
    }
  });

  app.get('/api/nft/:chain/:address/:tokenId/valuation', async (req, res) => {
    try {
      const { chain, address, tokenId } = req.params;
      
      const valuation = await unleashNftsService.getNFTValuation(address, tokenId, chain);
      
      if (!valuation) {
        return res.status(404).json({ error: 'NFT valuation not found' });
      }
      
      res.json(valuation);
    } catch (error) {
      console.error(`Error fetching NFT valuation ${req.params.address}/${req.params.tokenId}:`, error);
      res.status(500).json({ error: 'Failed to fetch NFT valuation' });
    }
  });

  // Fix the existing NFT import endpoint to use UnleashNFTs
  app.post('/api/nft/import', async (req, res) => {
    try {
      const { tokenAddress, tokenId, chain = 'ethereum', creatorId = 1 } = req.body;
      
      if (!tokenAddress || !tokenId) {
        return res.status(400).json({ message: 'Token address and token ID are required' });
      }
      
      // Get NFT data from Moralis
      const nftData = await moralisService.getNFTMetadata(tokenAddress, tokenId, chain);
      
      if (!nftData) {
        return res.status(404).json({ message: 'NFT not found' });
      }
      
      // Create app NFT data format
      const appNftData = {
        name: nftData.name || nftData.title || `NFT #${tokenId}`,
        description: nftData.description || '',
        imageUrl: nftData.image_url || nftData.image || '',
        tokenId: tokenId,
        contractAddress: tokenAddress,
        blockchain: chain,
        tokenStandard: nftData.contract_type || 'ERC721',
        royalty: '0',
        collection: '',
        floorPrice: '0',
        currency: chain === 'ethereum' ? 'ETH' : chain === 'polygon' ? 'MATIC' : 'USD',
        category: 'collectible',
        creatorId: creatorId,
        attributes: nftData.attributes || []
      };
      
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
        console.error('Error enriching NFT with UnleashNFTs data:', unleashError);
      }
      
      // Create NFT in our system directly
      const nft = appNftData;
      
      // Broadcast update to WebSocket clients if function exists
      if (typeof broadcastUpdate === 'function') {
        broadcastUpdate('nft-imported', { nft });
      }
      
      return res.status(201).json(nft);
    } catch (error) {
      console.error('Error importing NFT:', error);
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
      let moralisChain;
      if (chain === 'polygon') {
        moralisChain = EvmChain.POLYGON.toString();
      } else if (chain === 'bsc') {
        moralisChain = EvmChain.BSC.toString();
      } else if (chain === 'avalanche') {
        moralisChain = EvmChain.AVALANCHE.toString();
      } else {
        moralisChain = EvmChain.ETHEREUM.toString();
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
        // Create app NFT data format
        const appNftData = {
          name: nft.name || `NFT #${nft.tokenId}`,
          description: nft.metadata?.description || '',
          imageUrl: nft.metadata?.image || '',
          tokenId: nft.tokenId,
          contractAddress: nft.tokenAddress,
          blockchain: chain,
          tokenStandard: nft.contractType || 'ERC721',
          royalty: '0',
          collection: '',
          floorPrice: '0',
          currency: chain === 'ethereum' ? 'ETH' : chain === 'polygon' ? 'MATIC' : 'USD',
          category: 'collectible',
          creatorId: creatorId,
          attributes: nft.metadata?.attributes || []
        };
        
        // Try to enrich with UnleashNFTs data if available
        try {
          if (nft.tokenAddress) {
            // Fetch collection metadata
            const collectionData = await unleashNftsService.getCollectionMetadata(
              nft.tokenAddress,
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
                nft.tokenAddress,
                chain
              );
              
              if (collectionMetrics && collectionMetrics.floor_price) {
                appNftData.floorPrice = collectionMetrics.floor_price.toString();
              }
            }
            
            // Try to get NFT-specific data
            if (nft.tokenId) {
              // Get NFT valuation
              const nftValuation = await unleashNftsService.getNFTValuation(
                nft.tokenAddress,
                nft.tokenId,
                chain
              );
              
              if (nftValuation && nftValuation.estimated_price) {
                appNftData.floorPrice = nftValuation.estimated_price.toString();
              }
              
              // Get collection NFTs to find the specific one
              const collectionNFTs = await unleashNftsService.getCollectionNFTs(
                nft.tokenAddress,
                chain
              );
              
              // Find this specific NFT in the collection
              const specificNFT = collectionNFTs.find(n => n.token_id === nft.tokenId);
              
              if (specificNFT) {
                // Use better description if available
                if (specificNFT.description && specificNFT.description.length > appNftData.description.length) {
                  appNftData.description = specificNFT.description;
                }
                
                // Add traits as attributes if available
                if (specificNFT.traits && specificNFT.traits.length > 0) {
                  // Convert traits to our attribute format
                  const unleashAttributes = specificNFT.traits.map((trait: any) => ({
                    trait_type: trait.trait_type,
                    value: trait.value,
                    rarity: trait.rarity || null
                  }));
                  
                  // Combine with existing attributes
                  const existingAttributes = Array.isArray(appNftData.attributes) ? appNftData.attributes : [];
                  appNftData.attributes = [...existingAttributes, ...unleashAttributes];
                }
              }
            }
          }
        } catch (unleashError) {
          // Unable to fetch UnleashNFTs data, continue with basic data
          console.error('Error enriching NFT with UnleashNFTs data:', unleashError);
        }
        
        importedNFTs.push(appNftData);
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('wallet-nfts-imported', { 
        count: importedNFTs.length, 
        wallet: walletAddress 
      });
      
      return res.status(201).json(importedNFTs);
    } catch (error) {
      console.error('Error importing NFTs from wallet:', error);
      return res.status(500).json({ message: 'Failed to import NFTs from wallet' });
    }
  });

  // Catch-all route for client-side routing
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: './client/dist' });
  });
}

// Helper function for WebSocket broadcasts (define if not already defined)
function broadcastUpdate(type: string, data: any) {
  // Implementation depends on your WebSocket setup
  // This is a placeholder - implement based on your WebSocket configuration
  console.log(`Broadcasting ${type} update:`, data);
}
