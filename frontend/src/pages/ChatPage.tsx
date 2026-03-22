/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Image, ArrowLeft, MoreVertical, FileText, Smile } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { Virtuoso } from 'react-virtuoso';
import MessageBubble from '../components/MessageBubble';
import GroupInfoModal from '../components/GroupInfoModal';
import PostDetailModal from '../components/PostDetailModal';
import BlogDetailModal from '../components/BlogDetailModal';

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
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [activeSharedContent, setActiveSharedContent] = useState<any | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false); // Added
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<any>(null);

  useEffect(() => {
     // Use dynamic socket URL: relative '/' in dev (via proxy) or the Render URL in production
    const socketUrl = import.meta.env.DEV ? 'http://localhost:5000' : 'https://social-verse-backend-w9xr.onrender.com';
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

     return () => {
       if (socketRef.current) {
         socketRef.current.disconnect();
       }
     };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    let isMounted = true;
    const loadChat = async () => {
      try {
        const [chatRes, msgRes, userRes] = await Promise.all([
          api.get(`/chats/${chatId}`),
          api.get(`/chats/${chatId}/messages`),
          api.get('/users/me')
        ]);
        if (isMounted) {
          setChat(chatRes.data);
          setMessages(msgRes.data);
          setCurrentUser(userRes.data);
          setLoading(false);

          if (socketRef.current) {
            socketRef.current.emit('register', userRes.data._id);
          }
        }
      } catch (error) {
        console.error('Error loading space chat:', error);
        if (isMounted) setLoading(false);
      }
    };
    loadChat();

    if (socketRef.current) {
      socketRef.current.on('new_message', (message: Message) => {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      });

      socketRef.current.on('message_deleted', ({ messageId }: { messageId: string }) => {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      });
    }

    return () => { 
      isMounted = false; 
      if (socketRef.current) {
        socketRef.current.off('new_message');
        socketRef.current.off('message_deleted');
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post(`/chats/${chatId}/messages`, { text: newMessage });
      // The socket.io server broadcats to everyone including sender.
      // To prevent duplication, only add if someone else or API hasn't added it yet.
      setMessages(prev => {
        if (prev.some(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUnsendMessage = async (messageId: string) => {
    try {
      await api.delete(`/chats/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (error) {
      console.error('Error unsending message:', error);
    }
  };

  const handleLongPressStart = (messageId: string) => {
    const timer = setTimeout(() => {
      setSelectedMessageId(messageId);
      setIsLongPressing(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // Sustain long pressing state briefly to block immediate click
    setTimeout(() => setIsLongPressing(false), 300);
  };

  const commonEmojis = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂', '💯', '✨', '👍', '👎'];

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}>
        <FileText size={48} color="#818cf8" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Exploring the universe...</p>
      </div>
    );
  }

  const otherParticipant = chat?.participants?.find((p: any) => p._id !== currentUser?._id) || null;
  const chatName = chat?.isGroup ? chat.name : (otherParticipant?.name || otherParticipant?.userid || 'Unknown User');
  const chatAvatar = (chat?.isGroup ? '' : otherParticipant?.profilePic) || '';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.6)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, transparent, rgba(15, 23, 42, 0.4))', zIndex: 1 }}></div>

      <header style={{ flexShrink: 0, height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 100, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => chat?.isGroup ? setIsGroupInfoOpen(true) : otherParticipant && navigate(`/profile/${otherParticipant.userid}`)}>
          <ArrowLeft onClick={(e: any) => { e.stopPropagation(); navigate(-1); }} style={{ cursor: 'pointer', color: 'white' }} />
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.8)', background: '#f1f5f9' }}>
            <img src={chatAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'C')}&background=random`} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{chatName}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9, color: '#e2e8f0', fontWeight: 500 }}>{chat?.isGroup ? `${chat.participants.length} members` : 'Active now'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {chat?.isGroup && <MoreVertical size={20} onClick={() => setIsGroupInfoOpen(true)} style={{ color: 'white', cursor: 'pointer' }} />}
        </div>
      </header>

      <div style={{ flex: 1, zIndex: 5, display: 'flex', flexDirection: 'column' }}>
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
          style={{ flex: 1, padding: '20px' }}
          itemContent={(_, msg) => {
            const isMe = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
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
                handleUnsendMessage={handleUnsendMessage}
                setSelectedMessageId={setSelectedMessageId}
                setActiveSharedContent={setActiveSharedContent}
              />
            );
          }}
          components={{
            Footer: () => <div style={{ height: '20px' }} />
          }}
        />
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: (selectedMessageId && !isLongPressing) ? 999 : -1 }} onClick={() => setSelectedMessageId(null)}></div>
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
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onFocus={() => setShowEmojiPicker(false)} placeholder="Explore the universe..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px 4px', outline: 'none', fontSize: '0.95rem' }} />
          <button type="submit" disabled={!newMessage.trim()} style={{ background: 'transparent', border: 'none', color: newMessage.trim() ? '#818cf8' : 'rgba(255,255,255,0.3)', fontWeight: 'bold', cursor: 'pointer', marginLeft: '8px' }}><Send size={24} /></button>
        </form>
      </footer>

      {isGroupInfoOpen && chat && <GroupInfoModal chat={chat} onClose={() => setIsGroupInfoOpen(false)} currentUser={currentUser} onUpdate={async () => { const res = await api.get(`/chats/${chatId}`); setChat(res.data); }} />}
      {activeSharedContent && (activeSharedContent.type === 'Blog' ? <BlogDetailModal post={activeSharedContent} onClose={() => setActiveSharedContent(null)} /> : <PostDetailModal post={activeSharedContent} onClose={() => setActiveSharedContent(null)} />)}

      <style>{`
        .emoji-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
        .unsend-btn:active {
          background: #b91c1c !important;
          transform: translateX(-50%) scale(0.9) !important;
        }
        .hover-bg-white-translucent:hover {
          background: rgba(255,255,255,0.25) !important;
          transform: scale(1.1);
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        @media (max-width: 768px) { .desktop-only { display: none !important; } }
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
};

export default ChatPage;
