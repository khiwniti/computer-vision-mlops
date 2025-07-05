import { useEffect, useRef, useState } from "react";

export interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // In development, always connect to the server port (5000)
    let host: string;
    if (import.meta.env.DEV) {
      host = 'localhost:5000';
    } else {
      host = window.location.host || 'localhost:5000';
    }
    const wsUrl = `${protocol}//${host}/ws`;
    
    const connect = () => {
      try {
        console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setIsConnected(true);
          setSocket(ws);
          reconnectAttempts.current = 0;
          console.log(`WebSocket connected to: ${wsUrl}`);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          setSocket(null);
          console.log("WebSocket disconnected");
          
          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
            setTimeout(connect, 2000 * reconnectAttempts.current);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
      }
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [url]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected");
    }
  };

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
  };
}
