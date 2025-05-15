import { useState, useEffect } from 'react';
import { getTokenURI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook to fetch and manage tokenURI data for NFTs
 * 
 * @param contractAddress The NFT contract address
 * @param tokenId The NFT token ID
 * @param chain The blockchain network (ethereum, polygon, etc)
 * @returns tokenURI data and loading state
 */
export function useTokenURI(contractAddress?: string, tokenId?: string, chain: string = 'ethereum') {
  // Skip query if we don't have both contractAddress and tokenId
  const shouldFetch = Boolean(contractAddress && tokenId);

  const {
    data: tokenData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['tokenURI', contractAddress, tokenId, chain],
    queryFn: () => getTokenURI(contractAddress as string, tokenId as string, chain),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since NFT metadata rarely changes
    retry: 1 // Only retry once as most 404s will remain 404s
  });

  // Extract the most likely image URL from the token data
  const getImageFromTokenData = () => {
    if (!tokenData) return null;

    try {
      // For metadata in tokenData.metadata, it's often a JSON string we need to parse
      let metadata = null;
      if (tokenData.metadata) {
        if (typeof tokenData.metadata === 'string') {
          try {
            metadata = JSON.parse(tokenData.metadata);
          } catch (e) {
            console.error('Failed to parse token metadata', e);
          }
        } else {
          metadata = tokenData.metadata;
        }
      }

      // Check multiple sources for the image URL
      if (metadata?.image) {
        return metadata.image;
      } else if (metadata?.image_url) {
        return metadata.image_url;
      } else if (tokenData.token_uri?.image) {
        return tokenData.token_uri.image;
      } else if (tokenData.token_uri?.image_url) {
        return tokenData.token_uri.image_url;
      } else if (tokenData.normalized_metadata?.image) {
        return tokenData.normalized_metadata.image;
      } else if (tokenData.image) {
        return tokenData.image;
      }
    } catch (e) {
      console.error('Error extracting image from token data', e);
    }

    return null;
  };

  // The image URL extracted from token data
  const imageUrl = getImageFromTokenData();

  return {
    tokenData,
    imageUrl,
    isLoading,
    isError,
    error
  };
}

export default useTokenURI;