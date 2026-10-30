import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { isNativeApp } from '../utils/nativeBridge';

const SocketContext = createContext();

const DEFAULT_CLOUD_API = 'https://f1634fc82e76ce.lhr.life';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_SERVER_URL = localStorage.getItem('cityconnect_backend_url') || import.meta.env.VITE_BACKEND_URL || (isNativeApp() ? DEFAULT_CLOUD_API : 'http://localhost:5000');

    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to Express server at', SOCKET_SERVER_URL);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
