/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Image, ArrowLeft, MoreVertical, FileText, Play, Smile } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
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

  useEffect(() => {
     const socket = io({
       path: '/socket.io/',
       transports: ['polling', 'websocket'],
       rejectUnauthorized: false
     });
     socketRef.current = socket;

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
      setMessages(prev => [...prev, res.data]);
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 5 }}>
        {messages.map((msg) => {
          const isMe = msg.sender?._id === currentUser?._id;
          return (
            <div key={msg._id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', gap: '8px' }}>
              {!isMe && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, alignSelf: 'flex-end', marginBottom: '4px' }}>
                  <img src={msg.sender?.profilePic || `https://ui-avatars.com/api/?name=${msg.sender?.userid}&size=64`} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
              )}
              <div 
                onMouseEnter={() => setHoveredMessageId(msg._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                onPointerDown={(e) => {
                  if (e.pointerType === 'touch') {
                    isMe && handleLongPressStart(msg._id);
                  }
                }}
                onPointerUp={handleLongPressEnd}
                onPointerCancel={handleLongPressEnd}
                onContextMenu={(e) => {
                  if (selectedMessageId === msg._id || hoveredMessageId === msg._id) {
                    e.preventDefault();
                  }
                }}
                style={{ 
                  background: isMe ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.8))' : 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)',
                  padding: msg.type === 'post_share' ? '0' : '12px 16px',
                  borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  border: isMe ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'visible',
                  minWidth: msg.type === 'post_share' ? '240px' : 'auto',
                  transition: 'transform 0.1s ease',
                  transform: selectedMessageId === msg._id ? 'scale(0.98)' : 'scale(1)',
                  cursor: 'pointer',
                  userSelect: 'none', // Prevent text selection during long press
                  WebkitUserSelect: 'none'
                }}
              >
                {isMe && hoveredMessageId === msg._id && (
                  <div 
                    className="desktop-only" 
                    style={{ 
                      position: 'absolute', 
                      left: '-32px', 
                      top: 0, 
                      bottom: 0, 
                      width: '32px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                  >
                    <div 
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('Unsend?')) handleUnsendMessage(msg._id); }} 
                      style={{ 
                        background: 'rgba(255,255,255,0.15)', 
                        borderRadius: '50%', 
                        padding: '6px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s'
                      }}
                      className="hover-bg-white-translucent"
                      title="Unsend"
                    >
                      <ArrowLeft size={16} color="white" style={{ transform: 'rotate(90deg)', opacity: 0.9 }} />
                    </div>
                  </div>
                )}
                {isMe && selectedMessageId === msg._id && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '-40px', 
                      left: '50%', 
                      transform: 'translateX(-50%)', 
                      background: '#ef4444', 
                      color: 'white', 
                      padding: '6px 12px', 
                      borderRadius: '10px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
                      zIndex: 1000, 
                      whiteSpace: 'nowrap' 
                    }} 
                    onPointerDown={(e) => e.stopPropagation()} // Stop bubbling to bubble's long press
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleUnsendMessage(msg._id); 
                      setSelectedMessageId(null); 
                    }}
                    className="unsend-btn"
                  >
                    Unsend
                  </div>
                )}

                {msg.type === 'post_share' && msg.sharedPost ? (
                  <div onClick={() => setActiveSharedContent(msg.sharedPost)} style={{ cursor: 'pointer' }}>
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)' }}>
                      <img src={msg.sharedPost.author?.profilePic || `https://ui-avatars.com/api/?name=${msg.sharedPost.author?.userid}`} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{msg.sharedPost.author?.userid}</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
                      {msg.sharedPost.type?.toLowerCase() === 'video' ? (
                        <>
                          <video src={msg.sharedPost.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', padding: '8px' }}><Play size={20} color="white" fill="white" /></div>
                        </>
                      ) : msg.sharedPost.type?.toLowerCase() === 'image' ? (
                        <img src={msg.sharedPost.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      ) : (
                        <div style={{ padding: '20px', color: 'white', backgroundColor: '#1e293b', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <FileText size={40} style={{ marginBottom: '12px', opacity: 0.9 }} />
                          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.sharedPost.caption || 'Shared a blog'}</p>
                        </div>
                      )}
                      {msg.sharedPost.type?.toLowerCase() !== 'blog' && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', fontSize: '0.75rem' }}>
                          <p style={{ margin: 0, opacity: 0.9 }}>View {msg.sharedPost.type?.toLowerCase() === 'video' ? 'Byte' : 'Post'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.5', fontWeight: 500, letterSpacing: '0.01em' }}>{msg.text}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: msg.type === 'post_share' ? '8px' : '4px 0 0', opacity: 0.7 }}>
                  <span style={{ fontSize: '0.65rem' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8' }}></div>}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: (selectedMessageId && !isLongPressing) ? 999 : -1 }} onClick={() => setSelectedMessageId(null)}></div>
        <div ref={messagesEndRef} />
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
