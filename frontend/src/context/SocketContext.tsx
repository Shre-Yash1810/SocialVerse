import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      const isDev = import.meta.env.DEV;
      const socketUrl = isDev ? '' : 'https://social-verse-backend-w9xr.onrender.com';
      
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: isDev ? ['polling'] : ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected');
        socket.emit('register', user._id);
      });

      socketRef.current = socket;
    }

    return () => {
      // We don't disconnect on unmount of children, 
      // but we might want to cleanup if the user logs out (handled above)
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('heartbeat', user._id);
      }
    }, 60000); // Heartbeat every 60 seconds

    return () => clearInterval(interval);
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
