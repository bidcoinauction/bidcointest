import { useState, useEffect, useCallback, useRef } from 'react';

// Types for WebSocket messaging
type MessageHandler = (data: any) => void;
type MessageHandlers = {
  [key: string]: MessageHandler[];
};

// Types for auction subscription
interface AuctionSubscription {
  auctionId: number;
  lastUpdated: Date;
}

// Types for connection info
interface ConnectionInfo {
  clientId: string | null;
  serverVersion: string | null;
  connectedAt: Date | null;
  connectionCount: number;
  lastPingTime: number | null;
  latency: number | null;
}

/**
 * Enhanced WebSocket hook for real-time auction updates
 */
// Main exported hook function
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    clientId: null,
    serverVersion: null,
    connectedAt: null,
    connectionCount: 0,
    lastPingTime: null,
    latency: null
  });
  
  // Refs for internal state management
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<MessageHandlers>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<AuctionSubscription[]>([]);
  
  // Connection constants
  const MAX_RECONNECT_DELAY = 5000;
  const RECONNECT_DELAY = 3000;
  const PING_INTERVAL = 30000; // 30 seconds
  
  // Send a ping to check connection health and measure latency
  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const pingTime = Date.now();
      setConnectionInfo(prev => ({ ...prev, lastPingTime: pingTime }));
      socketRef.current.send(JSON.stringify({ 
        type: 'ping',
        data: { timestamp: pingTime } 
      }));
      return true;
    }
    return false;
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    let unmounted = false;

    const connect = () => {
      try {
        if (unmounted) return;

        // Clear any existing timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Close existing socket if it exists
        if (socketRef.current) {
          socketRef.current.close();
        }

        // Create new WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`[websocket] Connecting to ${wsUrl}...`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        // Connection established
        ws.onopen = () => {
          if (unmounted) return;
          console.log('[websocket] Connection established');
          setIsConnected(true);
          setError(null);
          
          // Start ping interval for connection health monitoring
          pingIntervalRef.current = setInterval(sendPing, PING_INTERVAL);

          // Resubscribe to any previous auctions
          subscriptionsRef.current.forEach(sub => {
            ws.send(JSON.stringify({
              type: 'subscribe',
              auctionId: sub.auctionId
            }));
          });
        };

        // Message received from server
        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const message = JSON.parse(event.data);
            
            // Special handling for connection info
            if (message.type === 'connected' && message.data) {
              console.log('[websocket] Connection confirmed by server:', message.data);
              setConnectionInfo(prev => ({
                ...prev,
                clientId: message.data.clientId || null,
                serverVersion: message.data.serverVersion || null,
                connectedAt: new Date(),
                connectionCount: prev.connectionCount + 1
              }));
            }
            
            // Handle pong responses for latency calculation
            if (message.type === 'pong' && connectionInfo.lastPingTime) {
              const latency = Date.now() - connectionInfo.lastPingTime;
              setConnectionInfo(prev => ({ ...prev, latency }));
            }
            
            // Handle subscription confirmations
            if (message.type === 'subscription-confirmed' && message.data?.auctionId) {
              const auctionId = message.data.auctionId;
              // Update subscription list if not already there
              if (!subscriptionsRef.current.some(s => s.auctionId === auctionId)) {
                subscriptionsRef.current.push({
                  auctionId,
                  lastUpdated: new Date()
                });
              }
            }
            
            // Forward message to all registered handlers for this message type
            if (message.type && handlersRef.current[message.type]) {
              handlersRef.current[message.type].forEach(handler => handler(message.data));
            }
          } catch (err) {
            console.error('[websocket] Error parsing message:', err);
          }
        };

        // Error handling
        ws.onerror = (event) => {
          if (unmounted) return;
          console.error('[websocket] Connection error:', event);
          setError('WebSocket connection error');
        };

        // Connection closed handler
        ws.onclose = (event) => {
          if (unmounted) return;
          console.log(`[websocket] Connection closed: ${event.code} ${event.reason}`);
          setIsConnected(false);
          
          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          
          // Attempt to reconnect after a delay, but only if it wasn't an intentional close
          if (!event.wasClean) {
            console.log(`[websocket] Reconnecting in ${RECONNECT_DELAY}ms...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY);
          }
        };
      } catch (err) {
        if (unmounted) return;
        console.error('[websocket] Setup error:', err);
        setError('Failed to establish WebSocket connection');
        
        // Try to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(connect, MAX_RECONNECT_DELAY);
      }
    };

    connect();

    // Clean up on unmount
    return () => {
      unmounted = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (socketRef.current) {
        // Properly close the WebSocket
        const socket = socketRef.current;
        socket.onclose = null; // Remove the event handler to prevent reconnection attempts
        socket.close();
        socketRef.current = null;
      }
    };
  }, [sendPing, connectionInfo.lastPingTime]);

  /**
   * Subscribe to specific auction updates
   * @param auctionId The auction ID to subscribe to
   */
  const subscribeToAuction = useCallback((auctionId: number) => {
    // Add to subscriptions list
    if (!subscriptionsRef.current.some(s => s.auctionId === auctionId)) {
      subscriptionsRef.current.push({
        auctionId,
        lastUpdated: new Date()
      });
    }
    
    // Send subscription message if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'subscribe',
        auctionId
      }));
      return true;
    }
    
    return false;
  }, []);

  /**
   * Request latest stats for an auction
   * @param auctionId The auction ID to get stats for
   */
  const requestAuctionStats = useCallback((auctionId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'auction-stats',
        auctionId
      }));
      return true;
    }
    return false;
  }, []);

  /**
   * Subscribe to specific message types
   * @param type The message type to subscribe to
   * @param handler The callback function for handling messages
   * @returns Unsubscribe function
   */
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current[type]) {
      handlersRef.current[type] = [];
    }
    handlersRef.current[type].push(handler);

    // Return unsubscribe function
    return () => {
      if (handlersRef.current[type]) {
        handlersRef.current[type] = handlersRef.current[type].filter(h => h !== handler);
      }
    };
  }, []);

  /**
   * Send a message through the WebSocket
   * @param type Message type
   * @param data Message data
   * @returns Success status
   */
  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, []);

  /**
   * Force a manual reconnection
   */
  const reconnect = useCallback(() => {
    console.log('[websocket] Manual reconnection initiated');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
    
    // Set a timeout to avoid immediate reconnection attempts
    reconnectTimeoutRef.current = setTimeout(() => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('[websocket] Reconnecting to', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      
      // Set up event handlers
      ws.onopen = () => {
        console.log('[websocket] Manual reconnection successful');
        setIsConnected(true);
        setError(null);
        
        // Start ping interval again
        pingIntervalRef.current = setInterval(sendPing, PING_INTERVAL);
        
        // Resubscribe to auctions
        subscriptionsRef.current.forEach(sub => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            auctionId: sub.auctionId
          }));
        });
      };
      
      ws.onclose = () => {
        console.log('[websocket] Manual reconnection failed');
        setIsConnected(false);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle connection confirmation
          if (message.type === 'connected' && message.data) {
            setConnectionInfo(prev => ({
              ...prev,
              clientId: message.data.clientId || null,
              serverVersion: message.data.serverVersion || null,
              connectedAt: new Date(),
              connectionCount: prev.connectionCount + 1
            }));
          }
          
          // Forward message to handlers
          if (message.type && handlersRef.current[message.type]) {
            handlersRef.current[message.type].forEach(handler => handler(message.data));
          }
        } catch (err) {
          console.error('[websocket] Error parsing message during reconnect:', err);
        }
      };
    }, 1000);
  }, [sendPing]);

  return {
    isConnected,
    error,
    connectionInfo,
    subscribe,
    subscribeToAuction,
    requestAuctionStats,
    sendMessage,
    sendPing,
    reconnect
  };
}

// Use named export only, not default