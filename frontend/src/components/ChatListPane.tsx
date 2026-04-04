import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import MomentBar from './MomentBar';
import { ChatListSkeleton } from './ChatSkeletons';
import { getOptimizedAvatarUrl } from '../utils/cloudinaryUtils';

interface ChatListPaneProps {
  activeChatId?: string;
  onChatClick?: (chatId: string) => void;
  style?: React.CSSProperties;
}

const ChatListPane: React.FC<ChatListPaneProps> = ({ activeChatId, onChatClick, style }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'single' | 'group'>('single');
  const [moments, setMoments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [momentsRes, chatsRes] = await Promise.all([
          api.get('/moments'),
          api.get('/chats')
        ]);
        setMoments(momentsRes.data);
        setChats(chatsRes.data);
      } catch (err) {
        console.error('Failed to fetch chat logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredChats = chats.filter(chat => {
    const matchesTab = activeTab === 'group' ? chat.isGroup : !chat.isGroup;
    const matchesSearch = chat.isGroup 
      ? chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : chat.participants.some((p: any) => p.userid.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleChatSelect = (chatId: string) => {
    if (onChatClick) onChatClick(chatId);
    else navigate(`/chat/${chatId}`);
  };

  const renderLastMessage = (chat: any) => {
    const lastMsg = chat.lastMessage;
    if (!lastMsg) return 'Start chatting...';
    
    // Determine the sender prefix if needed (for groups)
    const senderName = chat.isGroup ? (String(lastMsg.sender?._id || lastMsg.sender) === String(user?._id) ? 'You: ' : `${lastMsg.sender?.name || 'User'}: `) : '';

    if (lastMsg.type === 'image') return `${senderName}📷 sent an image`;
    if (lastMsg.type === 'video') return `${senderName}🎥 sent a video`;
    if (lastMsg.type === 'post_share') return `${senderName}📤 shared a post`;
    if (lastMsg.type === 'emoji') return `${senderName}${lastMsg.text || '✨ sent an emoji'}`;
    
    return `${senderName}${lastMsg.text || 'New message...'}`;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#ffffff', 
      height: '100%', 
      borderLeft: '1px solid #f1f5f9',
      borderRight: '1px solid #f1f5f9',
      ...style 
    }}>
      {/* Header & Search */}
      <div style={{ padding: '20px 16px 10px', background: 'white' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Messages</h2>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', top: '12px', left: '16px', color: '#94a3b8' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 44px', 
              borderRadius: '12px', 
              border: 'none', 
              background: '#f1f5f9',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Moments Bar (Subtle Overlay) */}
      <div style={{ transform: 'scale(0.95)', transformOrigin: 'left' }}>
        <MomentBar moments={moments} onMomentClick={(id) => console.log('Moment click', id)} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
        <button 
          onClick={() => setActiveTab('single')}
          style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'single' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'single' ? 'var(--primary)' : '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}
        >
          Direct
        </button>
        <button 
          onClick={() => setActiveTab('group')}
          style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'group' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'group' ? 'var(--primary)' : '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}
        >
          Groups
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <ChatListSkeleton />
        ) : filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
            <p style={{ fontSize: '0.8rem' }}>No conversations yet</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div 
              key={chat._id} 
              onClick={() => handleChatSelect(chat._id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '14px 16px', 
                gap: '12px',
                cursor: 'pointer',
                background: activeChatId === chat._id ? 'rgba(99, 102, 241, 0.05)' : 'white',
                borderLeft: activeChatId === chat._id ? '4px solid var(--primary)' : '4px solid transparent',
                borderBottom: '1px solid #f8fafc',
                transition: 'all 0.2s'
              }}
            >
              <img 
                src={getOptimizedAvatarUrl(chat.isGroup ? chat.groupPic : chat.participants.find((p: any) => p.userid !== user?.userid)?.profilePic) || `https://ui-avatars.com/api/?name=${chat.isGroup ? 'Group' : chat.participants.find((p: any) => p.userid !== user?.userid)?.userid}`}
                alt=""
                style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.isGroup ? chat.name : chat.participants.find((p: any) => p.userid !== user?.userid)?.name}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {chat.lastMessage ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: chat.isRead ? '#64748b' : '#0f172a', fontWeight: chat.isRead ? 400 : 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {renderLastMessage(chat)}
                </p>
              </div>
              {!chat.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatListPane;
