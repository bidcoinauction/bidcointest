import { useState, useEffect, useCallback } from 'react';

type MessageHandler = (data: any) => void;
type MessageHandlers = {
  [key: string]: MessageHandler[];
};

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageHandlers: MessageHandlers = {};

  // Initialize WebSocket connection
  useEffect(() => {
    const connect = () => {
      try {
        // Determine protocol based on current protocol
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('Connecting to WebSocket at', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            
            // Handle messages based on their type
            if (message && message.type && messageHandlers[message.type]) {
              messageHandlers[message.type].forEach(handler => handler(message.data));
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('WebSocket connection error');
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
          
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (socket?.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, 5000);
        };

        setSocket(ws);

        // Clean up on unmount
        return () => {
          ws.close();
        };
      } catch (err) {
        console.error('Error setting up WebSocket:', err);
        setError('Failed to establish WebSocket connection');
      }
    };

    connect();
  }, []);

  // Function to subscribe to specific message types
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!messageHandlers[type]) {
      messageHandlers[type] = [];
    }
    messageHandlers[type].push(handler);

    // Return unsubscribe function
    return () => {
      if (messageHandlers[type]) {
        messageHandlers[type] = messageHandlers[type].filter(h => h !== handler);
      }
    };
  }, [messageHandlers]);

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, [socket]);

  return {
    isConnected,
    error,
    subscribe,
    sendMessage
  };
}

export default useWebSocket;