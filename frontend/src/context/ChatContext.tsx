import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../services/api';
import { useUser } from './UserContext';
import { useSocket } from './SocketContext';

interface ChatContextType {
  unreadChatCount: number;
  refreshUnreadChatCount: () => Promise<void>;
  clearUnreadChatCount: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { user } = useUser();
  const socketObj = useSocket();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chats/unread-count');
      setUnreadChatCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch unread chat count', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      const socket = socketObj?.socket;
      
      // Listen for socket messages to update count
      if (socket) {
        socket.on('new_message', () => {
           fetchUnreadCount();
        });
        
        socket.on('message_read', () => {
           fetchUnreadCount();
        });
      }

      // Polling fallback
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => {
        clearInterval(interval);
        if (socket) {
          socket.off('new_message');
          socket.off('message_read');
        }
      };
    } else {
      setUnreadChatCount(0);
    }
  }, [user, fetchUnreadCount, socketObj]);

  return (
    <ChatContext.Provider value={{ 
      unreadChatCount, 
      refreshUnreadChatCount: fetchUnreadCount,
      clearUnreadChatCount: () => setUnreadChatCount(0) 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
