/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import GroupInfoModal from '../components/GroupInfoModal';
import PostDetailModal from '../components/PostDetailModal';
import BlogDetailModal from '../components/BlogDetailModal';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';

import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';

interface SharedPost {
  _id: string;
  type: string;
  content: string;
  caption?: string;
  author?: {
    userid: string;
    name: string;
    profilePic: string;
    isVerified?: boolean;
  };
}

interface Chat {
  _id: string;
  participants: any[];
  isGroup: boolean;
  name?: string;
  groupPic?: string;
  admins?: string[];
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    userid: string;
    name: string;
    profilePic?: string;
  };
  text: string;
  media?: string;
  type: 'text' | 'image' | 'video' | 'post_share' | 'emoji';
  sharedPost?: SharedPost;
  createdAt: string;
  isOptimistic?: boolean;
}

const emojiCategories = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'] },
  { name: 'Hands', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { name: 'Other', emojis: ['✨', '🌟', '🔥', '💥', '💯', '💢', '💨', '💦', '🕳', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'] }
];

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useUser();
  const { socket } = useSocket();
  const { refreshUnreadChatCount } = useChat();
  const queryClient = useQueryClient();

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [activeSharedContent, setActiveSharedContent] = useState<any | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [actionMessage, setActionMessage] = useState<Message | null>(null);

  const virtuosoRef = useRef<any>(null);

  // Fetch Chat Details
  const { data: chat, isLoading: isChatLoading } = useQuery<Chat>({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const res = await api.get(`/chats/${chatId}`);
      return res.data;
    },
    enabled: !!chatId,
  });

  // Fetch Messages
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const res = await api.get(`/chats/${chatId}/messages`);
      api.put(`/chats/${chatId}/read`)
        .then(() => refreshUnreadChatCount())
        .catch(console.error);
      return res.data;
    },
    enabled: !!chatId,
  });

  // Socket Listener for Real-time
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
        if (old?.some(m => m._id === message._id)) return old;
        api.put(`/chats/${chatId}/read`)
          .then(() => refreshUnreadChatCount())
          .catch(console.error);
        return [...(old || []), message];
      });
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
        return old?.filter(m => m._id !== messageId);
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, chatId, queryClient]);

  // Scroll fix for long lists and new messages
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Send Message Mutation (Optimistic)
  const sendMutation = useMutation({
    mutationFn: (text: string) => api.post(`/chats/${chatId}/messages`, { text }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);

      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: user?._id || '',
          userid: user?.userid || '',
          name: user?.name || '',
          profilePic: user?.profilePic
        },
        text,
        type: 'text',
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => [...(old || []), tempMessage]);
      return { previousMessages };
    },
    onError: (_err, _text, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', chatId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  const sendMediaMutation = useMutation({
    mutationFn: (data: { media: string, type: string }) => api.post(`/chats/${chatId}/messages`, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);

      const tempMessage: Message = {
        _id: `temp-media-${Date.now()}`,
        sender: {
          _id: user?._id || '',
          userid: user?.userid || '',
          name: user?.name || '',
          profilePic: user?.profilePic
        },
        text: '',
        media: data.media.startsWith('data:') ? '' : data.media,
        type: data.type as any,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => [...(old || []), tempMessage]);
      return { previousMessages };
    },
    onSuccess: () => {
      setIsUploading(false);
    },
    onError: (err, _vars, context) => {
      setIsUploading(false);
      console.error('Media upload error:', err);
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', chatId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  // Delete Message Mutation
  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => api.delete(`/chats/messages/${messageId}`),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);
      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => old?.filter(m => m._id !== messageId));
      return { previousMessages };
    },
    onError: (_err, _id, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', chatId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  const handleSendMessage = (text: string) => {
    sendMutation.mutate(text);
  };

  const handleMediaSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const type = file.type.startsWith('image') ? 'image' : 'video';
      setIsUploading(true);
      sendMediaMutation.mutate({ media: base64String, type });
    };
    reader.readAsDataURL(file);
  };

  const handleLongPressStart = (messageId: string) => {
    const timer = setTimeout(() => {
      setSelectedMessageId(messageId);
      const msg = messages.find(m => m._id === messageId);
      if (msg) setActionMessage(msg);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  if (isChatLoading || isMessagesLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}>
        <FileText size={48} color="#818cf8" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Exploring the universe...</p>
      </div>
    );
  }

  const otherParticipant = chat?.participants?.find((p: any) => p._id !== user?._id) || null;
  const chatName = chat?.isGroup ? chat.name : (otherParticipant?.name || 'Unknown');
  const chatSubtext = chat?.isGroup ? `${chat.participants.length} members` : `@${otherParticipant?.userid || ''}`;
  const chatAvatar = (chat?.isGroup ? (chat.groupPic || '') : otherParticipant?.profilePic) || '';

  return (
    <div className="chat-page-container" style={{ 
      height: '100dvh', 
      minHeight: '-webkit-fill-available',
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      position: 'relative',
      width: '100%'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.6)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, transparent, rgba(15, 23, 42, 0.4))', zIndex: 1 }}></div>

      <ChatHeader 
        chat={chat} 
        otherParticipant={otherParticipant} 
        chatName={chatName} 
        chatSubtext={chatSubtext} 
        chatAvatar={chatAvatar}
        setIsGroupInfoOpen={setIsGroupInfoOpen}
      />

      <div style={{ flex: 1, zIndex: 5, display: 'flex', flexDirection: 'column' }}>
        <MessageList 
          ref={virtuosoRef}
          messages={messages}
          user={user}
          selectedMessageId={selectedMessageId}
          hoveredMessageId={hoveredMessageId}
          setHoveredMessageId={setHoveredMessageId}
          handleLongPressStart={handleLongPressStart}
          handleLongPressEnd={handleLongPressEnd}
          handleUnsendMessage={(msg) => setActionMessage(msg)}
          setActiveSharedContent={setActiveSharedContent}
          chatAvatar={chatAvatar}
          chatName={chatName}
          otherParticipantId={otherParticipant?.userid || ''}
        />
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage}
        onMediaSelect={handleMediaSelect}
        isUploading={isUploading}
        isPending={sendMutation.isPending}
        emojiCategories={emojiCategories}
      />

      {isGroupInfoOpen && chat && <GroupInfoModal chat={chat} onClose={() => setIsGroupInfoOpen(false)} currentUser={user} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['chat', chatId] })} />}
      {activeSharedContent && (activeSharedContent.type === 'Blog' ? <BlogDetailModal post={activeSharedContent} onClose={() => setActiveSharedContent(null)} /> : <PostDetailModal post={activeSharedContent} onClose={() => setActiveSharedContent(null)} />)}

      {actionMessage && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={() => { setActionMessage(null); setSelectedMessageId(null); }} />
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: '400px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1001, overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ margin: 0, color: 'white', opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Unsend Message?
              </p>
              <p style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 500, opacity: 0.9 }}>
                Unsending will remove this message for everyone in the chat.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button 
                onClick={() => { deleteMutation.mutate(actionMessage._id); setActionMessage(null); setSelectedMessageId(null); }} 
                style={{ padding: '18px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                Unsend for Everyone
              </button>
              <button 
                onClick={() => { setActionMessage(null); setSelectedMessageId(null); }} 
                style={{ padding: '18px', background: 'transparent', border: 'none', color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translate(-50%, 100%); } to { transform: translate(-50%, 0); } }
        .emoji-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
        .hover-bg-white-translucent:hover { background: rgba(255,255,255,0.25) !important; transform: scale(1.1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        @media (max-width: 768px) { .desktop-only { display: none !important; } .chat-page-container { padding: 0 4px; } }
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
};

export default ChatPage;
