import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    // In production, use wss:// and dynamic host
    const wsUrl = `ws://localhost:8000/ws/notifications/`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'activity_update') {
        setLastMessage(data.message);
        addToast(data.message.title, "success");
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
