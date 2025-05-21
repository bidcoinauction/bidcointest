import { useState, useEffect } from 'react';
import { nftApi } from '@/lib/apiService';
import { useQuery } from '@tanstack/react-query';
import { sanitizeNFTImageUrl } from '@/lib/utils';

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

  // Use local state to track error count for enhanced retry behavior
  const [errorCount, setErrorCount] = useState(0);
  
  // Create a cache key for this NFT to check if we've tried it before
  const cacheKey = `${contractAddress}:${tokenId}:${chain}`;
  
  // Check if we've previously failed and should avoid retrying
  const [shouldSkipFetch, setShouldSkipFetch] = useState(() => {
    // Check localStorage for previously failed lookups
    const failedLookups = localStorage.getItem('failedTokenURILookups');
    if (failedLookups) {
      try {
        const failedList = JSON.parse(failedLookups);
        return failedList.includes(cacheKey);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const {
    data: tokenData,
    isLoading,
    isError,
    error,
    isSuccess
  } = useQuery({
    queryKey: ['tokenURI', contractAddress, tokenId, chain],
    queryFn: async () => {
      try {
        const data = await nftApi.getTokenURI(
          contractAddress as string, 
          tokenId as string, 
          typeof chain === 'string' ? parseInt(chain, 10) : chain
        );
        setErrorCount(0); // Reset error count on success
        return data;
      } catch (err) {
        setErrorCount(prev => {
          const newCount = prev + 1;
          // If we've failed 3 times, add to localStorage to avoid future retries
          if (newCount >= 3) {
            try {
              const failedLookups = localStorage.getItem('failedTokenURILookups');
              const failedList = failedLookups ? JSON.parse(failedLookups) : [];
              if (!failedList.includes(cacheKey)) {
                failedList.push(cacheKey);
                localStorage.setItem('failedTokenURILookups', JSON.stringify(failedList));
                setShouldSkipFetch(true);
              }
            } catch (e) {
              // If storage fails, continue
            }
          }
          return newCount;
        });
        throw err;
      }
    },
    enabled: shouldFetch && !shouldSkipFetch, // Don't fetch if we know it will fail
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours since NFT metadata rarely changes
    retry: 1, // Only retry once to avoid excessive requests
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000) // Shorter max retry delay
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
            console.warn('Failed to parse token metadata, treating as object', e);
            metadata = tokenData.metadata; // Some APIs return escaped JSON, try as is
          }
        } else {
          metadata = tokenData.metadata;
        }
      }

      // UnleashNFTs data structure
      if (tokenData.nft_data) {
        if (tokenData.nft_data.content && tokenData.nft_data.content.image) {
          return tokenData.nft_data.content.image.url;
        }
        if (tokenData.nft_data.token_uri) {
          return tokenData.nft_data.token_uri;
        }
      }

      // Moralis structure: check multiple sources for the image URL
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
      } else if (tokenData.media && tokenData.media[0]?.gateway) {
        return tokenData.media[0].gateway;
      }
      
      // Look in animation_url as some NFTs only provide this
      if (metadata?.animation_url) {
        return metadata.animation_url;
      } else if (tokenData.animation_url) {
        return tokenData.animation_url;
      }
      
      // Only log once per session to avoid console spam
      if (!sessionStorage.getItem(`logged_${cacheKey}`)) {
        console.warn('Could not find image URL in tokenURI data', {message: "No metadata found"});
        sessionStorage.setItem(`logged_${cacheKey}`, 'true');
      }
    } catch (e) {
      // Only log once per session to avoid console spam
      if (!sessionStorage.getItem(`error_${cacheKey}`)) {
        console.error('Error extracting image from token data');
        sessionStorage.setItem(`error_${cacheKey}`, 'true');
      }
    }

    return null;
  };

  // Get and sanitize the image URL
  const rawImageUrl = getImageFromTokenData();
  const imageUrl = rawImageUrl ? sanitizeNFTImageUrl(rawImageUrl) : null;

  // Determine if we should use fallbacks
  const useFallback = isError || (isSuccess && !imageUrl) || errorCount > 2;

  return {
    tokenData,
    metadata: tokenData?.metadata || null,
    imageUrl,
    isLoading,
    isError,
    error,
    useFallback
  };
}

export default useTokenURI;
