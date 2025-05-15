import { useState, useEffect, useCallback, useRef } from 'react';

type MessageHandler = (data: any) => void;
type MessageHandlers = {
  [key: string]: MessageHandler[];
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<MessageHandlers>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECONNECT_DELAY = 5000;
  const RECONNECT_DELAY = 3000;

  // Initialize WebSocket connection
  useEffect(() => {
    let unmounted = false;

    const connect = () => {
      try {
        if (unmounted) return;

        // Clear any existing reconnect timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Close existing socket if it exists
        if (socketRef.current) {
          socketRef.current.close();
        }

        // Determine protocol based on current protocol
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const message = JSON.parse(event.data);
            
            // Handle messages based on their type
            if (message && message.type && handlersRef.current[message.type]) {
              handlersRef.current[message.type].forEach(handler => handler(message.data));
            }
          } catch (err) {
            // Silent error handling
          }
        };

        ws.onerror = (event) => {
          if (unmounted) return;
          setError('WebSocket connection error');
        };

        ws.onclose = (event) => {
          if (unmounted) return;
          setIsConnected(false);
          
          // Attempt to reconnect after a delay, but only if it wasn't an intentional close
          if (!event.wasClean) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY);
          }
        };
      } catch (err) {
        if (unmounted) return;
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
      
      if (socketRef.current) {
        // Properly close the WebSocket
        const socket = socketRef.current;
        socket.onclose = null; // Remove the event handler to prevent reconnection attempts
        socket.close();
        socketRef.current = null;
      }
    };
  }, []);

  // Function to subscribe to specific message types
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

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, []);

  // Function to manually reconnect if needed
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
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
      
      console.log('Manually reconnecting to WebSocket at', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      
      // Set up event handlers (simplified for manual reconnect)
      ws.onopen = () => {
        console.log('Manual WebSocket reconnection successful');
        setIsConnected(true);
        setError(null);
      };
      
      ws.onclose = () => {
        console.log('Manual WebSocket reconnection failed');
        setIsConnected(false);
      };
    }, 1000);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    sendMessage,
    reconnect
  };
}

export default useWebSocket;