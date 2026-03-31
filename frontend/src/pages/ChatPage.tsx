/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Image, ArrowLeft, MoreVertical, FileText, Smile } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Virtuoso } from 'react-virtuoso';
import MessageBubble from '../components/MessageBubble';
import GroupInfoModal from '../components/GroupInfoModal';
import PostDetailModal from '../components/PostDetailModal';
import BlogDetailModal from '../components/BlogDetailModal';
import { formatRelativeTime } from '../utils/timeUtils';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import VerifiedBadge from '../components/VerifiedBadge';

interface SharedPost {
  _id: string;
  type: string;
  content: string;
  caption?: string;
  author?: {
    userid: string;
    name: string;
    profilePic: string;
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

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { socket } = useSocket();
  const { refreshUnreadChatCount } = useChat();
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = useState('');
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [activeSharedContent, setActiveSharedContent] = useState<any | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [isConfirmingUnsend, setIsConfirmingUnsend] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      setNewMessage('');
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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
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

  const commonEmojis = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂', '💯', '✨', '👍', '👎'];

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

      <header style={{ flexShrink: 0, height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 100, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => chat?.isGroup ? setIsGroupInfoOpen(true) : otherParticipant && navigate(`/profile/${otherParticipant.userid}`)}>
          <ArrowLeft onClick={(e: any) => { e.stopPropagation(); navigate(-1); }} style={{ cursor: 'pointer', color: 'white' }} />
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.8)', background: '#f1f5f9' }}>
            <img src={chatAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'C')}&background=random`} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center' }}>
              {chatName}
              {!chat?.isGroup && otherParticipant?.isVerified && <VerifiedBadge size={14} />}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9, color: '#e2e8f0', fontWeight: 500 }}>
              {chat?.isGroup ? chatSubtext : (
                <>
                  {chatSubtext && <span style={{ marginRight: '8px' }}>{chatSubtext}</span>}
                  {otherParticipant?.lastSeen
                    ? (new Date().getTime() - new Date(otherParticipant.lastSeen).getTime() < 2 * 60 * 1000
                      ? '• Active now'
                      : `• Active ${formatRelativeTime(otherParticipant.lastSeen)}`)
                    : '• Offline'}
                </>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {chat?.isGroup && <MoreVertical size={20} onClick={() => setIsGroupInfoOpen(true)} style={{ color: 'white', cursor: 'pointer' }} />}
        </div>
      </header>

      <div style={{ flex: 1, zIndex: 5, display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.2)', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
              <img src={chatAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'C')}&background=random`} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>{chatName}</h2>
            <p style={{ fontSize: '1rem', opacity: 0.7, margin: '0 0 20px 0' }}>@{otherParticipant?.userid || ''}</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>Start the conversation with {chat?.isGroup ? chatName : `@${otherParticipant?.userid || ''}`}</p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
            style={{ flex: 1, padding: '20px 0' }}
            itemContent={(_, msg) => {
              const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
              return (
                <MessageBubble
                  key={msg._id}
                  msg={msg}
                  isMe={isMe}
                  selectedMessageId={selectedMessageId}
                  hoveredMessageId={hoveredMessageId}
                  setHoveredMessageId={setHoveredMessageId}
                  handleLongPressStart={handleLongPressStart}
                  handleLongPressEnd={handleLongPressEnd}
                  handleUnsendMessage={() => { setActionMessage(msg); setIsConfirmingUnsend(true); }}
                  setActiveSharedContent={setActiveSharedContent}
                />
              );
            }}
          />
        )}
      </div>

      <footer style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(30px)', zIndex: 10, borderTop: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
        {showEmojiPicker && (
          <div style={{ position: 'absolute', bottom: '80px', left: '16px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 100 }}>
            {commonEmojis.map(emoji => (
              <button key={emoji} onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '4px', borderRadius: '8px' }} className="emoji-btn">{emoji}</button>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '4px 12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div style={{ display: 'flex', gap: '8px', marginRight: '8px', alignItems: 'center' }}>
            <Image size={22} style={{ opacity: 0.7, cursor: 'pointer' }} />
            <Smile size={22} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="desktop-only" style={{ opacity: 0.7, cursor: 'pointer' }} />
          </div>
          <input type="text" id="message-input" name="message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onFocus={() => setShowEmojiPicker(false)} placeholder="Explore the universe..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px 4px', outline: 'none', fontSize: '0.95rem' }} />
          <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending} style={{ background: 'transparent', border: 'none', color: newMessage.trim() ? '#818cf8' : 'rgba(255,255,255,0.3)', fontWeight: 'bold', cursor: 'pointer', marginLeft: '8px' }}><Send size={24} /></button>
        </form>
      </footer>

      {isGroupInfoOpen && chat && <GroupInfoModal chat={chat} onClose={() => setIsGroupInfoOpen(false)} currentUser={user} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['chat', chatId] })} />}
      {activeSharedContent && (activeSharedContent.type === 'Blog' ? <BlogDetailModal post={activeSharedContent} onClose={() => setActiveSharedContent(null)} /> : <PostDetailModal post={activeSharedContent} onClose={() => setActiveSharedContent(null)} />)}

      {actionMessage && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={() => { setActionMessage(null); setSelectedMessageId(null); setIsConfirmingUnsend(false); }} />
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: '400px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1001, overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ margin: 0, color: 'white', opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                {isConfirmingUnsend ? 'Are you sure?' : 'Manage Message'}
              </p>
              <p style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 500, opacity: 0.9 }}>
                {isConfirmingUnsend ? 'Unsending will remove this message for everyone in the chat.' : (actionMessage.text || 'Media')}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!isConfirmingUnsend ? (
                <>
                  <button onClick={() => setIsConfirmingUnsend(true)} style={{ padding: '18px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Unsend</button>
                  <button onClick={() => { setActionMessage(null); setSelectedMessageId(null); }} style={{ padding: '18px', background: 'transparent', border: 'none', color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { deleteMutation.mutate(actionMessage._id); setActionMessage(null); setSelectedMessageId(null); setIsConfirmingUnsend(false); }} style={{ padding: '18px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Unsend for Everyone</button>
                  <button onClick={() => setIsConfirmingUnsend(false)} style={{ padding: '18px', background: 'transparent', border: 'none', color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
                </>
              )}
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
