/**
 * API utilities for BidCoin platform
 * Provides base functionality for API requests
 */

// Base API URL
const API_BASE = "/api";

// Generic fetch function with improved error handling
export async function fetchFromAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
      let errorMessage = "";
      try {
        // Try to parse JSON error response
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
        // If not JSON, get plain text
        errorMessage = await response.text();
      }
      
      const error = new Error(`API Error (${response.status}): ${errorMessage}`);
      // Add response details to the error object for better debugging
      (error as any).status = response.status;
      (error as any).endpoint = endpoint;
      throw error;
    }
    
    return response.json();
  } catch (err) {
    // Handle network errors (like CORS, connection issues)
    if (!(err instanceof Error) || !err.message.includes('API Error')) {
      console.error(`Network error when fetching from ${endpoint}:`, err);
      throw new Error(`Network error when connecting to server. Please check your connection and try again.`);
    }
    throw err;
  }
}

/**
 * Cached API fetch function with expiration
 * @param endpoint API endpoint to fetch from
 * @param options Request options
 * @param cacheDuration Cache duration in milliseconds (default: 5 minutes)
 * @returns Fetched data (either from cache or fresh)
 */
export async function fetchWithCache<T>(endpoint: string, options?: RequestInit, cacheDuration: number = 300000): Promise<T> {
  // Create a cache key based on the endpoint and request method
  const cacheKey = `${endpoint}:${options?.method || 'GET'}`;
  
  try {
    // Check if we have a valid cached response
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
      const { data, timestamp } = JSON.parse(cachedItem);
      // If cache is still valid, return the cached data
      if (Date.now() - timestamp < cacheDuration) {
        return data as T;
      }
    }
  } catch (e) {
    // If there's an error accessing cache, proceed with fresh fetch
    console.warn('Cache access error:', e);
  }
  
  // Fetch fresh data
  const data = await fetchFromAPI<T>(endpoint, options);
  
  // Cache the fresh data
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // If storing in cache fails, just log a warning
    console.warn('Failed to cache API response:', e);
  }
  
  return data;
}

/**
 * Send a HTTP POST request to the API
 * @param endpoint API endpoint
 * @param data Request body data
 * @returns Response data
 */
export async function postToAPI<T, U = any>(endpoint: string, data: U): Promise<T> {
  return fetchFromAPI<T>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Send a HTTP PUT request to the API
 * @param endpoint API endpoint
 * @param data Request body data
 * @returns Response data
 */
export async function putToAPI<T, U = any>(endpoint: string, data: U): Promise<T> {
  return fetchFromAPI<T>(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Send a HTTP DELETE request to the API
 * @param endpoint API endpoint
 * @returns Response data
 */
export async function deleteFromAPI<T>(endpoint: string): Promise<T> {
  return fetchFromAPI<T>(endpoint, {
    method: 'DELETE'
  });
}

/**
 * Invalidate a specific cache entry
 * @param endpoint The endpoint to invalidate
 * @param method The HTTP method (default: GET)
 */
export function invalidateCache(endpoint: string, method: string = 'GET'): void {
  const cacheKey = `${endpoint}:${method}`;
  try {
    sessionStorage.removeItem(cacheKey);
  } catch (e) {
    console.warn('Failed to invalidate cache:', e);
  }
}

/**
 * Clear all API cache entries
 */
export function clearAPICache(): void {
  try {
    // Get all keys from sessionStorage
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes(':')) {
        keys.push(key);
      }
    }
    
    // Remove all API cache entries
    keys.forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (e) {
    console.warn('Failed to clear API cache:', e);
  }
}